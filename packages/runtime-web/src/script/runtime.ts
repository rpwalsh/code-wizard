// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type {
  ExecutionRequest,
  ExecutionResult,
  FormatRequest,
  FormatResult,
  LanguageMetadata,
  LanguageRuntime,
  LintRequest,
  LintResult,
  RuntimeCheck,
  RuntimeDiagnosis,
  TestRequest,
  TestResult,
  WorkspaceFile,
} from '@code-wizard/core';
import { parseReport, toTestCases } from '@code-wizard/core';

import type { ScriptCall, ScriptFile, ScriptRequest, ScriptResponse } from './protocol.ts';

/**
 * JavaScript and its relatives, in the browser, with nothing to install.
 *
 * The point of this file: the web build used to run exactly one language,
 * because CPython compiles to WebAssembly and nothing else in the curriculum
 * did. But the browser is *already* a JavaScript engine — so JavaScript,
 * TypeScript, React and Angular need no interpreter downloaded, no toolchain
 * on the machine and no WebAssembly at all. They need a worker.
 *
 * That takes the website from one language to five, and the four it adds are
 * the ones a person is most likely to want on a laptop they do not own.
 *
 * ## The timeout is a real guarantee
 *
 * A worker is terminated, not asked to stop. `while (true) {}` inside a
 * learner's code cannot be interrupted cooperatively — there is no point at
 * which their loop yields — so the page holds the clock and kills the thread.
 * A fresh worker is created for the next call, which is also what keeps one
 * attempt from leaking state into the next.
 *
 * ## What it does not do
 *
 * No filesystem, no network, no processes. An exercise about streams or file
 * descriptors belongs on the desktop build, and the Node curriculum says so
 * rather than shipping exercises here that cannot pass.
 */
export interface ScriptRuntimeOptions {
  readonly metadata: LanguageMetadata;
  /**
   * Makes a fresh worker.
   *
   * A factory rather than a worker, because bundlers detect worker entry
   * points syntactically — handing this a URL to construct would leave the
   * worker module out of the build, and the failure would only appear in
   * production.
   */
  createWorker: () => Worker;
  /** The harness files copied into every run, keyed by path. */
  support: () => Promise<readonly WorkspaceFile[]>;
  /**
   * Transform sources before they run, for languages the browser cannot parse.
   *
   * The browser executes JavaScript. TypeScript's types and JSX are not
   * JavaScript, so those languages supply a transform; plain JavaScript
   * supplies none and pays nothing.
   */
  transform?: (files: readonly ScriptFile[]) => Promise<readonly ScriptFile[]>;
  /** Maps a transformed path back to the one the exercise declared. */
  mapReportFile?: (file: string) => string;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_OUTPUT_BYTES = 256 * 1024;

export class ScriptWebRuntime implements LanguageRuntime {
  readonly #options: ScriptRuntimeOptions;
  #support: Promise<readonly WorkspaceFile[]> | null = null;

  constructor(options: ScriptRuntimeOptions) {
    this.#options = options;
  }

  metadata(): LanguageMetadata {
    return this.#options.metadata;
  }

  /**
   * There is nothing to diagnose, and saying so is the honest answer.
   *
   * Every other runtime's `doctor` exists because something might be missing.
   * Here the engine is the page you are reading this in, so the check that
   * matters is whether workers and module blobs are available — which they are
   * everywhere except a page served under a Content-Security-Policy that
   * forbids `blob:`, and that is worth naming rather than discovering.
   */
  async doctor(): Promise<RuntimeDiagnosis> {
    const checks: RuntimeCheck[] = [
      {
        id: 'engine',
        label: 'JavaScript engine',
        status: 'pass',
        detail: 'The browser itself — nothing to install.',
      },
    ];

    checks.push(await this.#workerCheck());

    return {
      language: this.#options.metadata.id,
      ready: checks.every((check) => check.status !== 'fail'),
      checks,
    };
  }

  async #workerCheck(): Promise<RuntimeCheck> {
    try {
      const result = await this.execute({
        workspace: {
          files: [{ path: 'main.js', contents: 'console.log("ok");' }],
          entryPoint: 'main.js',
        },
        limits: { timeoutMs: 20_000, maxOutputBytes: 4096 },
      });

      return result.outcome === 'completed' && result.stdout.includes('ok')
        ? { id: 'worker', label: 'Sandboxed worker', status: 'pass', detail: 'Ran a program.' }
        : {
            id: 'worker',
            label: 'Sandboxed worker',
            status: 'fail',
            detail: result.stderr.slice(0, 300),
            remedy:
              'The page could not run a worker or create a module blob. A Content-Security-Policy ' +
              'without `worker-src blob:` and `script-src blob:` is the usual cause.',
          };
    } catch (caught) {
      return {
        id: 'worker',
        label: 'Sandboxed worker',
        status: 'fail',
        detail: caught instanceof Error ? caught.message : String(caught),
        remedy: 'Workers are unavailable in this context.',
      };
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;
    if (!entryPoint) {
      return failed('internal-error', 'No entry point: the exercise did not say what to run.');
    }

    const timeoutMs = request.limits?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const began = Date.now();

    const files = await this.#prepare(request.workspace.files);
    const call: ScriptCall = {
      kind: 'execute',
      files,
      entryPoint: this.#transformedPath(entryPoint, files),
      maxOutputBytes: request.limits?.maxOutputBytes ?? DEFAULT_OUTPUT_BYTES,
    };

    const response = await this.#run(call, timeoutMs);
    const durationMs = Date.now() - began;

    if (response === 'timeout') {
      return {
        outcome: 'timeout',
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: `Stopped after ${timeoutMs} ms.`,
        truncated: false,
        durationMs,
      };
    }
    if (!response.ok) return failed('internal-error', response.error);
    if (response.kind !== 'execute')
      return failed('internal-error', 'The worker answered the wrong call.');

    return {
      outcome: 'completed',
      exitCode: response.result.exitCode,
      signal: null,
      stdout: response.result.stdout,
      stderr: response.result.stderr,
      truncated: response.result.truncated,
      durationMs,
    };
  }

  async test(request: TestRequest): Promise<TestResult> {
    const timeoutMs = request.limits?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const began = Date.now();

    const declared = testFilesOf(request, this.#options.metadata.fileExtension);
    if (declared.length === 0) return emptyTest('completed', 0);

    const files = await this.#prepare(request.workspace.files);
    const call: ScriptCall = {
      kind: 'test',
      files,
      testFiles: declared.map((path) => this.#transformedPath(path, files)),
      maxOutputBytes: request.limits?.maxOutputBytes ?? DEFAULT_OUTPUT_BYTES,
    };

    const response = await this.#run(call, timeoutMs);
    const durationMs = Date.now() - began;

    if (response === 'timeout')
      return emptyTest('timeout', durationMs, `Stopped after ${timeoutMs} ms.`);
    if (!response.ok) return emptyTest('internal-error', durationMs, response.error);
    if (response.kind !== 'test') return emptyTest('internal-error', durationMs);
    if (!response.result.report) {
      return emptyTest('collection-error', durationMs, response.result.stderr);
    }

    const document = remap(parseReport(response.result.report), this.#options.mapReportFile);
    const cases = toTestCases(document, request.visibility ?? {});

    return {
      outcome: document.collectionErrors.length > 0 ? 'collection-error' : 'completed',
      cases,
      passed: cases.filter((entry) => entry.status === 'passed').length,
      failed: cases.filter((entry) => entry.status === 'failed').length,
      errored: cases.filter((entry) => entry.status === 'errored').length,
      skipped: cases.filter((entry) => entry.status === 'skipped').length,
      durationMs,
      stdout: response.result.stdout,
      stderr: [response.result.stderr, ...document.collectionErrors.map((entry) => entry.message)]
        .filter(Boolean)
        .join('\n'),
      truncated: response.result.truncated,
    };
  }

  format(request: FormatRequest): Promise<FormatResult> {
    // No formatter in the browser. Shipping one would mean bundling it, and a
    // formatter is not what anybody came here for.
    void request;
    return Promise.resolve({ formatted: [], available: false });
  }

  lint(request: LintRequest): Promise<LintResult> {
    void request;
    return Promise.resolve({ diagnostics: [], available: false });
  }

  diagnose(request: LintRequest): Promise<readonly []> {
    void request;
    return Promise.resolve([]);
  }

  // -- internals -----------------------------------------------------------

  async #prepare(files: readonly WorkspaceFile[]): Promise<readonly ScriptFile[]> {
    this.#support ??= this.#options.support();
    const support = await this.#support;

    const combined: ScriptFile[] = [
      ...support.map((file) => ({ path: file.path, contents: file.contents })),
      ...files.map((file) => ({ path: file.path, contents: file.contents })),
    ];

    return this.#options.transform ? this.#options.transform(combined) : combined;
  }

  /** Where a source file ended up after transformation, if it moved. */
  #transformedPath(path: string, files: readonly ScriptFile[]): string {
    if (files.some((file) => file.path === path)) return path;
    const asJs = path.replace(/\.[cm]?[jt]sx?$/u, '.js');
    return files.some((file) => file.path === asJs) ? asJs : path;
  }

  /**
   * One call, one worker, one clock.
   *
   * The worker is created per call and terminated afterwards regardless of the
   * outcome. That is what makes the timeout a guarantee rather than a request,
   * and it also means no attempt can observe anything the previous one left
   * behind — module state, timers, a monkey-patched global.
   */
  #run(call: ScriptCall, timeoutMs: number): Promise<ScriptResponse | 'timeout'> {
    const worker = this.#options.createWorker();

    return new Promise<ScriptResponse | 'timeout'>((resolve) => {
      let settled = false;

      const finish = (value: ScriptResponse | 'timeout'): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve(value);
      };

      const timer = setTimeout(() => finish('timeout'), timeoutMs);

      worker.onmessage = (event: MessageEvent<ScriptResponse>) => finish(event.data);
      worker.onerror = (event) =>
        finish({ id: 0, ok: false, error: event.message || 'The worker failed to start.' });
      worker.onmessageerror = () =>
        finish({ id: 0, ok: false, error: 'The worker sent an uncloneable message.' });

      // Built per arm rather than spread-and-cast: the union is discriminated
      // on `kind`, and a cast would let a future field go missing silently.
      const request: ScriptRequest =
        call.kind === 'execute' ? { ...call, id: 1 } : { ...call, id: 1 };
      worker.postMessage(request);
    });
  }
}

function testFilesOf(request: TestRequest, extension: string): readonly string[] {
  if (request.only && request.only.length > 0) return [...request.only];
  return request.workspace.files
    .map((file) => file.path)
    .filter(
      (candidate) =>
        /(^|[\\/])tests?[\\/]/u.test(candidate) && candidate.toLowerCase().endsWith(extension),
    );
}

function remap(
  document: ReturnType<typeof parseReport>,
  map: ((file: string) => string) | undefined,
): ReturnType<typeof parseReport> {
  if (!map) return document;
  return {
    ...document,
    cases: document.cases.map((entry) => ({
      ...entry,
      file: map(entry.file),
      // The id carries the path too, and it is the id that visibility is keyed
      // on — see the same note in the toolchain runtime.
      id: entry.id.includes('::')
        ? `${map(entry.id.slice(0, entry.id.indexOf('::')))}${entry.id.slice(entry.id.indexOf('::'))}`
        : entry.id,
    })),
  };
}

function failed(outcome: ExecutionResult['outcome'], message: string): ExecutionResult {
  return {
    outcome,
    exitCode: null,
    signal: null,
    stdout: '',
    stderr: message,
    truncated: false,
    durationMs: 0,
  };
}

function emptyTest(outcome: TestResult['outcome'], durationMs: number, stderr = ''): TestResult {
  return {
    outcome,
    cases: [],
    passed: 0,
    failed: 0,
    errored: 0,
    skipped: 0,
    durationMs,
    stdout: '',
    stderr,
    truncated: false,
  };
}
