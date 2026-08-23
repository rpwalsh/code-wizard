// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TestVisibility, Workspace } from '@code-retrainer/core';

/** Exercise taxonomy from spec §7. Drives UI affordances and time budgets. */
export type ExerciseKind =
  | 'syntax-drill'
  | 'completion'
  | 'translation'
  | 'bug-fix'
  | 'micro-problem'
  | 'focused-problem'
  | 'stateful-problem'
  | 'progressive-stage'
  | 'project';

/**
 * Hint levels are ordered from least to most explicit (spec §10). The learner
 * reveals them one at a time and every reveal is recorded.
 */
export const hintLevels = ['conceptual', 'structural', 'language', 'syntax', 'explicit'] as const;
export type HintLevel = (typeof hintLevels)[number];

export interface Hint {
  readonly level: HintLevel;
  readonly text: string;
}

export interface ExerciseTestFile {
  /** Workspace-relative path the file is materialized at. */
  readonly path: string;
  readonly visibility: TestVisibility;
  /** Skill this file's assertions probe; surfaced on failure as "relevant concept". */
  readonly concept?: string;
  readonly contents: string;
}

export interface ExerciseSource {
  /** Absolute path of the directory the exercise was loaded from. */
  readonly directory: string;
}

export interface Exercise {
  /** Stable, namespaced identifier, e.g. `python.collections.dict-lookup`. */
  readonly id: string;
  /** Bumped whenever tests change materially (spec §37). */
  readonly version: number;
  readonly language: string;
  readonly title: string;
  readonly kind: ExerciseKind;
  /** 1 (trivial recall) to 5 (multi-concept system design). */
  readonly difficulty: number;
  readonly estimatedSeconds: number;
  readonly skills: readonly string[];
  readonly prerequisites: readonly string[];
  readonly learningObjectives: readonly string[];
  /** Markdown shown in the prompt panel. */
  readonly prompt: string;
  readonly starter: Workspace;
  /** Reference implementation; must pass every test during validation. */
  readonly solution: Workspace;
  readonly tests: readonly ExerciseTestFile[];
  readonly hints: readonly Hint[];
  /** Shown after completion. Explains *why*, not just *what*. */
  readonly explanation?: string;
  readonly timeoutMs?: number;
  /**
   * Mutants the tests are not expected to catch, each with a stated reason.
   *
   * Some faults are genuinely undetectable because they do not change
   * behavior: `parts[-1]` and `parts[+1]` are the same value whenever there
   * are two parts. Equivalent mutants are inherent to the technique, and
   * without somewhere to record them the score can never reach 100%, the gate
   * stays permanently red, and people stop reading it — which costs more than
   * the mutant ever could.
   *
   * A reason is required. A suppression nobody had to justify is a suppression
   * nobody will revisit.
   */
  readonly mutationExceptions?: readonly MutationException[];
  /** Progressive systems: the exercise this stage builds on (spec §7.8). */
  readonly continues?: string;
  readonly source: ExerciseSource;
}

export interface MutationException {
  /** Workspace-relative path of the solution file. */
  readonly path: string;
  /** The operator whose mutant is expected to survive. */
  readonly operator: string;
  /**
   * The line it sits on, when only one line is genuinely unkillable.
   *
   * Without this an exception covers every mutant that operator makes in the
   * file, so excusing one equivalent comparison would also excuse a real gap
   * in three other functions — and the gate would go quiet exactly where it
   * was still needed.
   */
  readonly line?: number;
  /** Why no test can kill it. Not optional. */
  readonly why: string;
}

/**
 * How much slack a learner gets over the fluent-completion estimate.
 *
 * `estimatedSeconds` is how long someone who already has the skill takes.
 * Someone rebuilding it takes longer, and the harder the exercise the wider
 * that spread gets — an extra minute on a 60-second drill is a different
 * proportion of trouble from an extra minute on a twenty-minute problem. So
 * the allowance grows with difficulty rather than being a flat percentage.
 */
const DIFFICULTY_SLACK: Readonly<Record<number, number>> = Object.freeze({
  1: 1.5,
  2: 1.6,
  3: 1.75,
  4: 2,
  5: 2.25,
});

/**
 * The time this exercise is worth, in seconds.
 *
 * Used only for the optional on-screen timer. It deliberately does not feed
 * grading: `speed` is already scored against the bare estimate, and having the
 * clock a learner can see also be the clock that judges them would turn a
 * quiet instrument into a stopwatch. Going over costs nothing.
 */
export function timeBudgetSeconds(
  exercise: Pick<Exercise, 'difficulty' | 'estimatedSeconds'>,
): number {
  const slack = DIFFICULTY_SLACK[exercise.difficulty] ?? 2;
  return Math.round(exercise.estimatedSeconds * slack);
}

/** The files the learner starts from, plus the test files they run against. */
export function attemptWorkspace(exercise: Exercise): Workspace {
  return mergeWorkspace(exercise.starter, exercise.tests);
}

/** The reference solution, plus tests. Used by validation and by `code-retrainer exercise verify`. */
export function solutionWorkspace(exercise: Exercise): Workspace {
  return mergeWorkspace(exercise.solution, exercise.tests);
}

function mergeWorkspace(base: Workspace, tests: readonly ExerciseTestFile[]): Workspace {
  return {
    ...base,
    files: [
      ...base.files,
      ...tests.map((test) => ({
        path: test.path,
        contents: test.contents,
        readOnly: true,
        hidden: test.visibility === 'hidden',
      })),
    ],
  };
}

/** Visibility per test path, as the runtime needs it to redact hidden results. */
export function testVisibility(exercise: Exercise): Record<string, TestVisibility> {
  return Object.fromEntries(exercise.tests.map((test) => [test.path, test.visibility]));
}

/** Hints in reveal order. Authoring order is not trusted. */
export function orderedHints(exercise: Exercise): Hint[] {
  return [...exercise.hints].sort(
    (a, b) => hintLevels.indexOf(a.level) - hintLevels.indexOf(b.level),
  );
}
