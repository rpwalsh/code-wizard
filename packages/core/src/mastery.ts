// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillId } from './skills.ts';

/**
 * Mastery is deliberately not a single score. A learner can know a concept
 * perfectly and still be unable to recall the syntax unaided; those are
 * different numbers and the product exists because of the gap.
 *
 * `application` is construction — can you build something with it. It keeps
 * its original name rather than being renamed, because a rename would
 * invalidate every stored profile in exchange for a synonym.
 */
export const masteryDimensions = [
  'knowledge',
  'recognition',
  'recall',
  'application',
  'composition',
  /** Can you find the fault when it breaks? A separate skill from writing it. */
  'debugging',
  /** Can you use it somewhere you have not used it before? */
  'transfer',
  'speed',
  'retention',
  'independence',
] as const;

export type MasteryDimension = (typeof masteryDimensions)[number];

/** Every dimension is a probability-like value in [0, 1]. */
export type MasteryVector = Readonly<Record<MasteryDimension, number>>;

export interface SkillMastery {
  readonly skillId: SkillId;
  readonly vector: MasteryVector;
  /** Number of graded observations behind this vector. Low counts are noisy. */
  readonly observations: number;
  readonly lastPracticedAt: string | null;
}

export const zeroMastery: MasteryVector = Object.freeze(
  Object.fromEntries(masteryDimensions.map((dimension) => [dimension, 0])) as Record<
    MasteryDimension,
    number
  >,
);

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function makeMastery(values: Partial<Record<MasteryDimension, number>>): MasteryVector {
  const vector: Record<MasteryDimension, number> = { ...zeroMastery };
  for (const dimension of masteryDimensions) {
    const value = values[dimension];
    if (value !== undefined) vector[dimension] = clamp01(value);
  }
  return Object.freeze(vector);
}

/**
 * A single headline number, for sorting and progress display only. Weighted
 * toward the dimensions the product actually trains: independent recall.
 */
const HEADLINE_WEIGHTS: Readonly<Record<MasteryDimension, number>> = Object.freeze({
  knowledge: 0.5,
  recognition: 0.75,
  recall: 1.5,
  application: 1.25,
  composition: 1.25,
  debugging: 1.25,
  transfer: 1.25,
  speed: 1,
  retention: 1.25,
  independence: 1.5,
});

export function headlineMastery(vector: MasteryVector): number {
  let total = 0;
  let weight = 0;
  for (const dimension of masteryDimensions) {
    total += vector[dimension] * HEADLINE_WEIGHTS[dimension];
    weight += HEADLINE_WEIGHTS[dimension];
  }
  return clamp01(total / weight);
}

/**
 * How ready a learner is to *attempt* work that depends on this skill.
 *
 * Deliberately not `headlineMastery`. Headline mastery is weighted toward
 * independent recall, which is what the product is trying to build; readiness
 * asks whether the learner understands the idea well enough to engage with an
 * exercise that uses it. Gating on mastery would refuse to teach anyone
 * anything until they had already learned it elsewhere.
 */
const READINESS_WEIGHTS: Readonly<Partial<Record<MasteryDimension, number>>> = Object.freeze({
  knowledge: 1,
  recognition: 1.25,
  application: 1.25,
});

/**
 * The dimensions a declared prior is allowed to touch.
 *
 * Saying you know Python is evidence about knowledge and recognition. It is
 * not evidence that you can produce it from an empty editor, find a fault in
 * it, or carry it somewhere new — those are the whole subject matter, and they
 * start at zero however senior the learner is.
 */
export const claimableDimensions = Object.freeze([
  'knowledge',
  'recognition',
  'application',
] as const) satisfies readonly MasteryDimension[];

export type ClaimableDimension = (typeof claimableDimensions)[number];

export function isClaimable(dimension: MasteryDimension): dimension is ClaimableDimension {
  return claimableDimensions.some((claimable) => claimable === dimension);
}

export function readiness(vector: MasteryVector): number {
  let total = 0;
  let weight = 0;
  for (const [dimension, dimensionWeight] of Object.entries(READINESS_WEIGHTS)) {
    total += vector[dimension as MasteryDimension] * (dimensionWeight ?? 0);
    weight += dimensionWeight ?? 0;
  }
  return weight === 0 ? 0 : clamp01(total / weight);
}

/** Dimensions below `threshold`, weakest first. Drives "current weaknesses". */
export function weakestDimensions(
  vector: MasteryVector,
  threshold = 0.7,
): { dimension: MasteryDimension; value: number }[] {
  return masteryDimensions
    .map((dimension) => ({ dimension, value: vector[dimension] }))
    .filter((entry) => entry.value < threshold)
    .sort((a, b) => a.value - b.value);
}
