// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MasteryDimension, MasteryVector, SkillMastery } from '@code-retrainer/core';
import { clamp01, makeMastery, masteryDimensions, zeroMastery } from '@code-retrainer/core';

import type { MasteryObservation } from './grading.ts';

export interface MasteryChange {
  readonly dimension: MasteryDimension;
  readonly from: number;
  readonly to: number;
}

export interface MasteryUpdate {
  readonly mastery: SkillMastery;
  readonly changes: readonly MasteryChange[];
  /** Why the numbers moved, in the learner's language (spec §17, §47). */
  readonly reasons: readonly string[];
}

export interface UpdateOptions {
  /**
   * Smallest step size, so a well-established skill can still be moved by new
   * evidence. Without a floor, mastery freezes after enough observations.
   */
  readonly minimumRate?: number;
  /** Largest step size, so one lucky attempt cannot declare mastery. */
  readonly maximumRate?: number;
  /**
   * Evidence of failure moves the number faster than evidence of success.
   * Being unable to do something today is a stronger signal than having done
   * it once.
   */
  readonly regressionMultiplier?: number;
}

const DEFAULTS: Required<UpdateOptions> = {
  minimumRate: 0.12,
  maximumRate: 0.6,
  regressionMultiplier: 1.6,
};

export function emptyMastery(skillId: string): SkillMastery {
  return { skillId, vector: zeroMastery, observations: 0, lastPracticedAt: null };
}

/**
 * Move a skill's mastery vector toward the observed evidence.
 *
 * The rule is a weighted moving average whose step size shrinks as evidence
 * accumulates: early attempts move the number a lot, later ones refine it.
 * It is deliberately simple and fully deterministic — a learner has to be able
 * to understand why their number changed (spec §47).
 */
export function applyObservation(
  current: SkillMastery,
  observation: MasteryObservation,
  options: UpdateOptions = {},
): MasteryUpdate {
  const settings = { ...DEFAULTS, ...options };
  const baseRate = clampRange(
    1 / (current.observations + 1),
    settings.minimumRate,
    settings.maximumRate,
  );

  const next: Record<MasteryDimension, number> = { ...current.vector };
  const changes: MasteryChange[] = [];

  for (const dimension of masteryDimensions) {
    const evidence = observation.evidence[dimension];
    if (evidence === undefined) continue;

    const from = current.vector[dimension];
    const regressing = evidence < from;
    const rate = clamp01(
      baseRate * observation.weight * (regressing ? settings.regressionMultiplier : 1),
    );
    const to = round(clamp01(from + rate * (evidence - from)));

    next[dimension] = to;
    if (to !== from) changes.push({ dimension, from, to });
  }

  return {
    mastery: {
      skillId: current.skillId,
      vector: makeMastery(next),
      observations: current.observations + 1,
      lastPracticedAt: observation.at,
    },
    changes,
    reasons: observation.reasons,
  };
}

/** Apply a batch in order. Later observations see the effect of earlier ones. */
export function applyObservations(
  current: SkillMastery,
  observations: readonly MasteryObservation[],
  options: UpdateOptions = {},
): MasteryUpdate {
  let mastery = current;
  const changes: MasteryChange[] = [];
  const reasons: string[] = [];

  for (const observation of observations) {
    const update = applyObservation(mastery, observation, options);
    mastery = update.mastery;
    changes.push(...update.changes);
    reasons.push(...update.reasons);
  }

  return { mastery, changes: collapse(changes), reasons: [...new Set(reasons)] };
}

/**
 * Retention decays with time away from a skill (spec §21). Called by the
 * scheduler, not by grading: it describes forgetting, not performance.
 */
export function decayRetention(mastery: SkillMastery, now: Date, halfLifeDays = 21): SkillMastery {
  if (!mastery.lastPracticedAt) return mastery;

  const elapsedDays = (now.getTime() - Date.parse(mastery.lastPracticedAt)) / 86_400_000;
  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) return mastery;

  // A well-established skill decays more slowly, which is what makes spaced
  // repetition intervals able to grow.
  const stability = 1 + mastery.vector.retention * 2;
  const factor = Math.pow(0.5, elapsedDays / (halfLifeDays * stability));

  return {
    ...mastery,
    vector: makeMastery({
      ...mastery.vector,
      retention: round(mastery.vector.retention * factor),
    }),
  };
}

/** Retention rises when a skill is successfully recalled after a delay. */
export function reinforceRetention(
  mastery: SkillMastery,
  observation: MasteryObservation,
): SkillMastery {
  const recalled = observation.evidence.recall ?? 0;
  if (recalled <= 0) return mastery;

  const gain = 0.3 * observation.weight * recalled;
  return {
    ...mastery,
    vector: makeMastery({
      ...mastery.vector,
      retention: round(clamp01(mastery.vector.retention + gain * (1 - mastery.vector.retention))),
    }),
  };
}

/** Keep only the first `from` and last `to` per dimension, for display. */
function collapse(changes: readonly MasteryChange[]): MasteryChange[] {
  const byDimension = new Map<MasteryDimension, MasteryChange>();
  for (const change of changes) {
    const existing = byDimension.get(change.dimension);
    byDimension.set(change.dimension, existing ? { ...existing, to: change.to } : change);
  }
  return [...byDimension.values()].filter((change) => change.from !== change.to);
}

export function describeChange(change: MasteryChange): string {
  const direction = change.to > change.from ? '↑' : '↓';
  return `${change.dimension} ${percent(change.from)} ${direction} ${percent(change.to)}`;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function clampRange(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export type { MasteryVector };
