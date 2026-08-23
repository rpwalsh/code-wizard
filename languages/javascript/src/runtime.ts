// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  Diagnostic,
  ExecutionRequest,
  ExecutionResult,
  ExecutionOutcome,
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
  Workspace,
} from '@code-retrainer/core';
import { parseReport, toTestCases } from '@code-retrainer/core';
import {
  buildSandboxEnvironment,
  resolveLimits,
  runProcess,
  withSandbox,
  type ProcessOutcome,
  type Sandbox,
} from '@code-retrainer/execution';

import { harnessEntry, supportDir, supportFiles } from './paths.ts';

/**
 * JavaScript, on the Node the platform is already running under.
 *
 * The second language, and the one that proves the boundary is real: nothing
 * above `LanguageRuntime` changed to accommodate it. The harness writes the
 * same structured report the Python plugin writes, so the engine cannot tell
 * which language produced a failure — which is the property the cross-runtime
 * test exists to defend.
 *
 * No interpreter discovery. Node is running this code, so `process.execPath`
 * is a working Node by construction, and looking for one on PATH would be
 * asking a question we already know the answer to.
 */
export interface JavaScriptRuntimeOptions {
  /** Where sandboxes are created. Defaults to the OS temp directory. */
  readonly sandboxRoot?: string;
}

const REPORT_FILE = '.retrainer-report.json';

export class JavaScriptRuntime implements LanguageRuntime {
  readonly #options: JavaScriptRuntimeOptions;

  constructor(options: JavaScriptRuntimeOptions = {}) {
    this.#options = options;
  }

  metadata(): LanguageMetadata {
    return {
      id: 'javascript',
      displayName: 'JavaScript',
      editorLanguage: 'javascript',
      fileExtension: '.js',
      commentPrefix: '//',
      // No tracer yet. Advertising one that does nothing would put an
      // instrument on screen that answers no question.
      tracing: false,
    };
  }

  // -- diagnostics ---------------------------------------------------------

  /**
   * Prove the isolation works here, rather than report version numbers.
   *
   * Same shape as the Python doctor and for the same reason: a check that
   * reads a version tells you what is installed, not whether running untrusted
   * code on this machine is actually contained.
   */
  async doctor(): Promise<RuntimeDiagnosis> {
    const checks: RuntimeCheck[] = [];

    checks.push({
      id: 'node',
      label: 'Node',
      status: 'pass',
      detail: `${process.execPath} (${process.version})`,
    });

    const ran = await this.execute({
      workspace: {
        files: [{ path: 'main.js', contents: 'console.log("sandbox-ok");' }],
        entryPoint: 'main.js',
      },
    });
    const executed = ran.outcome === 'completed' && ran.stdout.includes('sandbox-ok');
    checks.push({
      id: 'execute',
      label: 'Workspace execution',
      status: executed ? 'pass' : 'fail',
      ...(executed ? {} : { remedy: 'A trivial program did not run in a sandbox.' }),
    });

    const looped = await this.execute({
      workspace: {
        files: [{ path: 'main.js', contents: 'while (true) {}' }],
        entryPoint: 'main.js',
      },
      limits: { timeoutMs: 1500 },
    });
    const stopped = looped.outcome === 'timeout';
    checks.push({
      id: 'timeout',
      label: 'Timeout enforcement',
      status: stopped ? 'pass' : 'fail',
      ...(stopped ? {} : { remedy: 'A runaway loop was not stopped.' }),
    });

    const flooded = await this.execute({
      workspace: {
        files: [
          {
            path: 'main.js',
            contents: 'for (let i = 0; i < 2_000_000; i += 1) console.log("x".repeat(64));',
          },
        ],
        entryPoint: 'main.js',
      },
      limits: { timeoutMs: 8000, maxOutputBytes: 64 * 1024 },
    });
    const capped = flooded.truncated || flooded.outcome === 'timeout';
    checks.push({
      id: 'output',
      label: 'Output limiting',
      status: capped ? 'pass' : 'fail',
      ...(capped ? {} : { remedy: 'An output flood was buffered rather than capped.' }),
    });

    return {
      language: 'javascript',
      ready: checks.every((check) => check.status !== 'fail'),
      checks,
    };
  }

  // -- running -------------------------------------------------------------

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const limits = resolveLimits(request.limits);
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;

    if (!entryPoint) {
      return failed(
        'internal-error',
        'No entry point: the exercise did not say which file to run.',
      );
    }

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        await this.#installSupport(sandbox);

        const outcome = await runProcess({
          command: process.execPath,
          args: [entryPoint, ...(request.args ?? [])],
          cwd: sandbox.root,
          env: environment(),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
          ...(request.stdin !== undefined ? { stdin: request.stdin } : {}),
        });

        return {
          outcome: outcomeOf(outcome),
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

  async test(request: TestRequest): Promise<TestResult> {
    const limits = resolveLimits(request.limits);
    const targets = testFiles(request);

    if (targets.length === 0) {
      return {
        outcome: 'completed',
        cases: [],
        passed: 0,
        failed: 0,
        errored: 0,
        skipped: 0,
        durationMs: 0,
        stdout: '',
        stderr: '',
        truncated: false,
      };
    }

    return withSandbox(
      request.workspace,
      async (sandbox) => {
        await this.#installSupport(sandbox);

        const outcome = await runProcess({
          command: process.execPath,
          args: [harnessEntry, '--report', REPORT_FILE, ...targets],
          cwd: sandbox.root,
          env: environment(),
          timeoutMs: limits.timeoutMs,
          maxOutputBytes: limits.maxOutputBytes,
        });

        if (outcome.timedOut) {
          return emptyResult('timeout', outcome);
        }
        if (outcome.spawnError) {
          return emptyResult('runtime-unavailable', outcome);
        }

        let raw: string;
        try {
          raw = await sandbox.readFile(REPORT_FILE);
        } catch {
          // No report at all means the harness itself did not get to write
          // one, which is a different failure from tests going red.
          return emptyResult('internal-error', outcome);
        }

        const document = parseReport(raw);
        const cases = toTestCases(document, request.visibility ?? {});

        return {
          outcome: document.collectionErrors.length > 0 ? 'collection-error' : 'completed',
          cases,
          passed: cases.filter((entry) => entry.status === 'passed').length,
          failed: cases.filter((entry) => entry.status === 'failed').length,
          errored: cases.filter((entry) => entry.status === 'errored').length,
          skipped: cases.filter((entry) => entry.status === 'skipped').length,
          durationMs: outcome.durationMs,
          stdout: outcome.stdout,
          stderr: [outcome.stderr, ...document.collectionErrors.map((entry) => entry.message)]
            .filter(Boolean)
            .join('\n'),
          truncated: outcome.truncated,
        };
      },
      this.#sandboxOptions('test'),
    );
  }

  // -- not offered ---------------------------------------------------------

  /**
   * No formatter and no linter, and no pretending otherwise.
   *
   * Both would mean shipping a toolchain the learner did not ask for, and a
   * formatter that quietly rewrites the code under an exercise about writing
   * code yourself is a strange thing to want. The contract allows a runtime to
   * decline; the interface hides what is declined.
   */
  async format(_request: FormatRequest): Promise<FormatResult> {
    return { formatted: [], available: false };
  }

  async lint(_request: LintRequest): Promise<LintResult> {
    return { diagnostics: [], available: false };
  }

  async diagnose(_request: LintRequest): Promise<readonly Diagnostic[]> {
    return [];
  }

  // -- internals -----------------------------------------------------------

  #sandboxOptions(prefix: string) {
    return {
      prefix: `javascript-${prefix}`,
      ...(this.#options.sandboxRoot ? { rootDir: this.#options.sandboxRoot } : {}),
    };
  }

  /**
   * Put the support package where a bare `retrainer/...` import resolves.
   *
   * Copied into `node_modules` inside the sandbox rather than resolved from
   * outside it, so a test file's imports look exactly like ordinary imports
   * and the sandbox stays self-contained — nothing reaches out of the
   * directory to make the run work.
   */
  async #installSupport(sandbox: Sandbox): Promise<void> {
    const target = path.join(sandbox.root, 'node_modules', 'retrainer');
    await fs.mkdir(target, { recursive: true });
    for (const name of supportFiles) {
      await fs.copyFile(path.join(supportDir, 'retrainer', name), path.join(target, name));
    }
  }
}

function testFiles(request: TestRequest): string[] {
  if (request.only && request.only.length > 0) return [...request.only];
  return request.workspace.files
    .map((file) => file.path)
    .filter((candidate) => /(^|\/)tests?\//.test(candidate) && candidate.endsWith('.js'));
}

/** The environment a sandboxed run gets. Nothing inherited by accident. */
function environment(): Record<string, string> {
  return buildSandboxEnvironment();
}

function outcomeOf(outcome: ProcessOutcome): ExecutionOutcome {
  if (outcome.spawnError) return 'runtime-unavailable';
  if (outcome.timedOut) return 'timeout';
  return 'completed';
}

function failed(outcome: ExecutionOutcome, message: string): ExecutionResult {
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

function emptyResult(outcome: TestResult['outcome'], process: ProcessOutcome): TestResult {
  return {
    outcome,
    cases: [],
    passed: 0,
    failed: 0,
    errored: 0,
    skipped: 0,
    durationMs: process.durationMs,
    stdout: process.stdout,
    stderr: process.spawnError ? `${process.stderr}\n${process.spawnError}`.trim() : process.stderr,
    truncated: process.truncated,
  };
}

/** Re-exported so callers can build a workspace without importing core twice. */
export type { Workspace };
