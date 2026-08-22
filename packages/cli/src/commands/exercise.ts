import type { ValidationIssue, ValidationReport } from '@forge/exercises';
import {
  attemptWorkspace,
  orderedHints,
  solutionWorkspace,
  testVisibility,
  validateCatalog,
  validateExercise,
} from '@forge/exercises';

import { createContext, relativeToRepository } from '../context.ts';
import { formatTestResult } from '../format-results.ts';
import { columns, heading, indent, pluralise, style, symbol } from '../terminal.ts';
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
    default:
      console.error(style.red(`Unknown exercise command "${subcommand ?? ''}".`));
      console.error('Try: forge exercise list | show <id> | validate | run <id>');
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
    console.log(style.grey('No exercises found.'));
    return context.loadFailures.length > 0 ? 1 : 0;
  }

  console.log(heading(`Exercises (${exercises.length})`));
  console.log(
    columns(
      exercises.map((exercise) => [
        exercise.id,
        `${style.grey(`d${exercise.difficulty}`)} ${exercise.title} ${style.grey(
          `· ${exercise.kind} · ${Math.round(exercise.estimatedSeconds / 60)}m`,
        )}`,
      ]),
    ),
  );
  return context.loadFailures.length > 0 ? 1 : 0;
}

async function show(id: string | undefined): Promise<number> {
  if (!id) {
    console.error(style.red('Usage: forge exercise show <id>'));
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
      ['prerequisites', exercise.prerequisites.join(', ') || style.grey('none')],
      ['source', relativeToRepository(exercise.source.directory)],
    ]),
  );

  console.log(heading('Prompt'));
  console.log(indent(exercise.prompt));

  console.log(heading('Starter files'));
  for (const file of exercise.starter.files) console.log(`  ${file.path}`);

  console.log(heading('Tests'));
  console.log(
    columns(
      exercise.tests.map((test) => [`  ${test.path}`, style.grey(test.visibility)]),
    ),
  );

  const hints = orderedHints(exercise);
  if (hints.length > 0) {
    console.log(heading(`Hints (${hints.length})`));
    for (const [index, hint] of hints.entries()) {
      console.log(`  ${index + 1}. ${style.grey(`[${hint.level}]`)} ${hint.text}`);
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
    for (const exercise of context.catalog.all()) {
      reports.push(
        await validateExercise(exercise, {
          ...options,
          runtime: context.runtimeFor(exercise.language),
        }),
      );
    }
  }

  console.log(heading(`Validating ${pluralise(reports.length, 'exercise')}${fast ? ' (fast)' : ''}`));

  const issues: ValidationIssue[] = [];
  for (const report of reports) {
    const badge = report.ok
      ? report.issues.length > 0
        ? symbol.warn
        : symbol.pass
      : symbol.fail;
    console.log(`${badge} ${report.exerciseId}`);
    for (const issue of report.issues) {
      const mark = issue.severity === 'error' ? style.red('error') : style.yellow('warn');
      console.log(indent(`${mark} ${style.grey(issue.check)}  ${issue.message}`, 4));
      issues.push(issue);
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.length - errors;

  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log(style.green(`All ${pluralise(reports.length, 'exercise')} valid.`));
  } else {
    console.log(
      `${errors > 0 ? style.red(pluralise(errors, 'error')) : style.green('0 errors')}, ${
        warnings > 0 ? style.yellow(pluralise(warnings, 'warning')) : '0 warnings'
      }`,
    );
  }

  return errors > 0 || hasLoadFailures ? 1 : 0;
}

async function run(id: string | undefined, flags: Flags): Promise<number> {
  if (!id) {
    console.error(style.red('Usage: forge exercise run <id> [--solution]'));
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
    heading(`${exercise.title} ${style.grey(useSolution ? '(reference solution)' : '(starter)')}`),
  );

  const result = await context.runtimeFor(exercise.language).test({
    workspace,
    visibility: testVisibility(exercise),
    ...(exercise.timeoutMs ? { limits: { timeoutMs: exercise.timeoutMs } } : {}),
  });

  console.log(formatTestResult(result));
  return result.outcome === 'completed' && result.failed === 0 && result.errored === 0 ? 0 : 1;
}

function reportLoadFailures(
  failures: readonly { directory: string; message: string }[],
): boolean {
  if (failures.length === 0) return false;
  console.error(heading(`${pluralise(failures.length, 'exercise')} failed to load`));
  for (const failure of failures) {
    console.error(`${symbol.fail} ${relativeToRepository(failure.directory)}`);
    console.error(indent(style.grey(failure.message), 4));
  }
  return true;
}
