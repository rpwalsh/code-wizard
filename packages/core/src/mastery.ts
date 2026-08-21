import type { SkillId } from './skills.ts';

/**
 * Mastery is deliberately not a single score (spec §18). A learner can know a
 * concept perfectly and still be unable to recall the syntax unaided; those
 * are different numbers and the product exists because of the gap.
 */
export const masteryDimensions = [
  'knowledge',
  'recognition',
  'recall',
  'application',
  'composition',
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
  const vector = { ...zeroMastery } as Record<MasteryDimension, number>;
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
