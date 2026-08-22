import type { JsonValue } from '@code-retrainer/core';
import { parseJson } from '@code-retrainer/core';

import type {
  BootConfig,
  BootResult,
  DiagnoseResult,
  ExecuteResult,
  TestRunResult,
  TraceRunResult,
} from './protocol.ts';
import { toDiagnoseResult, toExecuteResult, toTestRunResult } from './results.ts';

/**
 * What a value crossing into Python may be.
 *
 * Everything this engine passes is a primitive: payloads are serialised to
 * JSON first, so no Python object proxy is ever created or has to be freed.
 */
export type PyodideGlobal = string | number | boolean;

/** What `runPython` gives back for the expressions this engine evaluates. */
export type PyodideResult = string | number | boolean | null;

/** The slice of the Pyodide API this engine uses. */
export interface PyodideApi {
  FS: {
    mkdirTree(path: string): void;
    // Emscripten encodes string data as UTF-8; there is no encoding option.
    writeFile(path: string, data: string): void;
  };
  globals: { set(name: string, value: PyodideGlobal): void };
  runPython(code: string): PyodideResult;
  loadPackage(names: string | string[]): Promise<void>;
  pyimport(name: string): { install(spec: string): Promise<void> };
}

export interface PyodideLoadOptions {
  indexURL?: string;
  /**
   * Pyodide's own stream handlers. Supplying them matters for more than
   * tidiness: inside a worker thread its default Node adapter writes to
   * `process.stdout.fd`, which does not exist there, and booting fails.
   */
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

export type PyodideLoader = (options: PyodideLoadOptions) => Promise<PyodideApi>;

const SUPPORT_DIR = '/code-retrainer';
const REPORT_PATH = '/work/.code-retrainer/report.json';

/**
 * Drives CPython-in-WebAssembly.
 *
 * Runs inside a worker, and holds no timers of its own: cancellation is the
 * caller terminating the whole worker, which is the only thing that can
 * interrupt a tight Python loop. Everything here therefore assumes it may be
 * killed at any instruction and that nothing needs unwinding.
 */
export class PyodideEngine {
  private constructor(
    private readonly pyodide: PyodideApi,
    readonly info: BootResult,
  ) {}

  static async boot(
    loadPyodide: PyodideLoader,
    config: BootConfig,
    report: (message: string) => void = () => {},
  ): Promise<PyodideEngine> {
    const startedAt = Date.now();

    report('Downloading Python…');
    const pyodide = await loadPyodide({
      ...(config.indexUrl ? { indexURL: config.indexUrl } : {}),
      // Anything Python writes during a run is captured inside the interpreter
      // by `pyodide_host`, which is what the caller actually receives. These
      // handlers only catch what escapes that — boot chatter and interpreter
      // diagnostics — and must not reach the host's real streams.
      stdout: (text: string) => report(`python: ${text}`),
      stderr: (text: string) => report(`python: ${text}`),
    });

    const packages = config.packages ?? ['pytest'];
    if (packages.length > 0) {
      report('Installing pytest…');
      await pyodide.loadPackage('micropip');
      const micropip = pyodide.pyimport('micropip');
      for (const spec of packages) await micropip.install(spec);
    }

    report('Preparing the workspace…');
    pyodide.FS.mkdirTree(SUPPORT_DIR);
    for (const [name, source] of Object.entries(config.supportModules)) {
      // Keys are paths, not filenames: the support modules are a package, so
      // `retrainer/` has to exist before anything can be written into it.
      const slash = name.lastIndexOf('/');
      if (slash > 0) pyodide.FS.mkdirTree(`${SUPPORT_DIR}/${name.slice(0, slash)}`);
      pyodide.FS.writeFile(`${SUPPORT_DIR}/${name}`, source);
    }
    pyodide.FS.writeFile(`${SUPPORT_DIR}/pyodide_host.py`, config.hostSource);

    pyodide.globals.set('_retrainer_support_dir', SUPPORT_DIR);
    pyodide.runPython(`
import sys
if _retrainer_support_dir not in sys.path:
    sys.path.insert(0, _retrainer_support_dir)
import pyodide_host
pyodide_host.reset_workspace()
`);

    const pythonVersion = String(
      pyodide.runPython('import sys; ".".join(str(part) for part in sys.version_info[:3])') ?? '',
    );
    const pytestVersion = String(
      pyodide.runPython(`
try:
    import pytest
    _retrainer_pytest_version = pytest.__version__
except Exception:
    _retrainer_pytest_version = ""
_retrainer_pytest_version
`) ?? '',
    );

    return new PyodideEngine(pyodide, {
      pythonVersion,
      pytestVersion: pytestVersion || null,
      bootMs: Date.now() - startedAt,
    });
  }

  /**
   * Replace the workspace with `files`. Isolation is per execution: the
   * previous run's files, and its imported modules, are gone before this one
   * can see them.
   */
  #materialise(files: Readonly<Record<string, string>>): void {
    // Payloads travel as globals rather than being interpolated into source.
    // Escaping learner code into a Python string literal is a code-injection
    // bug waiting to happen, and there is no reason to take the risk.
    this.pyodide.globals.set('_retrainer_files', JSON.stringify(files));
    this.pyodide.runPython(
      'import pyodide_host\npyodide_host.reset_workspace()\npyodide_host.write_files(_retrainer_files)',
    );
  }

  execute(request: {
    files: Readonly<Record<string, string>>;
    entryPoint: string;
    args: readonly string[];
    stdin: string;
    maxOutputBytes: number;
  }): ExecuteResult {
    this.#materialise(request.files);
    this.pyodide.globals.set('_retrainer_entry', request.entryPoint);
    this.pyodide.globals.set('_retrainer_argv', JSON.stringify(request.args));
    this.pyodide.globals.set('_retrainer_stdin', request.stdin);
    this.pyodide.globals.set('_retrainer_limit', request.maxOutputBytes);
    return this.#json(
      'import pyodide_host\npyodide_host.run_program(_retrainer_entry, _retrainer_argv, _retrainer_stdin, _retrainer_limit)',
      toExecuteResult,
    );
  }

  test(request: {
    files: Readonly<Record<string, string>>;
    targets: readonly string[];
    maxOutputBytes: number;
  }): TestRunResult {
    this.#materialise(request.files);
    this.pyodide.globals.set('_retrainer_targets', JSON.stringify(request.targets));
    this.pyodide.globals.set('_retrainer_report_path', REPORT_PATH);
    this.pyodide.globals.set('_retrainer_limit', request.maxOutputBytes);
    return this.#json(
      'import pyodide_host\npyodide_host.run_tests(_retrainer_targets, _retrainer_report_path, _retrainer_limit)',
      toTestRunResult,
    );
  }

  trace(request: {
    files: Readonly<Record<string, string>>;
    test: string | null;
    entryPoint: string;
    stdin: string;
    maxSteps: number;
    maxOutputBytes: number;
  }): TraceRunResult {
    this.#materialise(request.files);
    this.pyodide.globals.set('_retrainer_entry', request.entryPoint);
    this.pyodide.globals.set('_retrainer_stdin', request.stdin);
    this.pyodide.globals.set('_retrainer_max_steps', request.maxSteps);
    this.pyodide.globals.set('_retrainer_limit', request.maxOutputBytes);
    this.pyodide.globals.set('_retrainer_test', request.test ?? '');

    const raw = this.pyodide.runPython(
      request.test
        ? 'import pyodide_host\npyodide_host.trace_test_case(_retrainer_test, _retrainer_max_steps, _retrainer_limit)'
        : 'import pyodide_host\npyodide_host.trace(_retrainer_entry, _retrainer_stdin, _retrainer_max_steps, _retrainer_limit)',
    );
    if (typeof raw !== 'string') {
      throw new Error(`Expected a trace document from Python, received ${typeof raw}.`);
    }
    return { document: raw };
  }

  diagnose(request: {
    files: Readonly<Record<string, string>>;
    paths: readonly string[];
  }): DiagnoseResult {
    this.#materialise(request.files);
    this.pyodide.globals.set('_retrainer_paths', JSON.stringify(request.paths));
    return this.#json(
      'import pyodide_host\npyodide_host.diagnose(_retrainer_paths)',
      toDiagnoseResult,
    );
  }

  /**
   * Evaluate an expression that returns a JSON document, and narrow it.
   *
   * The Python side always returns a JSON string; anything else means the
   * bridge itself is broken, which is worth saying out loud rather than
   * failing later with a confusing shape.
   */
  #json<T>(code: string, narrow: (value: JsonValue) => T): T {
    const raw = this.pyodide.runPython(code);
    if (typeof raw !== 'string') {
      throw new Error(`Expected JSON from Python, received ${typeof raw}.`);
    }
    return narrow(parseJson(raw));
  }
}
