// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * PHP in the browser, as a real PHP.
 *
 * Not an interpreter written in JavaScript, and not a subset: this is the PHP
 * source tree compiled to WebAssembly, running the same single-file harness
 * the desktop hands to a `php` binary. A test that passes in a tab passes for
 * the same reason it passes on a machine with PHP installed.
 *
 * The cost is nineteen megabytes, and it is paid by the people who ask for it.
 * The runtime boots on first use rather than at page load, so a learner who
 * never opens PHP never downloads it — the same arrangement Python has. That
 * is the only thing that makes a dependency this size defensible in a page
 * that is otherwise under a megabyte.
 *
 * The deployed site carries two builds of the engine and a browser downloads
 * exactly one: the faster stack-switching build where that is supported, and a
 * universally compatible one everywhere else. So the extra nineteen megabytes
 * is a hosting cost rather than a download, which is the cheaper of the two to
 * pay.
 *
 * Two details worth knowing. The engine is loaded through a static import, so
 * the bundler emits the WebAssembly as an ordinary asset next to the page and
 * nothing is ever fetched from a content delivery network — which the content
 * security policy would refuse anyway. And PHP is driven through its command
 * line interface rather than as a web server, because the harness is a command
 * line program that reads `$_SERVER['argv']`, and pretending otherwise would
 * mean maintaining a second way to invoke it.
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
} from '@code-retrainer/core';
import { parseReport, summarize, toError, toTestCases } from '@code-retrainer/core';

import type { PHP, PHPLoaderModule } from '@php-wasm/universal';

import { PHP_HARNESS } from './php-sources.generated.ts';

const WORK = '/work';
const HARNESS = '.retrainer-harness.php';
const REPORT = '.retrainer-report.json';

/**
 * The same interpreter settings the desktop passes.
 *
 * Kept identical on purpose: a warning that appears on one and not the other
 * is a difference a learner cannot explain and should never have to.
 * `assert.active` is deliberately absent here too — it was deprecated in 8.3
 * and setting it prints a startup warning before every run.
 */
const STRICT: readonly string[] = [
  '-d',
  'error_reporting=E_ALL',
  '-d',
  'display_errors=stderr',
  '-d',
  'log_errors=0',
  '-d',
  'max_execution_time=0',
  '-d',
  'memory_limit=256M',
];

const METADATA: LanguageMetadata = {
  id: 'php',
  displayName: 'PHP',
  editorLanguage: 'php',
  fileExtension: '.php',
  commentPrefix: '//',
  tracing: false,
};

const EMPTY_COUNTS = { passed: 0, failed: 0, errored: 0, skipped: 0 } as const;

/** What a CLI session produced. */
interface CliRun {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly report: string | null;
}

/**
 * The engine, as the upstream package defines it.
 *
 * Imported rather than described here on purpose. A hand-written interface
 * would have compiled against a shape I assumed and failed at runtime against
 * the shape that exists — which is exactly what happened on the first attempt:
 * `cli()` returns streams, not the `.text` and `.errors` strings the buffered
 * response carries.
 */
type PhpEngine = PHP;

/** The engine's modules, loaded once and used to build each fresh instance. */
interface PhpModules {
  readonly getPHPLoaderModule: () => Promise<PHPLoaderModule>;
  readonly loadPHPRuntime: (module: PHPLoaderModule) => Promise<number>;
  readonly PHP: new (id: number) => PHP;
}

export interface PhpWebRuntimeOptions {
  /** Called once, while the engine is downloading. */
  readonly onProgress?: (message: string) => void;
}

export class PhpWebRuntime implements LanguageRuntime {
  readonly #options: PhpWebRuntimeOptions;
  #engine: Promise<PhpModules> | null = null;

  constructor(options: PhpWebRuntimeOptions = {}) {
    this.#options = options;
  }

  metadata(): LanguageMetadata {
    return METADATA;
  }

  /**
   * A fresh interpreter for every run.
   *
   * The engine keeps state that outlives a single command line — most
   * obviously the `require_once` registry, which is what a test file uses to
   * pull in the learner's solution. Reusing one instance meant the second run
   * silently kept the *first* run's functions: a solution edited to be wrong
   * still passed, because the old definition was already loaded. That is the
   * worst kind of failure a grader can have, so it is fixed by construction
   * rather than by remembering to clear things.
   *
   * The expensive part is not repeated. The WebAssembly module is compiled
   * once and cached by the browser; only the instance is new, which is
   * milliseconds. This is the same isolation the Python host gets by purging
   * workspace modules between runs.
   */
  async #fresh(): Promise<PhpEngine> {
    const { getPHPLoaderModule, loadPHPRuntime, PHP } = await this.#loaded();
    const id = await loadPHPRuntime(await getPHPLoaderModule());
    return new PHP(id);
  }

  /**
   * Load the engine's modules once, on first use.
   *
   * The promise itself is cached rather than its result, so two runs started
   * before the first finishes wait on one download instead of racing into two.
   */
  #loaded(): Promise<PhpModules> {
    if (this.#engine) return this.#engine;

    this.#engine = (async () => {
      this.#options.onProgress?.('Starting PHP…');
      // One version, imported directly.
      //
      // The package's own `loadWebRuntime` switches across every PHP it
      // supports, from 5.2 to 8.5, and a bundler following that switch pulls
      // all eight binaries into the build — roughly three hundred megabytes to
      // ship one language. Naming the version here means exactly one is
      // emitted, and the choice is visible in the source rather than buried in
      // a runtime branch.
      const [{ getPHPLoaderModule }, { loadPHPRuntime, PHP }] = await Promise.all([
        import('@php-wasm/web-8-4'),
        import('@php-wasm/universal'),
      ]);
      this.#options.onProgress?.('PHP ready.');
      return { getPHPLoaderModule, loadPHPRuntime, PHP };
    })();

    // A failed boot must not be remembered as a booted engine, or every later
    // run reports the same stale failure with no way to retry.
    this.#engine.catch(() => {
      this.#engine = null;
    });
    return this.#engine;
  }

  async doctor(): Promise<RuntimeDiagnosis> {
    try {
      const php = await this.#fresh();
      const run = await php.cli(['php', '-r', 'echo PHP_VERSION;']);
      const version = (await run.stdoutText).trim();
      return {
        language: METADATA.id,
        ready: true,
        checks: [
          {
            id: 'php',
            label: 'PHP engine',
            status: 'pass',
            detail: `PHP ${version} compiled to WebAssembly, running in this tab.`,
          },
        ],
      };
    } catch (caught) {
      return {
        language: METADATA.id,
        ready: false,
        checks: [
          {
            id: 'php',
            label: 'PHP engine',
            status: 'fail',
            detail: `The PHP engine did not start: ${toError(caught).message}`,
            remedy: 'Reload the page. If it keeps failing, the desktop app runs PHP natively.',
          },
        ],
      };
    }
  }

  /** Materialize a workspace, then run one command line inside it. */
  async #session(
    files: readonly { readonly path: string; readonly contents: string }[],
    argv: readonly string[],
  ): Promise<CliRun> {
    const php = await this.#fresh();

    // A fresh directory every run. The engine lives for the life of the tab,
    // so without this a file the learner deleted would still be there.
    try {
      php.mkdir(WORK);
    } catch {
      // Already present, which is the ordinary case after the first run.
    }

    for (const file of files) {
      const target = `${WORK}/${file.path}`;
      const parent = target.slice(0, target.lastIndexOf('/'));
      if (parent && parent !== WORK) php.mkdir(parent);
      php.writeFile(target, file.contents);
    }

    // `chdir` rather than the `cwd` option, which did not take: the first run
    // reported "Could not open input file: main.php" because PHP was still
    // sitting at the filesystem root. Relative paths matter here beyond
    // convenience — the report records each test by the path it was given, and
    // the visibility map is keyed by the relative one.
    php.chdir(WORK);
    const run = await php.cli(['php', ...argv], { cwd: WORK });

    // Every field is a promise over a stream: the process has not necessarily
    // finished when `cli` resolves, and reading the report before it has would
    // be a race that passes on a fast machine.
    const [stdout, stderr, exitCode] = await Promise.all([
      run.stdoutText,
      run.stderrText,
      run.exitCode,
    ]);

    const reportPath = `${WORK}/${REPORT}`;
    const report = php.fileExists(reportPath) ? php.readFileAsText(reportPath) : null;

    return { stdout, stderr, exitCode, report };
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const entry = request.entryPoint ?? request.workspace.entryPoint ?? 'main.php';
    const started = Date.now();

    try {
      const run = await this.#session(request.workspace.files, [
        ...STRICT,
        entry,
        ...(request.args ?? []),
      ]);
      return {
        outcome: 'completed',
        exitCode: run.exitCode,
        signal: null,
        stdout: run.stdout,
        stderr: run.stderr,
        truncated: false,
        durationMs: Date.now() - started,
      };
    } catch (caught) {
      return {
        outcome: 'internal-error',
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: toError(caught).message,
        truncated: false,
        durationMs: Date.now() - started,
      };
    }
  }

  async test(request: TestRequest): Promise<TestResult> {
    const testFiles =
      request.only ??
      request.workspace.files
        .map((file) => file.path)
        .filter((path) => path.startsWith('tests/') && path.endsWith('.php'))
        .sort();

    const started = Date.now();
    let run: CliRun;
    try {
      run = await this.#session(
        [...request.workspace.files, { path: HARNESS, contents: PHP_HARNESS }],
        [...STRICT, HARNESS, '--report', REPORT, ...testFiles],
      );
    } catch (caught) {
      return {
        ...EMPTY_COUNTS,
        outcome: 'internal-error',
        cases: [],
        stdout: '',
        stderr: toError(caught).message,
        truncated: false,
        durationMs: Date.now() - started,
      };
    }

    const base = {
      stdout: run.stdout,
      stderr: run.stderr,
      truncated: false,
      durationMs: Date.now() - started,
    };

    // No report means the harness never reached the end: a parse error in the
    // learner's file, usually. Reporting zero failures would be the most
    // misleading thing available.
    if (run.report === null) {
      return { ...EMPTY_COUNTS, ...base, outcome: 'collection-error', cases: [] };
    }

    let cases: readonly TestCaseResult[];
    let hadCollectionError: boolean;
    try {
      const document = parseReport(run.report);
      cases = toTestCases(
        document,
        (request.visibility ?? {}) as Readonly<Record<string, TestVisibility>>,
      );
      hadCollectionError = document.collectionErrors.length > 0;
    } catch (caught) {
      return {
        ...EMPTY_COUNTS,
        ...base,
        outcome: 'internal-error',
        cases: [],
        stderr: `${base.stderr}\n${toError(caught).message}`.trim(),
      };
    }

    const outcome: TestRunOutcome =
      hadCollectionError && cases.length === 0 ? 'collection-error' : 'completed';
    return { ...base, ...summarize(cases), outcome, cases };
  }

  /** No formatter or linter is bundled, and saying so beats inventing one. */
  async format(): Promise<FormatResult> {
    return { formatted: [], available: false };
  }

  async lint(): Promise<LintResult> {
    return { diagnostics: [], available: false };
  }

  /**
   * Syntax errors, from PHP's own parser.
   *
   * `-l` checks a file without executing it, which is exactly what the editor
   * gutter wants and is far cheaper than a run.
   */
  async diagnose(request: { readonly workspace: { readonly files: readonly { readonly path: string; readonly contents: string }[] } }): Promise<
    readonly Diagnostic[]
  > {
    const diagnostics: Diagnostic[] = [];

    for (const file of request.workspace.files) {
      if (!file.path.endsWith('.php')) continue;
      const run = await this.#session(request.workspace.files, ['-l', file.path]);
      if (run.exitCode === 0) continue;

      // `PHP Parse error: syntax error, unexpected ... in file on line 4`
      const match = /on line (\d+)/.exec(run.stderr + run.stdout);
      diagnostics.push({
        severity: 'error',
        message: (run.stderr || run.stdout).split('\n')[0]?.trim() ?? 'Parse error',
        code: 'ParseError',
        source: 'compile',
        location: { path: file.path, line: match?.[1] ? Number(match[1]) : 1, column: 1 },
      });
    }

    return diagnostics;
  }
}
