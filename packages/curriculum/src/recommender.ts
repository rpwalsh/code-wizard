import type { SkillGraph, SkillMastery } from '@forge/core';
import { headlineMastery, readiness } from '@forge/core';
import type { Exercise } from '@forge/exercises';

import type { ReviewState } from './scheduler.ts';
import { isDue, overdueDays } from './scheduler.ts';

/** One weighted reason a recommendation scored the way it did. */
export interface ScoreFactor {
  readonly label: string;
  readonly delta: number;
}

export interface Recommendation {
  readonly exercise: Exercise;
  readonly score: number;
  readonly factors: readonly ScoreFactor[];
  /** One sentence a learner can act on (spec §17). */
  readonly reason: string;
}

export interface BlockedExercise {
  readonly exercise: Exercise;
  /** Prerequisite skills that are not yet strong enough. */
  readonly missing: readonly string[];
}

export interface LearnerState {
  readonly mastery: ReadonlyMap<string, SkillMastery>;
  readonly reviews: ReadonlyMap<string, ReviewState>;
  /** Attempt counts and last-attempt times, keyed by exercise id. */
  readonly attempts: ReadonlyMap<string, ExerciseHistory>;
  readonly now: Date;
}

export interface ExerciseHistory {
  readonly attempts: number;
  readonly solvedAttempts: number;
  readonly lastAttemptAt: string | null;
  /** True when the most recent solved attempt used no assistance. */
  readonly lastWasIndependent: boolean;
  /** Consecutive recent failures, which is what makes something urgent. */
  readonly recentFailures: number;
}

export interface RecommendOptions {
  /**
   * Readiness a prerequisite must reach before an exercise unlocks — not
   * mastery. Gating on mastery would refuse to teach a skill until it had
   * already been learned; readiness only asks whether the idea is understood
   * well enough to engage with an exercise that builds on it.
   */
  readonly unlockThreshold?: number;
  /** A skill below this is considered weak and gets priority. */
  readonly weaknessThreshold?: number;
  /** An exercise attempted within this window is deprioritised. */
  readonly cooldownHours?: number;
  readonly limit?: number;
}

/** The scoring knobs, with `limit` excluded: it shapes output, not scores. */
type ScoringSettings = Required<Omit<RecommendOptions, 'limit'>>;

const DEFAULTS: ScoringSettings = {
  unlockThreshold: 0.35,
  weaknessThreshold: 0.7,
  cooldownHours: 6,
};

export const emptyHistory: ExerciseHistory = Object.freeze({
  attempts: 0,
  solvedAttempts: 0,
  lastAttemptAt: null,
  lastWasIndependent: false,
  recentFailures: 0,
});

export interface RecommendationResult {
  readonly recommendations: readonly Recommendation[];
  /** Exercises held back, and what is holding them. Shown, not hidden. */
  readonly blocked: readonly BlockedExercise[];
}

/**
 * Decide what to practise next.
 *
 * Every input contributes a named, signed factor and the factors are summed —
 * no weights buried in a model, no randomness. A learner who asks "why this
 * one?" gets the actual arithmetic (spec §17, §47).
 */
export function recommend(
  candidates: readonly Exercise[],
  graph: SkillGraph,
  state: LearnerState,
  options: RecommendOptions = {},
): RecommendationResult {
  const settings = { ...DEFAULTS, ...options };
  const recommendations: Recommendation[] = [];
  const blocked: BlockedExercise[] = [];

  for (const exercise of candidates) {
    const missing = unmetPrerequisites(exercise, graph, state, settings.unlockThreshold);
    if (missing.length > 0) {
      blocked.push({ exercise, missing });
      continue;
    }
    recommendations.push(scoreExercise(exercise, state, settings));
  }

  recommendations.sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id));

  return {
    recommendations:
      options.limit === undefined ? recommendations : recommendations.slice(0, options.limit),
    blocked,
  };
}

function unmetPrerequisites(
  exercise: Exercise,
  graph: SkillGraph,
  state: LearnerState,
  threshold: number,
): string[] {
  return exercise.prerequisites.filter((skillId) => {
    // A prerequisite that is not in the graph is a content bug, not a lock.
    if (!graph.has(skillId)) return false;
    const mastery = state.mastery.get(skillId);
    if (!mastery) return true;
    return readiness(mastery.vector) < threshold;
  });
}

function scoreExercise(
  exercise: Exercise,
  state: LearnerState,
  settings: ScoringSettings,
): Recommendation {
  const factors: ScoreFactor[] = [];
  const history = state.attempts.get(exercise.id) ?? emptyHistory;

  // -- spaced repetition: the strongest single signal ----------------------
  let mostOverdue = 0;
  let dueSkill: string | null = null;
  for (const skillId of exercise.skills) {
    const review = state.reviews.get(skillId);
    if (!review || !isDue(review, state.now)) continue;
    const overdue = overdueDays(review, state.now);
    if (overdue >= mostOverdue) {
      mostOverdue = overdue;
      dueSkill = skillId;
    }
  }
  if (dueSkill) {
    // Capped so a skill left for a year cannot crowd out everything else.
    factors.push({
      label: `${dueSkill} is due for review`,
      delta: 40 + Math.min(mostOverdue, 14) * 2,
    });
  }

  // -- weakness ------------------------------------------------------------
  const weakest = weakestTrainedSkill(exercise, state);
  if (weakest && weakest.value < settings.weaknessThreshold) {
    factors.push({
      label: `${weakest.skillId} is at ${percent(weakest.value)} mastery`,
      delta: Math.round((settings.weaknessThreshold - weakest.value) * 60),
    });
  }

  // -- recent failure ------------------------------------------------------
  if (history.recentFailures > 0) {
    factors.push({
      label: `failed ${history.recentFailures} recent attempt${history.recentFailures === 1 ? '' : 's'}`,
      delta: Math.min(history.recentFailures, 3) * 15,
    });
  }

  // -- never seen ----------------------------------------------------------
  if (history.attempts === 0) {
    factors.push({ label: 'not attempted yet', delta: 20 });
  }

  // -- already automatic ---------------------------------------------------
  if (history.solvedAttempts > 0 && history.lastWasIndependent && !dueSkill) {
    factors.push({
      label: 'already solved independently and not yet due',
      delta: -35 - Math.min(history.solvedAttempts, 5) * 5,
    });
  }

  // -- cooldown ------------------------------------------------------------
  if (history.lastAttemptAt) {
    const hoursSince = (state.now.getTime() - Date.parse(history.lastAttemptAt)) / 3_600_000;
    if (hoursSince < settings.cooldownHours) {
      factors.push({
        label: `attempted ${Math.round(hoursSince)}h ago`,
        delta: -30,
      });
    }
  }

  // -- difficulty fit ------------------------------------------------------
  // Prefer exercises just above the learner's current level on these skills:
  // far below is busywork, far above is a wall.
  const level = averageTrainedMastery(exercise, state);
  const target = 1 + level * 4;
  const distance = Math.abs(exercise.difficulty - target);
  factors.push({
    label: `difficulty ${exercise.difficulty} against a level of ${target.toFixed(1)}`,
    delta: Math.round(-distance * 6),
  });

  const score = factors.reduce((total, factor) => total + factor.delta, 0);
  return { exercise, score: Math.round(score), factors, reason: explain(exercise, factors) };
}

function weakestTrainedSkill(
  exercise: Exercise,
  state: LearnerState,
): { skillId: string; value: number } | null {
  let weakest: { skillId: string; value: number } | null = null;
  for (const skillId of exercise.skills) {
    const mastery = state.mastery.get(skillId);
    const value = mastery ? headlineMastery(mastery.vector) : 0;
    if (!weakest || value < weakest.value) weakest = { skillId, value };
  }
  return weakest;
}

function averageTrainedMastery(exercise: Exercise, state: LearnerState): number {
  if (exercise.skills.length === 0) return 0;
  let total = 0;
  for (const skillId of exercise.skills) {
    const mastery = state.mastery.get(skillId);
    total += mastery ? headlineMastery(mastery.vector) : 0;
  }
  return total / exercise.skills.length;
}

/**
 * Turn the factors into the sentence from §17:
 * "Dictionary mutation is below mastery threshold and has failed three times
 * recently. Practice two short dictionary-state exercises before advancing."
 */
function explain(exercise: Exercise, factors: readonly ScoreFactor[]): string {
  const positive = factors
    .filter((factor) => factor.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 2)
    .map((factor) => factor.label);

  if (positive.length === 0) {
    const negative = factors
      .filter((factor) => factor.delta < 0)
      .sort((a, b) => a.delta - b.delta)[0];
    return negative
      ? `Low priority: ${negative.label}.`
      : `Available, with nothing making it urgent.`;
  }

  const because = positive.length === 1 ? positive[0] : `${positive[0]}, and ${positive[1]}`;
  return `${exercise.title} — ${because}.`;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
