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
  Workspace,
} from '@forge/core';
import { redactHiddenTests, summarise } from '@forge/core';
import { assertSafeRelativePath, WorkspacePathError } from '@forge/execution';
import { parseReport, toTestCases } from '@forge/python/report';
import { FORGE_EXPECT_PY, FORGE_REPORT_PY } from '@forge/python/support';

import type { WorkerChannel } from './channel.ts';
import { WorkerClient, WorkerTerminatedError } from './channel.ts';
import { FORGE_WEB_PY } from './python-sources.generated.ts';
import type { BootResult, DiagnoseResult, ExecuteResult, TestRunResult } from './protocol.ts';

export interface PyodideRuntimeOptions {
  /** Creates the worker. Browser and Node hosts differ only here. */
  readonly createChannel: () => WorkerChannel | Promise<WorkerChannel>;
  /** Where Pyodide fetches its own assets. Defaults to the package's bundled copy. */
  readonly indexUrl?: string;
  /** Called with human-readable progress during the first, slow boot. */
  readonly onProgress?: (message: string) => void;
  /** Overrides the default 30s ceiling on booting the interpreter. */
  readonly bootTimeoutMs?: number;
}

const DEFAULT_LIMITS = { timeoutMs: 10_000, maxOutputBytes: 256 * 1024 };
const TEST_LIMITS = { timeoutMs: 30_000, maxOutputBytes: 512 * 1024 };
const MAXIMUM = { timeoutMs: 120_000, maxOutputBytes: 4 * 1024 * 1024 };

/**
 * Python for the browser, via CPython compiled to WebAssembly.
 *
 * The same `LanguageRuntime` the desktop build implements by spawning
 * processes. Everything above this class — the exercise engine, the mastery
 * model, the recommender, the entire UI — cannot tell the two apart, which is
 * the whole reason that boundary exists.
 *
 * Isolation comes from the browser rather than from us. Learner code runs in a
 * worker inside a WASM sandbox with no filesystem, no network and no access to
 * the page. A hosted deployment never executes it at all: the site is static
 * files, and the code runs on the visitor's own machine.
 */
export class PyodideRuntime implements LanguageRuntime {
  readonly #options: PyodideRuntimeOptions;
  #client: WorkerClient | null = null;
  #booting: Promise<BootResult> | null = null;
  #info: BootResult | null = null;

  constructor(options: PyodideRuntimeOptions) {
    this.#options = options;
  }

  metadata(): LanguageMetadata {
    return {
      id: 'python',
      displayName: 'Python',
      editorLanguage: 'python',
      fileExtension: '.py',
      commentPrefix: '#',
    };
  }

  /** Boot eagerly, so the first exercise does not pay for the download. */
  async warmUp(): Promise<BootResult> {
    return this.#ensureBooted();
  }

  get info(): BootResult | null {
    return this.#info;
  }

  async #ensureBooted(): Promise<BootResult> {
    // A terminated worker cannot be revived. Forgetting it here means every
    // path that kills one — timeout, crash, dispose — recovers without having
    // to remember to reset three fields in the right order.
    if (this.#client && !this.#client.running) this.#forget();

    if (this.#info && this.#client) return this.#info;
    this.#booting ??= this.#boot();
    try {
      return await this.#booting;
    } catch (error) {
      // A failed boot must not poison every later attempt: clear the memo so
      // the next call genuinely retries.
      this.#booting = null;
      throw error;
    }
  }

  async #boot(): Promise<BootResult> {
    const client = new WorkerClient(() => this.#options.createChannel(), this.#options.onProgress);
    await client.start();
    this.#client = client;

    const info = await withDeadline(
      client.call<BootResult>({
        kind: 'boot',
        config: {
          ...(this.#options.indexUrl ? { indexUrl: this.#options.indexUrl } : {}),
          forgeWebSource: FORGE_WEB_PY,
          supportModules: {
            'forge_report.py': FORGE_REPORT_PY,
            'forge_expect.py': FORGE_EXPECT_PY,
          },
        },
      }),
      this.#options.bootTimeoutMs ?? 60_000,
      () => client.terminate('Starting Python took too long.'),
    );

    this.#info = info;
    return info;
  }

  /**
   * Run one call under a wall-clock limit, killing the worker if it overruns.
   *
   * This is the browser's process-tree kill. A Python `while True:` cannot be
   * interrupted cooperatively — there is no point at which it yields — so the
   * only honest way to enforce a timeout is to destroy the thread and start a
   * new interpreter for the next run.
   */
  async #guarded<T>(body: (client: WorkerClient) => Promise<T>, timeoutMs: number): Promise<T> {
    await this.#ensureBooted();
    const client = this.#client;
    if (!client) throw new WorkerTerminatedError('The Python runtime is not running.');

    return withDeadline(body(client), timeoutMs, async () => {
      // Forget first, then terminate: if termination were to hang or throw,
      // clearing afterwards would never happen and the dead client would stay
      // memoised, failing every later run with "the worker is not running".
      this.#forget();
      await client.terminate('Execution exceeded its time limit.');
    });
  }

  /** Drop all memoised worker state so the next call boots a fresh one. */
  #forget(): void {
    this.#client = null;
    this.#booting = null;
    this.#info = null;
  }

  // -- execution ----------------------------------------------------------

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const limits = clampLimits(request.limits, DEFAULT_LIMITS);
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;

    if (!entryPoint) {
      return failedExecution(
        'internal-error',
        'No entry point: the exercise did not say which file to run.',
      );
    }

    const startedAt = now();
    try {
      const result = await this.#guarded(
        (client) =>
          client.call<ExecuteResult>({
            kind: 'execute',
            files: toFileMap(request.workspace),
            entryPoint,
            args: request.args ?? [],
            stdin: request.stdin ?? '',
            maxOutputBytes: limits.maxOutputBytes,
          }),
        limits.timeoutMs,
      );

      return {
        outcome: 'completed',
        exitCode: result.exitCode,
        signal: null,
        stdout: result.stdout,
        stderr: result.stderr,
        truncated: result.truncated,
        durationMs: Math.round(now() - startedAt),
      };
    } catch (error) {
      return {
        ...failedExecution(outcomeFor(error), describe(error)),
        durationMs: Math.round(now() - startedAt),
      };
    }
  }

  // -- testing ------------------------------------------------------------

  async test(request: TestRequest): Promise<TestResult> {
    const limits = clampLimits(request.limits, TEST_LIMITS);
    const visibility = request.visibility ?? {};
    const targets = request.only ?? Object.keys(visibility);
    const startedAt = now();

    let raw: TestRunResult;
    try {
      raw = await this.#guarded(
        (client) =>
          client.call<TestRunResult>({
            kind: 'test',
            files: toFileMap(request.workspace),
            targets,
            maxOutputBytes: limits.maxOutputBytes,
          }),
        limits.timeoutMs,
      );
    } catch (error) {
      const outcome = outcomeFor(error);
      return failedTestRun(
        outcome === 'completed' ? 'internal-error' : outcome,
        describe(error),
        Math.round(now() - startedAt),
      );
    }

    const base = {
      stdout: raw.stdout,
      stderr: raw.stderr,
      truncated: raw.truncated,
      durationMs: Math.round(now() - startedAt),
    };

    if (raw.report === null) {
      // pytest never reached session finish, so there are no per-case results.
      return { ...emptyCounts(), ...base, outcome: 'collection-error', cases: [] };
    }

    let cases: TestCaseResult[];
    let hadCollectionError: boolean;
    try {
      const document = parseReport(raw.report);
      cases = toTestCases(document, visibility as Readonly<Record<string, TestVisibility>>);
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
    const outcome: TestRunOutcome =
      hadCollectionError && redacted.length === 0 ? 'collection-error' : 'completed';

    return { ...base, ...summarise(redacted), outcome, cases: redacted };
  }

  // -- diagnostics --------------------------------------------------------

  async diagnose(request: LintRequest): Promise<readonly Diagnostic[]> {
    const paths = request.workspace.files
      .filter((file) => file.path.endsWith('.py'))
      .map((file) => file.path);
    if (paths.length === 0) return [];

    try {
      const result = await this.#guarded(
        (client) =>
          client.call<DiagnoseResult>({
            kind: 'diagnose',
            files: toFileMap(request.workspace),
            paths,
          }),
        15_000,
      );
      return result.diagnostics;
    } catch {
      // Editor diagnostics are advisory; failing to produce them must never
      // break the workspace.
      return [];
    }
  }

  /**
   * No linter in the browser build.
   *
   * Ruff is a native binary with no WASM distribution, so this reports the
   * syntax diagnostics it can produce and `available: false` — which stops any
   * UI from claiming the code is lint-clean when it was never linted.
   */
  async lint(request: LintRequest): Promise<LintResult> {
    return { diagnostics: await this.diagnose(request), available: false };
  }

  /** No formatter in the browser build, for the same reason. */
  async format(_request: FormatRequest): Promise<FormatResult> {
    return {
      formatted: [],
      available: false,
      error: 'Formatting is only available in the desktop app.',
    };
  }

  // -- doctor -------------------------------------------------------------

  async doctor(): Promise<RuntimeDiagnosis> {
    const checks: RuntimeCheck[] = [];

    let info: BootResult;
    try {
      info = await this.#ensureBooted();
    } catch (error) {
      return {
        language: 'python',
        ready: false,
        checks: [
          {
            id: 'pyodide-boot',
            label: 'Python (WebAssembly)',
            status: 'fail',
            detail: describe(error),
            remedy: 'Check the browser console; the Pyodide assets may be unreachable.',
          },
        ],
      };
    }

    checks.push({
      id: 'pyodide-boot',
      label: 'Python (WebAssembly)',
      status: 'pass',
      detail: `${info.pythonVersion} — started in ${(info.bootMs / 1000).toFixed(1)}s`,
    });
    checks.push({
      id: 'pytest-present',
      label: 'pytest',
      status: info.pytestVersion ? 'pass' : 'fail',
      ...(info.pytestVersion ? { detail: info.pytestVersion } : {}),
    });

    const hello = await this.execute({
      workspace: {
        files: [{ path: 'main.py', contents: 'print("forge-sandbox-ok")' }],
        entryPoint: 'main.py',
      },
    });
    checks.push({
      id: 'sandbox',
      label: 'Workspace execution',
      status: hello.stdout.includes('forge-sandbox-ok') ? 'pass' : 'fail',
      ...(hello.stdout.includes('forge-sandbox-ok') ? {} : { detail: hello.stderr.trim() }),
    });

    const runaway = await this.execute({
      workspace: {
        files: [{ path: 'main.py', contents: 'while True:\n    pass\n' }],
        entryPoint: 'main.py',
      },
      limits: { timeoutMs: 2_000 },
    });
    checks.push({
      id: 'timeout',
      label: 'Timeout enforcement',
      status: runaway.outcome === 'timeout' ? 'pass' : 'fail',
      ...(runaway.outcome === 'timeout'
        ? {}
        : { detail: `expected a timeout, got outcome: ${runaway.outcome}` }),
    });

    const flood = await this.execute({
      workspace: {
        files: [{ path: 'main.py', contents: 'for _ in range(200000):\n    print("x" * 200)\n' }],
        entryPoint: 'main.py',
      },
      limits: { timeoutMs: 30_000, maxOutputBytes: 32 * 1024 },
    });
    checks.push({
      id: 'output-limit',
      label: 'Output limiting',
      status: flood.truncated && flood.stdout.length < 200 * 1024 ? 'pass' : 'fail',
      ...(flood.truncated ? {} : { detail: `captured ${flood.stdout.length} bytes` }),
    });

    return {
      language: 'python',
      ready: checks.every((check) => check.status !== 'fail'),
      checks,
    };
  }

  async dispose(): Promise<void> {
    const client = this.#client;
    this.#forget();
    await client?.terminate('Runtime disposed.');
  }
}

/** Reject after `timeoutMs`, running `onTimeout` first. */
async function withDeadline<T>(
  work: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void | Promise<void>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      void Promise.resolve(onTimeout()).finally(() => reject(new TimeoutError(timeoutMs)));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work, deadline]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export class TimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Execution exceeded its ${timeoutMs}ms limit and was terminated.`);
    this.name = 'TimeoutError';
  }
}

function outcomeFor(error: unknown): ExecutionResult['outcome'] {
  if (error instanceof TimeoutError) return 'timeout';
  if (error instanceof WorkerTerminatedError) return 'timeout';
  // A path that escapes the workspace is broken content, not a runtime that
  // is unavailable, and saying so sends the reader to the right place.
  if (error instanceof WorkspacePathError) return 'internal-error';
  return 'runtime-unavailable';
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toFileMap(workspace: Workspace): Record<string, string> {
  const files: Record<string, string> = {};
  for (const file of workspace.files) {
    // The same guard the desktop sandbox applies before touching a real disk.
    files[assertSafeRelativePath(file.path)] = file.contents;
  }
  return files;
}

function clampLimits(
  requested: { timeoutMs?: number; maxOutputBytes?: number } | undefined,
  defaults: { timeoutMs: number; maxOutputBytes: number },
): { timeoutMs: number; maxOutputBytes: number } {
  const timeoutMs = requested?.timeoutMs ?? defaults.timeoutMs;
  const maxOutputBytes = requested?.maxOutputBytes ?? defaults.maxOutputBytes;
  return {
    timeoutMs: Math.min(Math.max(1, Math.floor(timeoutMs)), MAXIMUM.timeoutMs),
    maxOutputBytes: Math.min(Math.max(1024, Math.floor(maxOutputBytes)), MAXIMUM.maxOutputBytes),
  };
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
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

function failedTestRun(outcome: TestRunOutcome, message: string, durationMs: number): TestResult {
  return {
    ...emptyCounts(),
    outcome,
    cases: [],
    durationMs,
    stdout: '',
    stderr: message,
    truncated: false,
  };
}

function emptyCounts(): { passed: number; failed: number; errored: number; skipped: number } {
  return { passed: 0, failed: 0, errored: 0, skipped: 0 };
}
