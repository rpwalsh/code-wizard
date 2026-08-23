// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ValidationIssue, ValidationReport } from '@code-retrainer/exercises';
import {
  attemptWorkspace,
  orderedHints,
  runMutationTesting,
  solutionWorkspace,
  testVisibility,
  validateCatalog,
  validateExercise,
} from '@code-retrainer/exercises';

import { javascriptMutationOperators } from '@code-retrainer/javascript';
import { pythonMutationOperators } from '@code-retrainer/python';

import type { CliContext } from '../context.ts';
import { createContext, relativeToRepository } from '../context.ts';
import { formatTestResult } from '../format-results.ts';
import { columns, heading, indent, pluralize, style, symbol } from '../terminal.ts';
import type { Flags } from './runtime.ts';

function flagString(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

function flagBoolean(flags: Flags, name: string): boolean {
  return flags[name] === true;
}

export async function runExerciseCommand(args: readonly string[], flags: Flags): Promise<number> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case 'list':
      return list(flags);
    case 'show':
      return show(rest[0]);
    case 'validate':
      return validate(rest[0], flags);
    case 'run':
      return run(rest[0], flags);
    case 'mutate':
      return mutate(rest[0], flags);
    default:
      console.error(style.red(`Unknown exercise command "${subcommand ?? ''}".`));
      console.error(
        'Try: code-retrainer exercise list | show <id> | validate | run <id> | mutate [id]',
      );
      return 2;
  }
}

async function list(flags: Flags): Promise<number> {
  const context = await createContext();
  reportLoadFailures(context.loadFailures);

  const language = flagString(flags, 'language');
  const exercises = (language ? context.catalog.forLanguage(language) : context.catalog.all()).sort(
    (a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id),
  );

  if (exercises.length === 0) {
    console.log(style.gray('No exercises found.'));
    return context.loadFailures.length > 0 ? 1 : 0;
  }

  console.log(heading(`Exercises (${exercises.length})`));
  console.log(
    columns(
      exercises.map((exercise) => [
        exercise.id,
        `${style.gray(`d${exercise.difficulty}`)} ${exercise.title} ${style.gray(
          `· ${exercise.kind} · ${Math.round(exercise.estimatedSeconds / 60)}m`,
        )}`,
      ]),
    ),
  );
  return context.loadFailures.length > 0 ? 1 : 0;
}

async function show(id: string | undefined): Promise<number> {
  if (!id) {
    console.error(style.red('Usage: code-retrainer exercise show <id>'));
    return 2;
  }
  const context = await createContext();
  if (!context.catalog.has(id)) {
    console.error(style.red(`Unknown exercise "${id}".`));
    return 2;
  }
  const exercise = context.catalog.get(id);

  console.log(heading(exercise.title));
  console.log(
    columns([
      ['id', exercise.id],
      ['version', String(exercise.version)],
      ['language', exercise.language],
      ['kind', exercise.kind],
      ['difficulty', String(exercise.difficulty)],
      ['estimated', `${Math.round(exercise.estimatedSeconds / 60)} min`],
      ['skills', exercise.skills.join(', ')],
      ['prerequisites', exercise.prerequisites.join(', ') || style.gray('none')],
      ['source', relativeToRepository(exercise.source.directory)],
    ]),
  );

  console.log(heading('Prompt'));
  console.log(indent(exercise.prompt));

  console.log(heading('Starter files'));
  for (const file of exercise.starter.files) console.log(`  ${file.path}`);

  console.log(heading('Tests'));
  console.log(
    columns(exercise.tests.map((test) => [`  ${test.path}`, style.gray(test.visibility)])),
  );

  const hints = orderedHints(exercise);
  if (hints.length > 0) {
    console.log(heading(`Hints (${hints.length})`));
    for (const [index, hint] of hints.entries()) {
      console.log(`  ${index + 1}. ${style.gray(`[${hint.level}]`)} ${hint.text}`);
    }
  }

  if (exercise.explanation) {
    console.log(heading('Explanation'));
    console.log(indent(exercise.explanation));
  }
  return 0;
}

async function validate(id: string | undefined, flags: Flags): Promise<number> {
  const context = await createContext();
  const hasLoadFailures = reportLoadFailures(context.loadFailures);

  // `--fast` skips execution. Useful in an authoring loop; never in CI, since
  // execution is the only check that proves the exercise actually works.
  const fast = flagBoolean(flags, 'fast');
  const options = {
    skillGraph: context.skillGraph,
    catalog: context.catalog,
  };

  let reports: ValidationReport[];
  const skipped: string[] = [];
  if (id) {
    if (!context.catalog.has(id)) {
      console.error(style.red(`Unknown exercise "${id}".`));
      return 2;
    }
    const exercise = context.catalog.get(id);
    reports = [
      await validateExercise(exercise, {
        ...options,
        ...(fast ? {} : { runtime: context.runtimeFor(exercise.language) }),
      }),
    ];
  } else if (fast) {
    reports = await validateCatalog(context.catalog, options);
  } else {
    reports = [];
    // Which languages can actually run here, asked once rather than per
    // exercise: `doctor` compiles and runs a program, and doing that fifty
    // times to learn the same answer would make validation minutes slower.
    const usable = await usableLanguages(context);

    for (const exercise of context.catalog.all()) {
      if (!usable.has(exercise.language)) {
        skipped.push(exercise.language);
        continue;
      }
      reports.push(
        await validateExercise(exercise, {
          ...options,
          runtime: context.runtimeFor(exercise.language),
        }),
      );
    }
  }

  console.log(
    heading(`Validating ${pluralize(reports.length, 'exercise')}${fast ? ' (fast)' : ''}`),
  );

  if (skipped.length > 0) {
    // Not a failure. An exercise whose toolchain is not installed has not been
    // shown to be wrong, and failing the build here would mean nobody could
    // validate anything without installing all twelve. It is reported loudly
    // enough that a release build can insist on a machine that has them.
    const byLanguage = [...new Set(skipped)].sort();
    console.log(
      indent(
        style.yellow(
          `${pluralize(skipped.length, 'exercise')} skipped — no toolchain for ` +
            `${byLanguage.join(', ')}. Run \`code-retrainer runtime doctor\` for what to install.`,
        ),
      ),
    );
    console.log('');
  }

  const issues: ValidationIssue[] = [];
  for (const report of reports) {
    const badge = report.ok ? (report.issues.length > 0 ? symbol.warn : symbol.pass) : symbol.fail;
    console.log(`${badge} ${report.exerciseId}`);
    for (const issue of report.issues) {
      const mark = issue.severity === 'error' ? style.red('error') : style.yellow('warn');
      console.log(indent(`${mark} ${style.gray(issue.check)}  ${issue.message}`, 4));
      issues.push(issue);
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.length - errors;

  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log(style.green(`All ${pluralize(reports.length, 'exercise')} valid.`));
  } else {
    console.log(
      `${errors > 0 ? style.red(pluralize(errors, 'error')) : style.green('0 errors')}, ${
        warnings > 0 ? style.yellow(pluralize(warnings, 'warning')) : '0 warnings'
      }`,
    );
  }

  return errors > 0 || hasLoadFailures ? 1 : 0;
}

async function run(id: string | undefined, flags: Flags): Promise<number> {
  if (!id) {
    console.error(style.red('Usage: code-retrainer exercise run <id> [--solution]'));
    return 2;
  }

  const context = await createContext();
  if (!context.catalog.has(id)) {
    console.error(style.red(`Unknown exercise "${id}".`));
    return 2;
  }

  const exercise = context.catalog.get(id);
  const useSolution = flagBoolean(flags, 'solution');
  const workspace = useSolution ? solutionWorkspace(exercise) : attemptWorkspace(exercise);

  console.log(
    heading(`${exercise.title} ${style.gray(useSolution ? '(reference solution)' : '(starter)')}`),
  );

  const result = await context.runtimeFor(exercise.language).test({
    workspace,
    visibility: testVisibility(exercise),
    ...(exercise.timeoutMs ? { limits: { timeoutMs: exercise.timeoutMs } } : {}),
  });

  console.log(formatTestResult(result));
  return result.outcome === 'completed' && result.failed === 0 && result.errored === 0 ? 0 : 1;
}

function reportLoadFailures(failures: readonly { directory: string; message: string }[]): boolean {
  if (failures.length === 0) return false;
  console.error(heading(`${pluralize(failures.length, 'exercise')} failed to load`));
  for (const failure of failures) {
    console.error(`${symbol.fail} ${relativeToRepository(failure.directory)}`);
    console.error(indent(style.gray(failure.message), 4));
  }
  return true;
}

/**
 * Break the reference solution on purpose and see whether the tests notice.
 *
 * An exercise whose tests pass a wrong solution is worse than one with no
 * tests: it tells the learner they got it right, and every mastery number
 * derived from that attempt inherits the lie. Each surviving mutant below is a
 * hole a learner can sit in.
 *
 * Slow by nature — one test run per fault — so it is a separate command rather
 * than part of `validate`.
 */
async function mutate(id: string | undefined, flags: Flags): Promise<number> {
  const context = await createContext();
  const targets = id
    ? context.catalog.has(id)
      ? [context.catalog.get(id)]
      : []
    : context.catalog.all();

  if (targets.length === 0) {
    console.error(style.red(id ? `Unknown exercise "${id}".` : 'No exercises found.'));
    return 2;
  }

  const limit = Number(flagString(flags, 'limit') ?? '25');
  let holes = 0;

  for (const exercise of targets) {
    const solution = solutionWorkspace(exercise);
    const runtime = context.runtimeFor(exercise.language);

    // Only the solution is mutated. Breaking a test and watching it fail
    // proves nothing: the question is whether the tests notice a broken
    // *solution*, so they have to stay exactly as the learner will meet them.
    const mutable = solution.files.filter((file) =>
      exercise.solution.files.some((candidate) => candidate.path === file.path),
    );

    console.log(heading(exercise.title));

    const report = await runMutationTesting(mutable, {
      operators: operatorsFor(exercise.language),
      limitPerFile: Number.isFinite(limit) ? limit : 25,
      onProgress: (done, total) => {
        if (process.stdout.isTTY) process.stdout.write(`\r  ${done}/${total} faults tried`);
      },
      test: async (mutated) => {
        const result = await runtime.test({
          workspace: {
            ...solution,
            files: solution.files.map(
              (file) => mutated.find((candidate) => candidate.path === file.path) ?? file,
            ),
          },
          visibility: testVisibility(exercise),
          ...(exercise.timeoutMs ? { limits: { timeoutMs: exercise.timeoutMs } } : {}),
        });
        return {
          green: result.outcome === 'completed' && result.failed === 0 && result.errored === 0,
        };
      },
    });

    if (process.stdout.isTTY) process.stdout.write('\r');

    console.log(
      indent(
        columns([
          ['faults introduced', String(report.total)],
          ['caught', String(report.killed)],
          ['score', `${Math.round(report.score * 100)}%`],
        ]),
      ),
    );

    const excused = exercise.mutationExceptions ?? [];
    const surviving = report.survivors.filter(
      (survivor) =>
        !excused.some(
          (exception) =>
            exception.path === survivor.path &&
            exception.operator === survivor.operator &&
            (exception.line === undefined || exception.line === survivor.line),
        ),
    );

    for (const exception of excused) {
      console.log(
        indent(
          style.gray(
            `${symbol.skip} ${exception.path}${
              exception.line === undefined ? '' : `:${exception.line}`
            } — ${exception.operator} excused: ${exception.why}`,
          ),
        ),
      );
    }

    for (const survivor of surviving) {
      holes += 1;
      console.log(
        indent(
          `${symbol.fail} ${survivor.path}:${survivor.line} — ${survivor.description} ` +
            style.gray(`(${survivor.operator})`),
        ),
      );
    }

    if (surviving.length > 0) {
      console.log(
        indent(
          style.gray('Each line above is a change the tests accepted. Add a case that would fail.'),
        ),
      );
    }
  }

  return holes === 0 ? 0 : 1;
}

/**
 * Which faults to introduce, by language.
 *
 * The one place the mutation gate names a language. The operators themselves
 * live with the language they mutate, because "the mistakes people make" is a
 * fact about a language and not about testing.
 */
function operatorsFor(language: string) {
  switch (language) {
    case 'python':
      return pythonMutationOperators;
    case 'javascript':
      return javascriptMutationOperators;
    default:
      return [];
  }
}

/**
 * Which languages can actually build and run on this machine.
 *
 * Asked once. `doctor` compiles and runs a trivial program for every
 * toolchain-backed language, which is the only check that distinguishes "the
 * compiler is on PATH" from "code can be executed here" — and it is far too
 * expensive to repeat per exercise.
 *
 * A language that cannot run is not a failure. It means the person validating
 * does not have Go installed, which is true of most people, and refusing to
 * validate anything until they do would make the command useless.
 */
async function usableLanguages(context: CliContext): Promise<ReadonlySet<string>> {
  const ready = new Set<string>();

  await Promise.all(
    context.registry.languages().map(async (language) => {
      try {
        const diagnosis = await context.runtimeFor(language.id).doctor();
        if (diagnosis.ready) ready.add(language.id);
      } catch {
        // A doctor that throws is a broken runtime, not an unusable one, but
        // either way its exercises cannot be validated here.
      }
    }),
  );

  return ready;
}
