// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TrainingMode } from '@code-wizard/core';

/**
 * Everything the learning engine knows about one sitting with one exercise.
 *
 * An attempt is an append-only event log rather than a mutable summary. The
 * summary can then be recomputed when the metrics change, and — the part that
 * matters for §33 — the record of *how* an exercise was solved survives, so
 * training data can never be silently reinterpreted as assessment data.
 */
export type AttemptOutcome = 'in-progress' | 'solved' | 'abandoned';

export type HintLevel = 'conceptual' | 'structural' | 'language' | 'syntax' | 'explicit';

export type AttemptEvent =
  /** The learner ran their program (not the tests). */
  | { readonly type: 'run'; readonly at: string; readonly failed: boolean }
  /** The learner ran the tests. */
  | {
      readonly type: 'test';
      readonly at: string;
      readonly passed: number;
      readonly failed: number;
      readonly errored: number;
      /** True when every test passed. */
      readonly green: boolean;
    }
  | { readonly type: 'hint'; readonly at: string; readonly level: HintLevel }
  /**
   * The learner recorded an execution trace.
   *
   * Kept in the log because it says something real about how they work, but
   * it is not assistance: reaching for an instrument is the behavior the
   * product wants, so metrics do not discount it.
   */
  | { readonly type: 'trace'; readonly at: string }
  /**
   * A claim about what the machine will do, made before it does it.
   *
   * The only event recorded *before* the thing it describes. Committing to an
   * answer first is what turns running the code into a test of the learner's
   * model rather than a lookup — and it is the only evidence the system ever
   * gets that they understand what they wrote, as opposed to that it works.
   */
  | {
      readonly type: 'prediction';
      readonly at: string;
      /** Whether the claim was about the program's output or the tests' verdict. */
      readonly about: 'output' | 'tests';
      /** Kept so an attempt can be replayed with the wrong answer visible. */
      readonly predicted: string;
      readonly correct: boolean;
    }
  | { readonly type: 'documentation'; readonly at: string; readonly query: string }
  /** The learner gave up and read the reference solution. */
  | { readonly type: 'solution-revealed'; readonly at: string }
  | { readonly type: 'paused'; readonly at: string }
  | { readonly type: 'resumed'; readonly at: string };

export interface Attempt {
  readonly id: string;
  readonly exerciseId: string;
  /**
   * The exercise version this attempt was made against (spec §37). Without it,
   * editing an exercise would silently rewrite the learner's history.
   */
  readonly exerciseVersion: number;
  readonly mode: TrainingMode;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly outcome: AttemptOutcome;
  readonly events: readonly AttemptEvent[];
  /** The learner's final source, kept so history is inspectable. */
  readonly finalFiles?: Readonly<Record<string, string>>;
}

export interface StartAttemptInput {
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseVersion: number;
  readonly mode: TrainingMode;
  readonly startedAt: string;
}

export function startAttempt(input: StartAttemptInput): Attempt {
  return {
    ...input,
    finishedAt: null,
    outcome: 'in-progress',
    events: [],
  };
}

export class AttemptClosedError extends Error {
  constructor(attemptId: string) {
    super(`Attempt ${attemptId} has already finished and cannot be modified.`);
    this.name = 'AttemptClosedError';
  }
}

/**
 * Append an event. A finished attempt is immutable: late events would change
 * metrics that have already been used to update mastery.
 */
export function recordEvent(attempt: Attempt, event: AttemptEvent): Attempt {
  if (attempt.outcome !== 'in-progress') throw new AttemptClosedError(attempt.id);

  const next = { ...attempt, events: [...attempt.events, event] };

  // Passing the tests ends the attempt: everything after it is review, not
  // problem-solving, and counting it would inflate the completion time.
  if (event.type === 'test' && event.green) {
    return { ...next, outcome: 'solved', finishedAt: event.at };
  }
  return next;
}

export function abandonAttempt(attempt: Attempt, at: string): Attempt {
  if (attempt.outcome !== 'in-progress') return attempt;
  return { ...attempt, outcome: 'abandoned', finishedAt: at };
}

export function attachFinalFiles(
  attempt: Attempt,
  files: Readonly<Record<string, string>>,
): Attempt {
  return { ...attempt, finalFiles: files };
}

export function isFinished(attempt: Attempt): boolean {
  return attempt.outcome !== 'in-progress';
}
