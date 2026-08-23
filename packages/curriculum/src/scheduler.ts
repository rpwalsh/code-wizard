// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MasteryObservation } from '@code-retrainer/learning';

/**
 * Spaced repetition state for one skill (spec §21).
 *
 * Kept separate from mastery on purpose: mastery says how well you can do
 * something, this says when you should be asked to do it again. A learner can
 * have high mastery and still be due.
 */
export interface ReviewState {
  readonly skillId: string;
  readonly lastReviewedAt: string;
  readonly dueAt: string;
  /** Current gap between reviews, in days. */
  readonly intervalDays: number;
  /** Consecutive successful reviews. Resets to zero on a lapse. */
  readonly streak: number;
  /** Times the skill was forgotten after having been learned. */
  readonly lapses: number;
}

/**
 * The ladder from §21: Day 0 learn, then recall at 1, 3, 7, 14, 30 days, and
 * a verification pass beyond that. Explicit rather than computed, because a
 * learner should be able to see the schedule they are on.
 */
export const REVIEW_LADDER: readonly number[] = [1, 3, 7, 14, 30, 60, 120];

export interface ScheduleOptions {
  /** Recall evidence at or above this counts as a successful review. */
  readonly passThreshold?: number;
  /**
   * A struggle that still succeeded holds the interval rather than advancing
   * it — the learner is not ready for a longer gap.
   */
  readonly holdThreshold?: number;
  readonly maximumIntervalDays?: number;
}

const DEFAULTS: Required<ScheduleOptions> = {
  passThreshold: 0.7,
  holdThreshold: 0.4,
  maximumIntervalDays: 180,
};

export interface ScheduleDecision {
  readonly state: ReviewState;
  /** Why the interval moved the way it did, for display. */
  readonly reason: string;
}

/** First scheduling for a skill that has just been learned. */
export function beginReview(skillId: string, at: string): ReviewState {
  const intervalDays = REVIEW_LADDER[0] ?? 1;
  return {
    skillId,
    lastReviewedAt: at,
    dueAt: addDays(at, intervalDays),
    intervalDays,
    streak: 0,
    lapses: 0,
  };
}

/**
 * Advance, hold or reset the interval based on how the review actually went.
 *
 * Three outcomes rather than the usual two: a review the learner scraped
 * through is not a failure, but rewarding it with a longer gap would set them
 * up to forget.
 */
export function scheduleNext(
  current: ReviewState | null,
  skillId: string,
  observation: MasteryObservation,
  options: ScheduleOptions = {},
): ScheduleDecision {
  const settings = { ...DEFAULTS, ...options };
  const recall = observation.evidence.recall ?? 0;
  const at = observation.at;

  if (current === null) {
    return {
      state: beginReview(skillId, at),
      reason: `First review scheduled for tomorrow.`,
    };
  }

  if (recall < settings.holdThreshold) {
    // A lapse sends the skill back to the start of the ladder. Partially
    // forgotten is functionally the same as not known when you need it.
    const intervalDays = REVIEW_LADDER[0] ?? 1;
    return {
      state: {
        skillId,
        lastReviewedAt: at,
        dueAt: addDays(at, intervalDays),
        intervalDays,
        streak: 0,
        lapses: current.lapses + 1,
      },
      reason: 'Recall failed, so the interval resets to one day.',
    };
  }

  if (recall < settings.passThreshold) {
    return {
      state: {
        ...current,
        lastReviewedAt: at,
        dueAt: addDays(at, current.intervalDays),
        streak: current.streak,
      },
      reason: `Recall was shaky, so the interval holds at ${current.intervalDays} days.`,
    };
  }

  const streak = current.streak + 1;
  const nextInterval = Math.min(
    REVIEW_LADDER[Math.min(streak, REVIEW_LADDER.length - 1)] ?? current.intervalDays,
    settings.maximumIntervalDays,
  );

  return {
    state: {
      skillId,
      lastReviewedAt: at,
      dueAt: addDays(at, nextInterval),
      intervalDays: nextInterval,
      streak,
      lapses: current.lapses,
    },
    reason: `Recalled cleanly, so the interval grows to ${nextInterval} days.`,
  };
}

export function isDue(state: ReviewState, now: Date): boolean {
  return Date.parse(state.dueAt) <= now.getTime();
}

/** How overdue a review is, in days. Negative when it is not yet due. */
export function overdueDays(state: ReviewState, now: Date): number {
  return (now.getTime() - Date.parse(state.dueAt)) / 86_400_000;
}

/** Skills due for review, most overdue first. */
export function dueForReview(states: readonly ReviewState[], now: Date): readonly ReviewState[] {
  return states
    .filter((state) => isDue(state, now))
    .slice()
    .sort((a, b) => overdueDays(b, now) - overdueDays(a, now));
}

function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(isoDate) + days * 86_400_000).toISOString();
}
