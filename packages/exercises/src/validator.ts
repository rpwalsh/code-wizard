import type { LanguageRuntime, SkillGraph, TestResult } from '@forge/core';
import { isGreen } from '@forge/core';

import type { ExerciseCatalog } from './catalog.ts';
import type { Exercise } from './model.ts';
import { attemptWorkspace, orderedHints, solutionWorkspace } from './model.ts';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly exerciseId: string;
  readonly check: string;
  readonly message: string;
}

export interface ValidationOptions {
  /** When provided, skill ids on exercises are checked against the graph. */
  readonly skillGraph?: SkillGraph;
  /** When provided, cross-exercise references (`continues`) are checked. */
  readonly catalog?: ExerciseCatalog;
  /**
   * Execute the reference solution and the starter against the real tests.
   * Slow but decisive: it is the only check that proves an exercise works.
   */
  readonly runtime?: LanguageRuntime;
  /** Fraction of the timeout the reference solution must finish within. */
  readonly timeoutHeadroom?: number;
}

export interface ValidationReport {
  readonly exerciseId: string;
  readonly issues: readonly ValidationIssue[];
  readonly ok: boolean;
}

/**
 * A broken exercise is worse than no exercise (spec §38), so validation is
 * exhaustive rather than fail-fast: authors see every problem at once.
 */
export async function validateExercise(
  exercise: Exercise,
  options: ValidationOptions = {},
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];
  const add = (severity: ValidationSeverity, check: string, message: string): void => {
    issues.push({ severity, exerciseId: exercise.id, check, message });
  };

  validateStructure(exercise, add);
  validateSkills(exercise, options.skillGraph, add);
  validateReferences(exercise, options.catalog, add);

  if (options.runtime) {
    await validateBehaviour(exercise, options.runtime, options.timeoutHeadroom ?? 0.5, add);
  }

  return {
    exerciseId: exercise.id,
    issues,
    ok: !issues.some((issue) => issue.severity === 'error'),
  };
}

export async function validateCatalog(
  catalog: ExerciseCatalog,
  options: ValidationOptions = {},
): Promise<ValidationReport[]> {
  const reports: ValidationReport[] = [];
  for (const exercise of catalog.all()) {
    reports.push(await validateExercise(exercise, { ...options, catalog }));
  }
  return reports;
}

type AddIssue = (severity: ValidationSeverity, check: string, message: string) => void;

function validateStructure(exercise: Exercise, add: AddIssue): void {
  const starterPaths = new Set(exercise.starter.files.map((file) => file.path));
  const solutionPaths = new Set(exercise.solution.files.map((file) => file.path));

  for (const filePath of starterPaths) {
    if (!solutionPaths.has(filePath)) {
      add(
        'error',
        'solution-shape',
        'starter file "' +
          filePath +
          '" has no counterpart in the solution; the learner would be solving a different problem',
      );
    }
  }

  for (const test of exercise.tests) {
    if (starterPaths.has(test.path)) {
      add('error', 'test-collision', 'test file "' + test.path + '" collides with a starter file');
    }
  }

  if (!exercise.tests.some((test) => test.visibility === 'visible')) {
    add(
      'error',
      'visible-tests',
      'at least one visible test is required — a learner cannot practise against an opaque oracle',
    );
  }

  if (
    exercise.difficulty >= 3 &&
    !exercise.tests.some((test) => test.visibility === 'hidden' || test.visibility === 'edge')
  ) {
    add(
      'warning',
      'hardcode-guard',
      'difficulty >= 3 with no hidden or edge tests: the exercise can be passed by hardcoding',
    );
  }

  const levels = orderedHints(exercise).map((hint) => hint.level);
  if (levels.length > 0 && levels.at(-1) !== 'explicit') {
    add(
      'warning',
      'hint-ladder',
      'hint ladder does not end at an "explicit" hint; a stuck learner has no exit',
    );
  }

  if (exercise.kind === 'syntax-drill' && exercise.estimatedSeconds > 120) {
    add(
      'warning',
      'duration-metadata',
      'syntax drills should take under two minutes, not ' + exercise.estimatedSeconds + 's',
    );
  }

  if (exercise.kind === 'progressive-stage' && !exercise.continues) {
    add('warning', 'progression', 'progressive-stage exercise does not declare what it continues');
  }
}

function validateSkills(exercise: Exercise, graph: SkillGraph | undefined, add: AddIssue): void {
  if (!graph) return;

  for (const skill of exercise.skills) {
    if (!graph.has(skill)) add('error', 'skill-exists', 'unknown skill "' + skill + '"');
  }
  for (const prerequisite of exercise.prerequisites) {
    if (!graph.has(prerequisite)) {
      add('error', 'skill-exists', 'unknown prerequisite skill "' + prerequisite + '"');
    }
  }

  // An exercise that trains X while also demanding X as a prerequisite can
  // never be recommended: the learner must already have the skill to unlock it.
  for (const skill of exercise.skills) {
    if (exercise.prerequisites.includes(skill)) {
      add(
        'error',
        'skill-cycle',
        'skill "' + skill + '" is both trained and required by this exercise',
      );
    }
  }
}

function validateReferences(
  exercise: Exercise,
  catalog: ExerciseCatalog | undefined,
  add: AddIssue,
): void {
  if (!catalog || !exercise.continues) return;
  if (!catalog.has(exercise.continues)) {
    add('error', 'continues', 'continues unknown exercise "' + exercise.continues + '"');
  }
}

async function validateBehaviour(
  exercise: Exercise,
  runtime: LanguageRuntime,
  headroom: number,
  add: AddIssue,
): Promise<void> {
  const runtimeId = runtime.metadata().id;
  if (runtimeId !== exercise.language) {
    add(
      'error',
      'runtime-language',
      'runtime "' + runtimeId + '" cannot validate a "' + exercise.language + '" exercise',
    );
    return;
  }

  const limits = exercise.timeoutMs ? { timeoutMs: exercise.timeoutMs } : undefined;

  const solutionRun = await runtime.test({
    workspace: solutionWorkspace(exercise),
    ...(limits ? { limits } : {}),
  });

  if (!isGreen(solutionRun)) {
    add(
      'error',
      'solution-passes',
      'reference solution does not pass its own tests (' + describe(solutionRun) + ')',
    );
  }

  if (exercise.timeoutMs && solutionRun.durationMs > exercise.timeoutMs * headroom) {
    add(
      'warning',
      'timeout-headroom',
      'reference solution took ' +
        solutionRun.durationMs +
        'ms of a ' +
        exercise.timeoutMs +
        'ms budget; a slower machine will time out',
    );
  }

  const starterRun = await runtime.test({
    workspace: attemptWorkspace(exercise),
    ...(limits ? { limits } : {}),
  });

  if (isGreen(starterRun)) {
    add(
      'error',
      'starter-fails',
      'the starter code already passes every test, so the exercise asks the learner to do nothing',
    );
  }

  // Tests declared in the manifest but never collected mean a rename or a typo:
  // the learner would be graded against fewer tests than the author intended.
  const executedFiles = new Set(
    solutionRun.cases.map((testCase) => testCase.id.split('::')[0]).filter(Boolean),
  );
  for (const test of exercise.tests) {
    if (!executedFiles.has(test.path)) {
      add('error', 'tests-collected', 'test file "' + test.path + '" produced no test cases');
    }
  }
}

function describe(result: TestResult): string {
  if (result.outcome !== 'completed') return 'outcome: ' + result.outcome;
  const failing = result.cases
    .filter((testCase) => testCase.status === 'failed' || testCase.status === 'errored')
    .map((testCase) => testCase.name)
    .slice(0, 5);
  const counts = result.failed + ' failed, ' + result.errored + ' errored';
  return failing.length > 0 ? counts + ': ' + failing.join(', ') : counts;
}
