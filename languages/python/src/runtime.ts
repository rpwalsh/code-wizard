// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';

import type {
  Diagnostic,
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
  TestCaseResult,
  TestRequest,
  TestResult,
  TestRunOutcome,
  TestVisibility,
  TraceRequest,
  TraceResult,
} from '@code-retrainer/core';
import { redactHiddenTests, summarize } from '@code-retrainer/core';
import type { ProcessOutcome, Sandbox } from '@code-retrainer/execution';
import {
  buildSandboxEnvironment,
  resolveLimits,
  runProcess,
  withSandbox,
} from '@code-retrainer/execution';

import type { PythonInterpreter } from './discovery.ts';
import { discoverPython, MINIMUM_PYTHON, PythonNotFoundError } from './discovery.ts';
import { parseReport, toTestCases } from './report.ts';
import { parseTrace } from './trace-report.ts';
import { pythonDocumentationDir, pythonSupportDir } from './paths.ts';

const REPORT_PATH = '.code-retrainer/report.json';
const DIAGNOSTIC_PATH = '.code-retrainer/diagnostics.json';
const TRACE_PATH = '.code-retrainer/trace.json';

/**
 * Flags applied to every interpreter launch:
 *   -u  unbuffered, so output arrives in real time and survives a kill
 *   -B  no .pyc files, keeping the sandbox byte-identical between runs
 *
 * Notably absent is `-s`. Ignoring the user site directory would be better
 * isolation, but `pip install --user` is the default on Windows and for many
 * managed Python installs, so `-s` hides the learner's own pytest. The real
 * grading risk — a stray plugin changing how tests run — is closed by
 * PYTEST_DISABLE_PLUGIN_AUTOLOAD instead.
 */
const BASE_FLAGS = ['-u', '-B'] as const;

export interface PythonRuntimeOptions {
  /** Override interpreter discovery (tests, or a pinned virtualenv). */
  readonly interpreter?: PythonInterpreter;
  /** Directory holding `retrainer/report.py` and friends. */
  readonly supportDir?: string;
  /** Parent directory for sandboxes. */
  readonly sandboxRoot?: string;
}

export class PythonRuntime implements LanguageRuntime {
  readonly #options: PythonRuntimeOptions;

  constructor(options: PythonRuntimeOptions = {}) {
    this.#options = options;
  }

  metadata(): LanguageMetadata {
    return {
      id: 'python',
      displayName: 'Python',
      editorLanguage: 'python',
      fileExtension: '.py',
      commentPrefix: '#',
      documentationRoot: pythonDocumentationDir,
      tracing: true,
    };
  }

  // -- diagnostics ---------------------------------------------------------

  async doctor(): Promise<RuntimeDiagnosis> {
    const checks: RuntimeCheck[] = [];

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch (error) {
      checks.push({
        id: 'python-present',
        label: 'Python interpreter',
        status: 'fail',
        detail: error instanceof PythonNotFoundError ? error.message : String(error),
        remedy: `Install Python ${MINIMUM_PYTHON.join('.')} or newer, or set CODE_RETRAINER_PYTHON.`,
      });
      return { language: 'python', ready: false, checks };
    }

    checks.push({
      id: 'python-present',
      label: 'Python interpreter',
      status: 'pass',
      detail:
        `${interpreter.executable} (${interpreter.command} ${interpreter.prefixArgs.join(' ')})`.trim(),
    });
    checks.push({
      id: 'python-version',
      label: 'Python version',
      status: 'pass',
      detail: interpreter.version,
    });
    checks.push({
      id: 'pytest-present',
      label: 'pytest',
      status: interpreter.hasPytest ? 'pass' : 'fail',
      ...(interpreter.pytestVersion ? { detail: interpreter.pytestVersion } : {}),
      ...(interpreter.hasPytest
        ? {}
        : { remedy: `Install it with: ${interpreter.command} -m pip install pytest` }),
    });
    checks.push({
      id: 'formatter',
      label: 'Formatter',
      status: interpreter.hasRuff || interpreter.hasBlack ? 'pass' : 'warn',
      detail: interpreter.hasRuff ? 'ruff' : interpreter.hasBlack ? 'black' : 'none installed',
      ...(interpreter.hasRuff || interpreter.hasBlack
        ? {}
        : {
            remedy: 'Optional. Install with: ' + interpreter.command + ' -m pip install ruff',
          }),
    });
    checks.push({
      id: 'linter',
      label: 'Linter',
      status: interpreter.hasRuff ? 'pass' : 'warn',
      detail: interpreter.hasRuff ? 'ruff' : 'none installed (syntax checks still run)',
    });

    // The remaining checks prove the isolation machinery actually works on
    // this machine rather than merely being implemented (spec §41).
    checks.push(await this.#checkSandbox());
    checks.push(await this.#checkTimeout());
    checks.push(await this.#checkOutputLimit());

    const ready = checks.every((check) => check.status !== 'fail');
    return { language: 'python', ready, checks };
  }

  async #checkSandbox(): Promise<RuntimeCheck> {
    try {
      const result = await this.execute({
        workspace: {
          files: [{ path: 'main.py', contents: 'print("sandbox-ok")' }],
          entryPoint: 'main.py',
        },
        limits: { timeoutMs: 15_000 },
      });
      const ok = result.outcome === 'completed' && result.stdout.includes('sandbox-ok');
      return {
        id: 'sandbox',
        label: 'Workspace execution',
        status: ok ? 'pass' : 'fail',
        ...(ok ? {} : { detail: result.stderr.trim() || `outcome: ${result.outcome}` }),
        ...(ok
          ? {}
          : { remedy: 'Check that the temp directory is writable and not virus-scanned.' }),
      };
    } catch (error) {
      return {
        id: 'sandbox',
        label: 'Workspace execution',
        status: 'fail',
        detail: String(error),
      };
    }
  }

  async #checkTimeout(): Promise<RuntimeCheck> {
    const result = await this.execute({
      workspace: {
        files: [{ path: 'main.py', contents: 'import time\nwhile True:\n    time.sleep(0.05)\n' }],
        entryPoint: 'main.py',
      },
      limits: { timeoutMs: 1_500 },
    });
    const ok = result.outcome === 'timeout';
    return {
      id: 'timeout',
      label: 'Timeout enforcement',
      status: ok ? 'pass' : 'fail',
      ...(ok ? {} : { detail: `expected a timeout, got outcome: ${result.outcome}` }),
    };
  }

  async #checkOutputLimit(): Promise<RuntimeCheck> {
    const result = await this.execute({
      workspace: {
        files: [
          {
            path: 'main.py',
            contents: 'for _ in range(200000):\n    print("x" * 200)\n',
          },
        ],
        entryPoint: 'main.py',
      },
      limits: { timeoutMs: 20_000, maxOutputBytes: 32 * 1024 },
    });
    const ok = result.truncated && result.stdout.length < 200 * 1024;
    return {
      id: 'output-limit',
      label: 'Output limiting',
      status: ok ? 'pass' : 'fail',
      ...(ok
        ? {}
        : { detail: `captured ${result.stdout.length} bytes, truncated=${result.truncated}` }),
    };
  }

  // -- execution -----------------------------------------------------------

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const limits = resolveLimits(request.limits);
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;

    if (!entryPoint) {
      return failedExecution(
        'internal-error',
        'No entry point: the exercise did not say which file to run.',
      );
    }

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch (error) {
      return failedExecution('runtime-unavailable', String(error));
    }

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        const outcome = await runProcess({
          command: interpreter.command,
          args: [...interpreter.prefixArgs, ...BASE_FLAGS, entryPoint, ...(request.args ?? [])],
          cwd: sandbox.root,
          env: this.#environment(sandbox),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
          ...(request.stdin !== undefined ? { stdin: request.stdin } : {}),
        });

        return {
          outcome: executionOutcome(outcome),
          exitCode: outcome.exitCode,
          signal: outcome.signal,
          stdout: outcome.stdout,
          stderr: outcome.spawnError
            ? `${outcome.stderr}\n${outcome.spawnError}`.trim()
            : outcome.stderr,
          truncated: outcome.truncated,
          durationMs: outcome.durationMs,
        };
      },
      this.#sandboxOptions('run'),
    );
  }

  // -- testing -------------------------------------------------------------

  async test(request: TestRequest): Promise<TestResult> {
    const limits = resolveLimits(request.limits, { timeoutMs: 30_000, maxOutputBytes: 512 * 1024 });

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch (error) {
      return failedTestRun('runtime-unavailable', String(error));
    }
    if (!interpreter.hasPytest) {
      return failedTestRun(
        'runtime-unavailable',
        `pytest is not installed for ${interpreter.executable}. ` +
          `Install it with: ${interpreter.command} -m pip install pytest`,
      );
    }

    const visibility = request.visibility ?? {};
    const targets = request.only ?? Object.keys(visibility);

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        const outcome = await runProcess({
          command: interpreter.command,
          args: [
            ...interpreter.prefixArgs,
            ...BASE_FLAGS,
            '-m',
            'pytest',
            '-p',
            'no:cacheprovider',
            '-p',
            'retrainer.report',
            '--retrainer-report',
            REPORT_PATH,
            '-q',
            '--no-header',
            '--color=no',
            // Suppress the short summary block: the structured report already
            // carries it, and duplicated failure text confuses the panel.
            '-r',
            'N',
            ...targets,
          ],
          cwd: sandbox.root,
          env: this.#environment(sandbox),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
        });

        return this.#readTestReport(sandbox, outcome, visibility);
      },
      this.#sandboxOptions('test'),
    );
  }

  async #readTestReport(
    sandbox: Sandbox,
    outcome: ProcessOutcome,
    visibility: Readonly<Record<string, TestVisibility>>,
  ): Promise<TestResult> {
    const base = {
      stdout: outcome.stdout,
      stderr: outcome.spawnError
        ? `${outcome.stderr}\n${outcome.spawnError}`.trim()
        : outcome.stderr,
      truncated: outcome.truncated,
      durationMs: outcome.durationMs,
    };

    if (!(await sandbox.exists(REPORT_PATH))) {
      // No report means pytest never reached session finish: it timed out, or
      // it could not even start. Either way there are no per-case results.
      const runOutcome: TestRunOutcome = outcome.timedOut
        ? 'timeout'
        : outcome.spawnError
          ? 'runtime-unavailable'
          : 'collection-error';
      return { ...emptyCounts(), ...base, outcome: runOutcome, cases: [] };
    }

    let cases: TestCaseResult[];
    let hadCollectionError: boolean;
    try {
      const document = parseReport(await sandbox.readFile(REPORT_PATH));
      cases = toTestCases(document, visibility);
      hadCollectionError = document.collectionErrors.length > 0;
    } catch (error) {
      return {
        ...emptyCounts(),
        ...base,
        outcome: 'internal-error',
        cases: [],
        stderr: `${base.stderr}\n${String(error)}`.trim(),
      };
    }

    const redacted = redactHiddenTests(cases);
    const counts = summarize(redacted);
    const runOutcome: TestRunOutcome = outcome.timedOut
      ? 'timeout'
      : hadCollectionError && redacted.length === 0
        ? 'collection-error'
        : 'completed';

    return { ...base, ...counts, outcome: runOutcome, cases: redacted };
  }

  // -- tracing -------------------------------------------------------------

  /**
   * Record what the program actually did.
   *
   * Runs in its own process like everything else, so a traced program that
   * refuses to terminate is killed exactly the way an untraced one is.
   * Tracing costs roughly an order of magnitude in speed, so the default
   * timeout is generous relative to a plain run.
   */
  async trace(request: TraceRequest): Promise<TraceResult> {
    const limits = resolveLimits(request.limits, { timeoutMs: 30_000, maxOutputBytes: 512 * 1024 });
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;
    const startedAt = performance.now();

    if (!entryPoint && !request.test) {
      return failedTrace('internal-error', 'Nothing to trace: no test and no entry point.');
    }

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch (error) {
      return failedTrace('runtime-unavailable', String(error));
    }

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        // One driver for both shapes: tracing a test and tracing a program
        // differ only in which recorder entry point is called.
        const driver = [
          'import os, sys',
          'sys.path.insert(0, os.environ["RETRAINER_SUPPORT"])',
          'from retrainer.trace import trace_program, trace_test',
          'target, steps, limit, report = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]',
          'if os.environ.get("RETRAINER_TRACE_TEST"):',
          '    document = trace_test(os.getcwd(), os.environ["RETRAINER_TRACE_TEST"], steps, limit)',
          'else:',
          '    document = trace_program(os.getcwd(), target, steps, limit, sys.stdin.read())',
          'os.makedirs(os.path.dirname(report), exist_ok=True)',
          'open(report, "w", encoding="utf-8").write(document)',
        ].join('\n');

        const outcome = await runProcess({
          command: interpreter.command,
          args: [
            ...interpreter.prefixArgs,
            ...BASE_FLAGS,
            '-c',
            driver,
            entryPoint ?? '',
            String(request.maxSteps ?? 4000),
            String(limits.maxOutputBytes),
            TRACE_PATH,
          ],
          cwd: sandbox.root,
          env: {
            ...this.#environment(sandbox),
            RETRAINER_SUPPORT: this.#supportDir(),
            ...(request.test ? { RETRAINER_TRACE_TEST: request.test } : {}),
          },
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
          stdin: request.stdin ?? '',
        });

        const durationMs = Math.round(performance.now() - startedAt);

        if (outcome.timedOut) {
          return { ...failedTrace('timeout', 'Tracing exceeded its time limit.'), durationMs };
        }
        if (!(await sandbox.exists(TRACE_PATH))) {
          return {
            ...failedTrace('internal-error', outcome.stderr || 'The tracer produced no output.'),
            durationMs,
          };
        }

        try {
          const document = parseTrace(await sandbox.readFile(TRACE_PATH));
          return { ...toTraceResult(document), durationMs };
        } catch (error) {
          return { ...failedTrace('internal-error', String(error)), durationMs };
        }
      },
      this.#sandboxOptions('trace'),
    );
  }

  // -- formatting and linting ----------------------------------------------

  async format(request: FormatRequest): Promise<FormatResult> {
    const limits = resolveLimits(request.limits, { timeoutMs: 20_000, maxOutputBytes: 256 * 1024 });

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch (error) {
      return { formatted: [], available: false, error: String(error) };
    }

    const tool: readonly string[] | null = interpreter.hasRuff
      ? ['-m', 'ruff', 'format']
      : interpreter.hasBlack
        ? ['-m', 'black', '-q']
        : null;

    if (!tool) {
      return {
        formatted: [],
        available: false,
        error: 'No Python formatter installed. Install ruff or black.',
      };
    }

    const editable = request.workspace.files.filter(
      (file) => !file.readOnly && file.path.endsWith('.py'),
    );
    if (editable.length === 0) return { formatted: [], available: true };

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        const outcome = await runProcess({
          command: interpreter.command,
          args: [
            ...interpreter.prefixArgs,
            ...BASE_FLAGS,
            ...tool,
            ...editable.map((file) => file.path),
          ],
          cwd: sandbox.root,
          env: this.#environment(sandbox),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
        });

        const formatted: { path: string; contents: string }[] = [];
        for (const file of editable) {
          const contents = await sandbox.readFile(file.path);
          if (contents !== file.contents) formatted.push({ path: file.path, contents });
        }

        // A non-zero exit with no rewrites means the code does not parse; the
        // learner needs to hear that rather than see silence.
        const failed = outcome.exitCode !== 0 && formatted.length === 0;
        return {
          formatted,
          available: true,
          ...(failed ? { error: (outcome.stderr || outcome.stdout).trim() } : {}),
        };
      },
      this.#sandboxOptions('format'),
    );
  }

  async lint(request: LintRequest): Promise<LintResult> {
    const limits = resolveLimits(request.limits, { timeoutMs: 20_000, maxOutputBytes: 512 * 1024 });

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch {
      return { diagnostics: [], available: false };
    }
    if (!interpreter.hasRuff) {
      // Fall back to syntax diagnostics so the caller still gets the errors
      // that matter most, but report `available: false` so no UI claims the
      // code is lint-clean.
      return { diagnostics: await this.diagnose(request), available: false };
    }

    const targets = request.workspace.files
      .filter((file) => !file.readOnly && file.path.endsWith('.py'))
      .map((file) => file.path);
    if (targets.length === 0) return { diagnostics: [], available: true };

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        const outcome = await runProcess({
          command: interpreter.command,
          args: [
            ...interpreter.prefixArgs,
            ...BASE_FLAGS,
            '-m',
            'ruff',
            'check',
            '--output-format=json',
            '--no-cache',
            ...targets,
          ],
          cwd: sandbox.root,
          env: this.#environment(sandbox),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
        });

        return { diagnostics: parseRuffJson(outcome.stdout, sandbox.root), available: true };
      },
      this.#sandboxOptions('lint'),
    );
  }

  async diagnose(request: LintRequest): Promise<readonly Diagnostic[]> {
    const limits = resolveLimits(request.limits, { timeoutMs: 15_000, maxOutputBytes: 256 * 1024 });

    let interpreter: PythonInterpreter;
    try {
      interpreter = await this.#interpreter();
    } catch {
      return [];
    }

    const targets = request.workspace.files
      .filter((file) => file.path.endsWith('.py'))
      .map((file) => file.path);
    if (targets.length === 0) return [];

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        await runProcess({
          command: interpreter.command,
          args: [
            ...interpreter.prefixArgs,
            ...BASE_FLAGS,
            path.join(this.#supportDir(), 'retrainer/diagnose.py'),
            DIAGNOSTIC_PATH,
            ...targets,
          ],
          cwd: sandbox.root,
          env: this.#environment(sandbox),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
        });

        if (!(await sandbox.exists(DIAGNOSTIC_PATH))) return [];
        try {
          const parsed = JSON.parse(await sandbox.readFile(DIAGNOSTIC_PATH)) as {
            diagnostics?: Diagnostic[];
          };
          return parsed.diagnostics ?? [];
        } catch {
          return [];
        }
      },
      this.#sandboxOptions('diagnose'),
    );
  }

  // -- internals -----------------------------------------------------------

  #interpreter(): Promise<PythonInterpreter> {
    return this.#options.interpreter
      ? Promise.resolve(this.#options.interpreter)
      : discoverPython();
  }

  #supportDir(): string {
    return this.#options.supportDir ?? pythonSupportDir;
  }

  #sandboxOptions(prefix: string): { rootDir?: string; prefix: string } {
    return {
      prefix,
      ...(this.#options.sandboxRoot ? { rootDir: this.#options.sandboxRoot } : {}),
    };
  }

  #environment(sandbox: Sandbox): Record<string, string> {
    return buildSandboxEnvironment({
      extra: {
        // The sandbox root first so `import main` finds the learner's file;
        // the support directory second so `retrainer.expect` and the reporting
        // plugin are importable without being copied into the workspace.
        PYTHONPATH: [sandbox.root, this.#supportDir()].join(path.delimiter),
        PYTHONDONTWRITEBYTECODE: '1',
        PYTHONUNBUFFERED: '1',
        // Deterministic iteration order for sets and string-keyed dicts, so an
        // exercise cannot pass on one run and fail on the next.
        PYTHONHASHSEED: '0',
        // Only plugins Code Retrainer asks for; a plugin the learner happens to have
        // installed must not change how their exercise is graded.
        PYTEST_DISABLE_PLUGIN_AUTOLOAD: '1',
      },
    });
  }
}

function executionOutcome(outcome: ProcessOutcome): ExecutionResult['outcome'] {
  if (outcome.timedOut) return 'timeout';
  if (outcome.spawnError) return 'runtime-unavailable';
  return 'completed';
}

function failedExecution(outcome: ExecutionResult['outcome'], message: string): ExecutionResult {
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

function failedTestRun(outcome: TestRunOutcome, message: string): TestResult {
  return {
    ...emptyCounts(),
    outcome,
    cases: [],
    durationMs: 0,
    stdout: '',
    stderr: message,
    truncated: false,
  };
}

function toTraceResult(document: ReturnType<typeof parseTrace>): TraceResult {
  return {
    outcome: 'completed',
    steps: document.steps,
    truncated: document.truncated,
    maxSteps: document.maxSteps,
    exitCode: document.exitCode,
    stdout: document.stdout,
    stderr: document.stderr,
    error: document.error,
    durationMs: 0,
  };
}

function failedTrace(outcome: TraceResult['outcome'], message: string): TraceResult {
  return {
    outcome,
    steps: [],
    truncated: false,
    maxSteps: 0,
    exitCode: null,
    stdout: '',
    stderr: message,
    error: null,
    durationMs: 0,
  };
}

function emptyCounts(): { passed: number; failed: number; errored: number; skipped: number } {
  return { passed: 0, failed: 0, errored: 0, skipped: 0 };
}

interface RuffDiagnostic {
  code: string | null;
  message: string;
  filename: string;
  location: { row: number; column: number } | null;
  end_location: { row: number; column: number } | null;
}

function parseRuffJson(stdout: string, root: string): Diagnostic[] {
  const trimmed = stdout.trim();
  if (!trimmed.startsWith('[')) return [];
  let entries: RuffDiagnostic[];
  try {
    entries = JSON.parse(trimmed) as RuffDiagnostic[];
  } catch {
    return [];
  }

  return entries.map((entry) => ({
    severity: 'warning' as const,
    message: entry.message,
    source: 'ruff',
    ...(entry.code ? { code: entry.code } : {}),
    ...(entry.location
      ? {
          location: {
            path: relativeToRoot(entry.filename, root),
            line: entry.location.row,
            column: entry.location.column,
            ...(entry.end_location
              ? { endLine: entry.end_location.row, endColumn: entry.end_location.column }
              : {}),
          },
        }
      : {}),
  }));
}

/** Ruff reports absolute paths; the UI addresses files by workspace path. */
function relativeToRoot(filename: string, root: string): string {
  const relative = path.relative(root, filename);
  const inside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  return (inside ? relative : filename).split(path.sep).join('/');
}
