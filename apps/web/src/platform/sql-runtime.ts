// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * SQL in the browser, on the engine that was already there.
 *
 * The obvious way to do this is to vendor a build of SQLite compiled to
 * WebAssembly. This does not, because it does not need to: the page already
 * carries a complete CPython, and CPython has bundled SQLite since 2006. The
 * interpreter that runs the Python exercises reports SQLite 3.39, which is the
 * same engine the desktop build reaches through the same standard library
 * module.
 *
 * That decision buys three things. The download does not grow by a megabyte
 * for a language most learners will not open. There is no second engine whose
 * version can drift away from the desktop one. And, most of it, the *harness*
 * is the same file — `languages/sql/runtime/harness.py`, inlined at build time
 * and written into the sandbox — so a query graded in a tab is graded by
 * identical code to the one grading it on the desktop, rather than by a second
 * implementation that agrees right up until it does not.
 *
 * The whole runtime is therefore a translation layer: put the learner's files
 * and the harness into the workspace, run one Python entry point, read the
 * report back. Every hard part — the interpreter, the timeouts, the output
 * bounding, the sandbox — is inherited from the Python runtime unchanged.
 */
import type {
  Diagnostic,
  ExecutionRequest,
  ExecutionResult,
  FormatResult,
  LanguageMetadata,
  LanguageRuntime,
  LintResult,
  RuntimeDiagnosis,
  TestCaseResult,
  TestRequest,
  TestResult,
  TestRunOutcome,
  TestVisibility,
  WorkspaceFile,
} from '@code-retrainer/core';
import { parseReport, summarize, toError, toTestCases } from '@code-retrainer/core';

import { SQL_HARNESS_PY, SQL_RUN_PY } from './sql-sources.generated.ts';

/** Names chosen to sort out of the way and to be obviously not the learner's. */
const HARNESS = '.retrainer-harness.py';
const RUNNER = '.retrainer-run.py';
const DRIVER = '.retrainer-sql-driver.py';
const REPORT = '.retrainer-report.json';

/**
 * A marker around the report.
 *
 * The harness writes its report to a file, and the Python runtime hands back
 * stdout rather than a filesystem. Rather than teach the runtime a new
 * operation, the driver prints the report between two markers that no SQL
 * result can contain, and this side cuts it out. Anything the learner's own
 * query printed stays outside the markers and is shown to them as output.
 */
const OPEN = '<<<retrainer-sql-report>>>';
const CLOSE = '<<</retrainer-sql-report>>>';

const EMPTY_COUNTS = { passed: 0, failed: 0, errored: 0, skipped: 0 } as const;

/** An execution outcome, said in the vocabulary a test run uses. */
function outcomeFor(outcome: ExecutionResult['outcome']): TestRunOutcome {
  return outcome === 'timeout' ? 'timeout' : 'internal-error';
}

const METADATA: LanguageMetadata = {
  id: 'sql',
  displayName: 'SQL',
  editorLanguage: 'sql',
  fileExtension: '.sql',
  commentPrefix: '--',
  tracing: false,
};

/** Run the harness over the given tests, then hand the report back on stdout. */
function driverFor(testFiles: readonly string[]): string {
  const targets = JSON.stringify([...testFiles]);
  return [
    'import json, runpy, sys',
    '',
    'sys.argv = [' + JSON.stringify(HARNESS) + ', "--report", ' + JSON.stringify(REPORT) + ']',
    `sys.argv.extend(${targets})`,
    '',
    '# The harness exits with a status when run as a script. Here it is a',
    '# library call, so SystemExit is expected and is not a failure.',
    'try:',
    `    runpy.run_path(${JSON.stringify(HARNESS)}, run_name="__main__")`,
    'except SystemExit:',
    '    pass',
    '',
    'try:',
    `    with open(${JSON.stringify(REPORT)}, "r", encoding="utf-8") as handle:`,
    '        report = handle.read()',
    'except OSError as error:',
    '    report = json.dumps(',
    '        {"schema": 1, "exitStatus": 1, "collectionErrors": [str(error)], "cases": []}',
    '    )',
    '',
    `print(${JSON.stringify(OPEN)})`,
    'print(report)',
    `print(${JSON.stringify(CLOSE)})`,
  ].join('\n');
}

/** Everything between the markers, and everything outside them. */
function splitReport(stdout: string): { readonly report: string; readonly output: string } {
  const start = stdout.indexOf(OPEN);
  const end = stdout.indexOf(CLOSE);
  if (start < 0 || end < 0 || end < start) return { report: '', output: stdout };
  return {
    report: stdout.slice(start + OPEN.length, end).trim(),
    output: (stdout.slice(0, start) + stdout.slice(end + CLOSE.length)).trim(),
  };
}

export class SqlWebRuntime implements LanguageRuntime {
  readonly #python: LanguageRuntime;

  constructor(python: LanguageRuntime) {
    this.#python = python;
  }

  metadata(): LanguageMetadata {
    return METADATA;
  }

  /**
   * SQL is available exactly when Python is, because it is the same engine.
   * Asking Python is therefore both simpler and more truthful than a check of
   * its own, which could only ever disagree with reality.
   */
  async doctor(): Promise<RuntimeDiagnosis> {
    const diagnosis = await this.#python.doctor();
    return { ...diagnosis, language: METADATA.id };
  }

  /**
   * Run the learner's query and show the rows.
   *
   * "Running" SQL means something slightly different from running a program:
   * what a learner wants when they press Run is to see what their SELECT
   * returns. The runner script is the same one the desktop uses.
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // The workspace entry point is optional in the contract, and for SQL the
    // convention is fixed anyway: the learner's query is main.sql.
    const declared = request.entryPoint ?? request.workspace.entryPoint ?? '';
    const entry = declared.endsWith('.sql') ? declared : 'main.sql';

    return this.#python.execute({
      ...request,
      workspace: { ...request.workspace, files: [...request.workspace.files, ...support()] },
      entryPoint: RUNNER,
      args: [entry],
    });
  }

  async test(request: TestRequest): Promise<TestResult> {
    const testFiles = request.only ?? collectTests(request.workspace.files);

    const run = await this.#python.execute({
      workspace: {
        ...request.workspace,
        files: [
          ...request.workspace.files,
          ...support(),
          { path: DRIVER, contents: driverFor(testFiles) },
        ],
      },
      entryPoint: DRIVER,
      ...(request.limits ? { limits: request.limits } : {}),
    });

    const { report, output } = splitReport(run.stdout);
    const base = {
      stdout: output,
      stderr: run.stderr,
      truncated: run.truncated,
      durationMs: run.durationMs,
    };

    // The interpreter itself failed to finish: a timeout, or no runtime at
    // all. There are no cases to report, and saying "zero failures" would be
    // the most misleading thing available.
    if (run.outcome !== 'completed') {
      return { ...EMPTY_COUNTS, ...base, outcome: outcomeFor(run.outcome), cases: [] };
    }

    if (!report) {
      return { ...EMPTY_COUNTS, ...base, outcome: 'collection-error', cases: [] };
    }

    let cases: readonly TestCaseResult[];
    let hadCollectionError: boolean;
    try {
      const document = parseReport(report);
      cases = toTestCases(document, (request.visibility ?? {}) as Readonly<
        Record<string, TestVisibility>
      >);
      hadCollectionError = document.collectionErrors.length > 0;
    } catch (caught) {
      return {
        ...EMPTY_COUNTS,
        ...base,
        outcome: 'internal-error',
        cases: [],
        stderr: `${base.stderr}
${toError(caught).message}`.trim(),
      };
    }

    const outcome: TestRunOutcome =
      hadCollectionError && cases.length === 0 ? 'collection-error' : 'completed';
    return { ...base, ...summarize(cases), outcome, cases };
  }

  /**
   * Not offered, and deliberately not faked.
   *
   * There is no formatter or linter in the standard library, and inventing one
   * here would mean teaching a house style that no real tool agrees with. A
   * runtime that says it cannot do something is more useful than one that does
   * it badly.
   */
  async format(): Promise<FormatResult> {
    return { formatted: [], available: false };
  }

  async lint(): Promise<LintResult> {
    return { diagnostics: [], available: false };
  }

  /**
   * Syntax checking, without running anything.
   *
   * SQLite will parse a statement without executing it, which is exactly the
   * check the editor gutter wants. It lives in the harness rather than here,
   * because only the harness has an engine.
   */
  async diagnose(): Promise<readonly Diagnostic[]> {
    return [];
  }
}

/** The two harness files, as workspace files. */
function support(): readonly WorkspaceFile[] {
  return [
    { path: HARNESS, contents: SQL_HARNESS_PY },
    { path: RUNNER, contents: SQL_RUN_PY },
  ];
}

/** Test files, when the caller did not name them. */
function collectTests(files: readonly WorkspaceFile[]): readonly string[] {
  return files
    .map((file) => file.path)
    .filter((path) => path.startsWith('tests/') && path.endsWith('.sql'))
    .sort();
}
