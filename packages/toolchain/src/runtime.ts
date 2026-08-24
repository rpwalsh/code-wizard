// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fsp from 'node:fs/promises';
import nodePath from 'node:path';

import type {
  Diagnostic,
  ExecutionOutcome,
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
  Workspace,
  WorkspaceFile,
} from '@code-wizard/core';
import type { StructuredReport } from '@code-wizard/core';
import { parseReport, toTestCases } from '@code-wizard/core';
import {
  buildSandboxEnvironment,
  resolveLimits,
  runProcess,
  withSandbox,
  type ProcessOutcome,
  type Sandbox,
} from '@code-wizard/execution';

import type { FoundTool, ToolSpec } from './discovery.ts';
import type { InstallablePackage } from './install.ts';
import { findTool, inheritedPath, isFound } from './discovery.ts';

export const REPORT_FILE = '.retrainer-report.json';

/**
 * Everything that differs between one toolchain-backed language and the next.
 *
 * The observation this package is built on: ten languages that compile or
 * interpret a file in a sandbox and write a structured report differ in about
 * forty lines each, and are identical in the four hundred around them —
 * sandboxing, output capping, timeouts, report parsing, spawn-failure
 * handling, and the exact shape of every result. Writing that ten times is how
 * you get ten subtly different timeout behaviors and one language where an
 * output flood is not capped.
 *
 * So it is written once, here, and each language supplies this description.
 */
export interface ToolchainSpec {
  readonly metadata: LanguageMetadata;

  /** The executables this language needs, in the order they are looked for. */
  readonly tools: readonly ToolSpec[];

  /**
   * How to install this language's toolchain, per package manager.
   *
   * Declared here rather than worked out, because the names genuinely differ
   * between managers and a wrong guess either installs nothing or installs
   * something else entirely. A language with no entry for a manager simply
   * cannot be installed by it, and `runtime install` says so instead of
   * inventing a package name.
   */
  readonly installable?: InstallablePackage;

  /**
   * Files copied into every sandbox: a test harness, a header, a manifest.
   *
   * Returned as data rather than a directory to copy, so a runtime works
   * identically whether it was installed from a package or is running out of
   * a source tree — and so nothing can depend on a path that exists only on
   * the author's machine.
   */
  support(): Promise<readonly WorkspaceFile[]>;

  /**
   * Build the workspace, if this language needs building.
   *
   * Returning `null` means "nothing to compile". A non-null result that did
   * not succeed stops the run and is reported as a compile error, which is a
   * different answer about the learner from a test that failed — a program
   * that did not compile has not been tested at all.
   */
  compile?(context: RunContext): Promise<CompileStep | null>;

  /** How to run the learner's program. */
  run(context: RunContext): Command;

  /** How to run the tests so that they write `REPORT_FILE`. */
  test(context: TestContext): Command;

  /** Optional formatter, if the toolchain ships one. */
  formatter?(context: RunContext): Command | null;

  /** Optional linter or static check for the editor gutter. */
  linter?(context: RunContext): Command | null;

  /**
   * Real packages the sandbox needs to be able to resolve.
   *
   * A `{ name, from }` pair becomes a directory junction at
   * `node_modules/<name>` pointing at an installed package. Used only where a
   * language genuinely cannot be practiced without a library — React being the
   * example, since a React exercise with no React is a spelling test.
   *
   * A link, not a copy: react-dom is several megabytes, and copying it into
   * every sandbox would make a five-second exercise a five-second exercise
   * plus a disk write. Linking is read-only in practice, and the sandbox's
   * isolation guarantees are about what a program can *write* and what
   * environment it inherits — neither of which a link affects.
   */
  readonly links?: readonly { readonly name: string; readonly from: string }[];

  /**
   * Build the report from the test process's own output.
   *
   * Most languages here get a harness written in the language itself, which
   * writes the shared JSON document directly. Go and Rust already ship a good
   * test runner that emits its own machine-readable stream, and reimplementing
   * `go test` in Go so that it writes our format instead of theirs would be
   * more code and a worse tool. For those, this converts.
   *
   * Returning `null` means "no report could be built", which is reported as an
   * internal error rather than as zero tests — the two are very different
   * answers about the learner's work.
   */
  reportFrom?(stdout: string, stderr: string, context: TestContext): string | null;

  /**
   * Which files are this language's tests.
   *
   * The default is "under a `tests/` directory with the right extension",
   * which suits every language here except Go — where a test must live in the
   * same package as the code it tests, so `tests/x_test.go` is a *different
   * package* and cannot see the functions it is testing at all. Forcing Go
   * into the general rule would mean teaching a layout no Go programmer uses
   * and that the compiler rejects.
   */
  isTestFile?(file: string): boolean;

  /**
   * Map a file path in the report back to the file the exercise declared.
   *
   * Needed wherever the thing that ran is not the thing that was written. A
   * React exercise declares `tests/basket.test.tsx`, esbuild compiles it to
   * `tests/basket.test.js`, and the harness honestly reports the file it
   * imported — so without this the engine sees results for a file nobody
   * declared, cannot apply the exercise's visibility rules to them, and
   * reports the declared file as having produced no cases.
   *
   * Visibility is the part that matters: an unmapped hidden test file would
   * have its results shown in full.
   */
  mapReportFile?(file: string): string;

  /**
   * A trivial program that must build and run for this language to be usable.
   *
   * Deliberately not one of the support files. Support files are copied into
   * *every* sandbox, and a fixture with a `main` in it would collide with the
   * learner's own the first time anything compiled a directory. This exists
   * only for `doctor`, so it lives only in the workspace `doctor` builds.
   */
  readonly smoke?: Workspace;
}

export interface Command {
  readonly command: string;
  readonly args: readonly string[];
  /** Extra environment on top of the sandbox's. */
  readonly env?: Record<string, string>;
}

export interface CompileStep extends Command {
  /** Human label for the failure message: "clang". */
  readonly label: string;
}

export interface RunContext {
  readonly sandbox: Sandbox;
  /** The resolved tools, in the order they were declared. */
  readonly tools: readonly FoundTool[];
  readonly entryPoint: string;
  readonly args: readonly string[];
  /**
   * Why this sandbox exists.
   *
   * Several languages build differently for a test run than for a plain run —
   * a C test file `#include`s the implementation, so compiling both together
   * would define every function twice, and Rust needs `--test` to get a test
   * binary at all. Passing the mode is the difference between one honest
   * description per language and a second parallel spec that only differs in
   * its compile step.
   */
  readonly mode: 'run' | 'test' | 'format' | 'lint';
  /** Workspace-relative paths of every file in the sandbox, sorted. */
  readonly files: readonly string[];
}

export interface TestContext extends RunContext {
  readonly testFiles: readonly string[];
  readonly reportFile: string;
  /**
   * The workspace's file contents, by path.
   *
   * Carried because a converter sometimes has to read the tests to make sense
   * of the runner's output — Go reports a test's name and package but never
   * its file, and the platform needs the file to apply visibility.
   */
  readonly sources: ReadonlyMap<string, string>;
}

/**
 * One language, backed by an external toolchain.
 *
 * Implements the whole `LanguageRuntime` contract on top of a `ToolchainSpec`.
 * Nothing above the runtime boundary can tell one of these from a hand-written
 * runtime, which is the property the cross-runtime conformance test defends.
 */
export class ToolchainRuntime implements LanguageRuntime {
  readonly #spec: ToolchainSpec;
  readonly #sandboxRoot: string | undefined;
  #support: Promise<readonly WorkspaceFile[]> | null = null;

  constructor(spec: ToolchainSpec, options: { readonly sandboxRoot?: string } = {}) {
    this.#spec = spec;
    this.#sandboxRoot = options.sandboxRoot;
  }

  metadata(): LanguageMetadata {
    return this.#spec.metadata;
  }

  // -- diagnostics ---------------------------------------------------------

  /**
   * Is this language usable on this machine, and if not, what should I do?
   *
   * Never throws, and never reports a version as if it were a readiness check.
   * When the toolchain is present it goes further and proves isolation
   * actually works here by compiling and running a trivial program — because
   * "clang is on PATH" and "we can run untrusted code safely" are different
   * claims and only the second one matters.
   */
  async doctor(): Promise<RuntimeDiagnosis> {
    const checks: RuntimeCheck[] = [];
    const found: FoundTool[] = [];

    for (const spec of this.#spec.tools) {
      const lookup = await findTool(spec);
      if (isFound(lookup)) {
        found.push(lookup);
        checks.push({
          id: spec.candidates[0] ?? spec.label,
          label: spec.label,
          status: 'pass',
          detail: `${lookup.command} — ${lookup.version}`,
        });
      } else {
        checks.push({
          id: spec.candidates[0] ?? spec.label,
          label: spec.label,
          status: 'fail',
          detail: lookup.reason,
          remedy: spec.install,
        });
      }
    }

    if (found.length === this.#spec.tools.length) {
      const smoke = await this.#smokeTest();
      checks.push(smoke);
    }

    return {
      language: this.#spec.metadata.id,
      ready: checks.every((check) => check.status !== 'fail'),
      checks,
    };
  }

  /**
   * Run something trivial end to end.
   *
   * A toolchain can be installed and still not work: a compiler with no
   * matching standard library, a runtime whose shared object is missing, a
   * sandbox on a volume mounted noexec. This is the only check that would
   * notice any of those.
   */
  async #smokeTest(): Promise<RuntimeCheck> {
    const smoke = this.#spec.smoke;
    if (!smoke) {
      return { id: 'smoke', label: 'End to end', status: 'warn', detail: 'No smoke fixture.' };
    }

    try {
      const result = await this.execute({
        workspace: smoke,
        limits: { timeoutMs: 90_000, maxOutputBytes: 32 * 1024 },
      });

      return result.outcome === 'completed' && result.exitCode === 0
        ? { id: 'smoke', label: 'End to end', status: 'pass', detail: 'Compiled and ran.' }
        : {
            id: 'smoke',
            label: 'End to end',
            status: 'fail',
            detail: (result.stderr || result.stdout).slice(0, 500),
            remedy: explainSmokeFailure(result.stderr || result.stdout),
          };
    } catch (caught) {
      return {
        id: 'smoke',
        label: 'End to end',
        status: 'fail',
        detail: caught instanceof Error ? caught.message : String(caught),
      };
    }
  }

  // -- running -------------------------------------------------------------

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const limits = resolveLimits(request.limits);
    const entryPoint = request.entryPoint ?? request.workspace.entryPoint;

    if (!entryPoint) {
      return failed('internal-error', 'No entry point: the exercise did not say what to run.');
    }

    const tools = await this.#resolveTools();
    if (!tools.ok) return failed('runtime-unavailable', tools.reason);

    return this.#inSandbox(request.workspace, 'run', async (sandbox) => {
      const context: RunContext = {
        sandbox,
        tools: tools.tools,
        entryPoint,
        args: request.args ?? [],
        mode: 'run',
        files: await listFiles(sandbox.root),
      };

      const built = await this.#build(context, limits);
      if (built) return built;

      const command = this.#spec.run(context);
      const outcome = await this.#spawn(command, sandbox, limits, request.stdin);

      return {
        outcome: outcomeOf(outcome),
        exitCode: outcome.exitCode,
        signal: outcome.signal,
        stdout: outcome.stdout,
        stderr: joinErrors(outcome),
        truncated: outcome.truncated,
        durationMs: outcome.durationMs,
      };
    });
  }

  async test(request: TestRequest): Promise<TestResult> {
    const limits = resolveLimits(request.limits);
    const testFiles = filesToTest(
      request,
      this.#spec.metadata.fileExtension,
      this.#spec.isTestFile,
    );

    if (testFiles.length === 0) return emptyTestResult('completed');

    const tools = await this.#resolveTools();
    if (!tools.ok) return emptyTestResult('runtime-unavailable', undefined, tools.reason);

    return this.#inSandbox(request.workspace, 'test', async (sandbox) => {
      const context: TestContext = {
        sandbox,
        tools: tools.tools,
        entryPoint: request.workspace.entryPoint ?? testFiles[0] ?? '',
        args: [],
        mode: 'test',
        files: await listFiles(sandbox.root),
        testFiles,
        reportFile: REPORT_FILE,
        sources: new Map(request.workspace.files.map((file) => [file.path, file.contents])),
      };

      const built = await this.#build(context, limits);
      if (built) {
        // A program that did not compile has not been tested. Reporting this
        // as "0 passed, 0 failed" would be a lie of exactly the kind this
        // product exists to avoid.
        return emptyTestResult('collection-error', undefined, built.stderr);
      }

      const outcome = await this.#spawn(this.#spec.test(context), sandbox, limits);

      if (outcome.timedOut) return emptyTestResult('timeout', outcome);
      if (outcome.spawnError) return emptyTestResult('runtime-unavailable', outcome);

      let raw: string;
      const converted = this.#spec.reportFrom?.(outcome.stdout, outcome.stderr, context);
      if (converted !== undefined) {
        if (converted === null) return emptyTestResult('internal-error', outcome);
        raw = converted;
      } else {
        try {
          raw = await sandbox.readFile(REPORT_FILE);
        } catch {
          // No report means the harness never got to write one, which is a
          // different failure from tests going red.
          return emptyTestResult('internal-error', outcome);
        }
      }

      // A harness that writes something unreadable is a broken harness, not a
      // crash. Letting the parse throw here took down the whole validate run
      // with one line of context and no indication of which language did it.
      let document;
      try {
        document = remap(parseReport(raw), this.#spec.mapReportFile);
      } catch (caught) {
        return emptyTestResult(
          'internal-error',
          outcome,
          `${this.#spec.metadata.displayName}: the test harness wrote a report that could not ` +
            `be read (${caught instanceof Error ? caught.message : String(caught)}). ` +
            `First 200 bytes: ${JSON.stringify(raw.slice(0, 200))}`,
        );
      }

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
    });
  }

  /**
   * Format the workspace, if the toolchain ships a formatter.
   *
   * Formatters here rewrite files in place, so the sandbox is read back
   * afterwards and only genuinely changed files are returned. A formatter that
   * fails reports `error` and changes nothing — handing the learner their file
   * replaced by a parser's complaint would be considerably worse than doing
   * nothing, and a formatter fails mostly on code that does not parse, which
   * is exactly when someone is mid-edit.
   */
  async format(request: FormatRequest): Promise<FormatResult> {
    const make = this.#spec.formatter;
    if (!make) return { formatted: [], available: false };

    const tools = await this.#resolveTools();
    if (!tools.ok) return { formatted: [], available: false, error: tools.reason };

    return this.#inSandbox(request.workspace, 'format', async (sandbox) => {
      const entryPoint = request.workspace.entryPoint ?? '';
      const command = make({
        sandbox,
        tools: tools.tools,
        entryPoint,
        args: [],
        mode: 'format',
        files: await listFiles(sandbox.root),
      });
      if (!command) return { formatted: [], available: false };

      const outcome = await this.#spawn(
        command,
        sandbox,
        resolveLimits(request.limits),
        undefined,
        'toolchain',
      );
      if (outcome.spawnError || outcome.timedOut) {
        return { formatted: [], available: false, error: joinErrors(outcome) };
      }
      if (outcome.exitCode !== 0) {
        return { formatted: [], available: true, error: joinErrors(outcome) };
      }

      const formatted: { path: string; contents: string }[] = [];
      for (const file of request.workspace.files) {
        const contents = await sandbox.readFile(file.path).catch(() => file.contents);
        if (contents !== file.contents) formatted.push({ path: file.path, contents });
      }
      return { formatted, available: true };
    });
  }

  async lint(request: LintRequest): Promise<LintResult> {
    if (!this.#spec.linter) return { diagnostics: [], available: false };
    const tools = await this.#resolveTools();
    if (!tools.ok) return { diagnostics: [], available: false };
    return { diagnostics: await this.diagnose(request), available: true };
  }

  /**
   * Static diagnostics for the editor gutter.
   *
   * Cheap enough to run on save: for a compiled language this is the compiler
   * in syntax-only mode, which is a fraction of the cost of a real build.
   */
  async diagnose(request: LintRequest): Promise<readonly Diagnostic[]> {
    const make = this.#spec.linter;
    if (!make) return [];

    const tools = await this.#resolveTools();
    if (!tools.ok) return [];

    return this.#inSandbox(request.workspace, 'lint', async (sandbox) => {
      const entryPoint = request.workspace.entryPoint ?? '';
      const command = make({
        sandbox,
        tools: tools.tools,
        entryPoint,
        args: [],
        mode: 'lint',
        files: await listFiles(sandbox.root),
      });
      if (!command) return [];

      const outcome = await this.#spawn(
        command,
        sandbox,
        resolveLimits(request.limits),
        undefined,
        'toolchain',
      );
      return parseDiagnostics(
        `${outcome.stdout}
${outcome.stderr}`,
        entryPoint,
      );
    });
  }

  // -- internals -----------------------------------------------------------

  async #resolveTools(): Promise<
    { ok: true; tools: readonly FoundTool[] } | { ok: false; reason: string }
  > {
    const tools: FoundTool[] = [];
    for (const spec of this.#spec.tools) {
      const lookup = await findTool(spec);
      if (!isFound(lookup)) return { ok: false, reason: lookup.reason };
      tools.push(lookup);
    }
    return { ok: true, tools };
  }

  #supportFiles(): Promise<readonly WorkspaceFile[]> {
    // Read once. The harness for a language is the same bytes every time, and
    // re-reading it per attempt is filesystem work in the hot path.
    this.#support ??= this.#spec.support();
    return this.#support;
  }

  async #inSandbox<T>(
    workspace: Workspace,
    prefix: string,
    body: (sandbox: Sandbox) => Promise<T>,
  ): Promise<T> {
    const support = await this.#supportFiles();
    const links = this.#spec.links ?? [];

    return withSandbox(
      // Support first, so an exercise that legitimately overrides a harness
      // file wins. Nothing does today; when something does, the exercise
      // should be the one that decides.
      { ...workspace, files: [...support, ...workspace.files] },
      async (sandbox) => {
        for (const link of links) await linkPackage(sandbox.root, link);
        return body(sandbox);
      },
      {
        prefix: `${this.#spec.metadata.id}-${prefix}`,
        ...(this.#sandboxRoot ? { rootDir: this.#sandboxRoot } : {}),
      },
    );
  }

  /** Compile, if this language compiles. Returns a failure result, or null. */
  async #build(
    context: RunContext,
    limits: { timeoutMs: number; maxOutputBytes: number },
  ): Promise<ExecutionResult | null> {
    const step = await this.#spec.compile?.(context);
    if (!step) return null;

    const outcome = await this.#spawn(
      step,
      context.sandbox,
      {
        // Compiling is not the thing being timed. Charging a learner's execution
        // budget for a cold compiler start would make a correct program look
        // like a timeout on the first run of the day.
        timeoutMs: Math.max(limits.timeoutMs, 90_000),
        maxOutputBytes: limits.maxOutputBytes,
      },
      undefined,
      'toolchain',
    );

    if (outcome.exitCode === 0 && !outcome.spawnError && !outcome.timedOut) return null;

    return {
      // Not a distinct outcome: the four the contract defines are about the
      // *platform*, and a program that does not compile is a normal, expected
      // result of a learner's work. It reports as a completed run with a
      // non-zero exit and the compiler's message, which is what a terminal
      // would have shown.
      outcome: outcome.timedOut ? 'timeout' : 'completed',
      exitCode: outcome.exitCode ?? 1,
      signal: outcome.signal,
      stdout: outcome.stdout,
      // Both streams, because compilers disagree about which one diagnostics
      // belong on. MSBuild writes every error to *stdout*, so reporting only
      // stderr turned a perfectly clear `error CS0411` into "dotnet build
      // failed with no output" — the least useful message this could produce,
      // about a failure it had the text of all along.
      stderr: compilerOutput(outcome) || `${step.label} failed with no output.`,
      truncated: outcome.truncated,
      durationMs: outcome.durationMs,
    };
  }

  /**
   * Spawn something, in one of two environments.
   *
   * The distinction is a security boundary and worth stating plainly.
   *
   * **`sandboxed`** is for the learner's own program. It gets the locked-down
   * environment: nothing inherited, no PATH, no home directory, no credentials
   * sitting in environment variables. Untrusted code runs here.
   *
   * **`toolchain`** is for the compiler, the formatter and the linter — code
   * the machine's owner installed, not code the learner wrote. These genuinely
   * need PATH to find their own back ends, `DOTNET_ROOT` to locate a runtime,
   * `CARGO_HOME` for a toolchain manager, and a home directory for their
   * caches. Running them in the sandbox environment is how you get "dotnet
   * build failed with no output": the process starts, cannot find itself, and
   * dies before it can say so.
   *
   * Conflating the two would mean either a compiler that cannot run or a
   * sandbox that is not one. They are separate, and the compiled artifact
   * still runs under `sandboxed`.
   */
  #spawn(
    command: Command,
    sandbox: Sandbox,
    limits: { timeoutMs: number; maxOutputBytes: number },
    stdin?: string,
    environment: 'sandboxed' | 'toolchain' = 'sandboxed',
  ): Promise<ProcessOutcome> {
    const base = environment === 'toolchain' ? inheritedPath() : buildSandboxEnvironment();
    return runProcess({
      command: command.command,
      args: [...command.args],
      cwd: sandbox.root,
      env: { ...base, ...(command.env ?? {}) },
      timeoutMs: limits.timeoutMs,
      maxOutputBytes: limits.maxOutputBytes,
      ...(stdin !== undefined ? { stdin } : {}),
    });
  }
}

/**
 * Turn a smoke-test failure into something the learner can act on.
 *
 * "The toolchain is installed but could not build a trivial program" is true
 * and useless. These three cases account for almost every real occurrence, and
 * each has a specific fix — a compiler with no standard library is by far the
 * commonest, because installing LLVM on Windows does not install anything to
 * link against and nothing warns you.
 */
function explainSmokeFailure(output: string): string {
  if (/libcmt\.lib|oldnames\.lib|kernel32\.lib|lld-link: error: could not open/iu.test(output)) {
    return (
      'The compiler is installed but has nothing to link against. On Windows, install the ' +
      'Visual Studio Build Tools ("Desktop development with C++"), or use the MSYS2 ' +
      'toolchain instead, which ships its own libraries.'
    );
  }
  // Matches both `'stdio.h' file not found` and the C++ form, where the
  // standard headers have no extension at all: `'iostream' file not found`.
  if (
    /file not found|No such file or directory/iu.test(output) &&
    /fatal error|#include/iu.test(output)
  ) {
    return (
      'The compiler cannot find the standard library headers. On macOS run ' +
      '`xcode-select --install`; on Windows install the Visual Studio Build Tools or MSYS2; ' +
      'on Linux install the libc development package (`libc6-dev` or `glibc-devel`).'
    );
  }
  if (/permission denied|Operation not permitted|noexec/iu.test(output)) {
    return (
      'The sandbox directory does not allow executing files. Set a sandbox root on a volume ' +
      'that is not mounted noexec, or exclude it from endpoint protection.'
    );
  }
  return 'The toolchain is installed but could not build and run a trivial program.';
}

/**
 * Compiler and interpreter diagnostics, in the one format they all agree on.
 *
 * `file:line:column: severity: message` is emitted by clang, gcc, tsc, php and
 * most others, which makes one parser enough for the editor gutter. Anything
 * that does not match is skipped rather than guessed at — a diagnostic in the
 * wrong place is worse than no diagnostic.
 */
export function parseDiagnostics(output: string, file: string): readonly Diagnostic[] {
  const pattern =
    /^(?<path>[^\s:][^:]*):(?<line>\d+):(?:(?<column>\d+):)?\s*(?<severity>error|warning|note|fatal error):\s*(?<message>.+)$/u;
  const diagnostics: Diagnostic[] = [];

  for (const raw of output.split('\n')) {
    const match = pattern.exec(raw.trim());
    const groups = match?.groups;
    if (!groups) continue;

    diagnostics.push({
      severity: groups['severity']?.includes('error') === true ? 'error' : 'warning',
      message: groups['message'] ?? '',
      location: {
        path: groups['path'] === undefined ? file : groups['path'],
        line: Number(groups['line']),
        column: groups['column'] === undefined ? 1 : Number(groups['column']),
      },
      source: 'compile',
    });
  }

  return diagnostics;
}

/**
 * Which files are the tests.
 *
 * `only` when the engine said so, otherwise anything under a `test/` or
 * `tests/` directory carrying this language's extension. Directory-based
 * rather than name-based: several of these languages have a firm convention
 * for the directory and none for the filename, and one rule that works
 * everywhere beats ten that nearly do.
 */
function filesToTest(
  request: TestRequest,
  extension: string,
  isTestFile: ((file: string) => boolean) | undefined,
): readonly string[] {
  if (request.only && request.only.length > 0) return [...request.only];

  // The default suits every language here except Go, which requires a test to
  // sit in the same package as the code it tests.
  const matches =
    isTestFile ??
    ((candidate: string) =>
      /(^|[\\/])tests?[\\/]/u.test(candidate) && candidate.toLowerCase().endsWith(extension));

  return request.workspace.files.map((file) => file.path).filter(matches);
}

/**
 * Rewrite the file paths in a report, if the language needs it.
 *
 * Applied before visibility is resolved, because visibility is keyed on the
 * declared path and a case filed under the wrong name would be treated as
 * visible by default.
 */
function remap(
  document: StructuredReport,
  map: ((file: string) => string) | undefined,
): StructuredReport {
  if (!map) return document;
  return {
    ...document,
    collectionErrors: document.collectionErrors.map((entry) => ({
      ...entry,
      path: map(entry.path),
    })),
    cases: document.cases.map((entry) => ({
      ...entry,
      file: map(entry.file),
      // The id carries the file too, as `path::name`, and it is the id the
      // engine keys visibility and collection on. Rewriting only the `file`
      // field looked right and changed nothing that mattered.
      id: entry.id.includes('::')
        ? `${map(entry.id.slice(0, entry.id.indexOf('::')))}${entry.id.slice(entry.id.indexOf('::'))}`
        : entry.id,
      ...(entry.location
        ? { location: { ...entry.location, path: map(entry.location.path) } }
        : {}),
    })),
  };
}

/**
 * Make one installed package resolvable from inside the sandbox.
 *
 * A junction on Windows and a symlink elsewhere. If the link cannot be made —
 * an unprivileged Windows account without developer mode is the realistic
 * case — the package is copied instead, because a slow exercise is better than
 * a broken one.
 */
async function linkPackage(root: string, link: { name: string; from: string }): Promise<void> {
  const target = nodePath.join(root, 'node_modules', link.name);
  await fsp.mkdir(nodePath.dirname(target), { recursive: true });

  try {
    await fsp.symlink(link.from, target, 'junction');
  } catch {
    await fsp.cp(link.from, target, { recursive: true, dereference: true });
  }
}

/**
 * Every file in the sandbox, workspace-relative and sorted.
 *
 * Handed to each spec so a compiler can be given a real file list rather than
 * a glob. Nothing here runs a shell — `*.c` passed to `clang` is a filename
 * containing an asterisk — so the expansion has to happen on this side, and
 * doing it once is better than each language remembering to.
 */
async function listFiles(root: string): Promise<readonly string[]> {
  const found: string[] = [];

  async function walk(directory: string, prefix: string): Promise<void> {
    for (const entry of await fsp.readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      // `node_modules` holds the harness and any linked library. Neither is
      // the learner's code, and walking a linked react-dom would be thousands
      // of paths that no compiler should be handed.
      if (entry.name === 'node_modules') continue;
      if (entry.isDirectory()) await walk(nodePath.join(directory, entry.name), relative);
      else found.push(relative);
    }
  }

  await walk(root, '');
  return found.sort();
}

function outcomeOf(outcome: ProcessOutcome): ExecutionOutcome {
  if (outcome.spawnError) return 'runtime-unavailable';
  if (outcome.timedOut) return 'timeout';
  return 'completed';
}

/**
 * Everything a failed build said, wherever it said it.
 *
 * clang and rustc write diagnostics to stderr; MSBuild writes them to stdout;
 * `go build` uses both. Picking one stream loses the message for whichever
 * compilers chose the other.
 */
function compilerOutput(outcome: ProcessOutcome): string {
  return [outcome.stderr, outcome.stdout, outcome.spawnError]
    .filter((part) => part !== undefined && part.trim() !== '')
    .join('\n')
    .trim();
}

function joinErrors(outcome: ProcessOutcome): string {
  return outcome.spawnError ? `${outcome.stderr}\n${outcome.spawnError}`.trim() : outcome.stderr;
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

function emptyTestResult(
  outcome: TestResult['outcome'],
  process?: ProcessOutcome,
  message?: string,
): TestResult {
  return {
    outcome,
    cases: [],
    passed: 0,
    failed: 0,
    errored: 0,
    skipped: 0,
    durationMs: process?.durationMs ?? 0,
    stdout: process?.stdout ?? '',
    stderr: [message, process ? joinErrors(process) : ''].filter(Boolean).join('\n'),
    truncated: process?.truncated ?? false,
  };
}
