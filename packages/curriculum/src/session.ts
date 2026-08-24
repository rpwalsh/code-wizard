// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Exercise } from '@code-wizard/exercises';

import type { Recommendation } from './recommender.ts';

/**
 * The buckets a training session is built from (spec §50):
 *
 *   5 × Recall
 *   3 × Spaced Review
 *   1 × Focused Problem
 *   1 × Progressive System
 */
export type SessionSlot = 'recall' | 'review' | 'focused' | 'system';

export interface PlannedExercise {
  readonly slot: SessionSlot;
  readonly exercise: Exercise;
  readonly reason: string;
  readonly estimatedSeconds: number;
}

export interface SessionPlan {
  readonly items: readonly PlannedExercise[];
  readonly estimatedSeconds: number;
  /** Slots that could not be filled, and why. */
  readonly gaps: readonly { slot: SessionSlot; reason: string }[];
}

export interface SessionShape {
  readonly recall: number;
  readonly review: number;
  readonly focused: number;
  readonly system: number;
}

export const defaultSessionShape: SessionShape = Object.freeze({
  recall: 5,
  review: 3,
  focused: 1,
  system: 1,
});

export interface PlanOptions {
  readonly shape?: Partial<SessionShape>;
  /** Hard ceiling on the session, in seconds. Slots stop being filled at it. */
  readonly timeBudgetSeconds?: number;
  /**
   * Skills the scheduler says are due. Without these the review slot cannot be
   * filled at all — a review is defined by timing, not by content.
   */
  readonly dueSkills?: ReadonlySet<string>;
}

/** Display order, from §50. */
const SLOT_ORDER: readonly SessionSlot[] = ['recall', 'review', 'focused', 'system'];

/**
 * Tie-break when two slots are equally constrained. Time-critical work first.
 */
const FILL_PRIORITY: readonly SessionSlot[] = ['review', 'system', 'focused', 'recall'];

const SLOT_LABEL: Readonly<Record<SessionSlot, string>> = Object.freeze({
  recall: 'Recall',
  review: 'Spaced Review',
  focused: 'Focused Problem',
  system: 'Progressive System',
});

export function slotLabel(slot: SessionSlot): string {
  return SLOT_LABEL[slot];
}

/**
 * Build today's session from the ranked recommendations.
 *
 * The shape is fixed and the ranking fills it, rather than simply taking the
 * top N. A learner whose weakest area happens to be one skill should still get
 * a varied session — otherwise the recommender would hand them the same drill
 * ten times and call it training.
 */
export function planSession(
  recommendations: readonly Recommendation[],
  options: PlanOptions = {},
): SessionPlan {
  const shape = { ...defaultSessionShape, ...options.shape };
  const budget = options.timeBudgetSeconds ?? Number.POSITIVE_INFINITY;

  const dueSkills = options.dueSkills ?? new Set<string>();
  const used = new Set<string>();
  const items: PlannedExercise[] = [];
  const gaps: { slot: SessionSlot; reason: string }[] = [];
  let total = 0;

  for (const slot of fillOrder(recommendations, shape, dueSkills)) {
    const wanted = shape[slot];
    let filled = 0;

    for (const recommendation of recommendations) {
      if (filled >= wanted) break;
      if (used.has(recommendation.exercise.id)) continue;
      if (!fitsSlot(recommendation.exercise, slot, dueSkills)) continue;

      const cost = recommendation.exercise.estimatedSeconds;
      if (total + cost > budget) continue;

      used.add(recommendation.exercise.id);
      items.push({
        slot,
        exercise: recommendation.exercise,
        reason: recommendation.reason,
        estimatedSeconds: cost,
      });
      total += cost;
      filled += 1;
    }

    if (filled < wanted) {
      gaps.push({
        slot,
        reason:
          filled === 0
            ? `No ${SLOT_LABEL[slot].toLowerCase()} exercise is available and unlocked.`
            : `Only ${filled} of ${wanted} ${SLOT_LABEL[slot].toLowerCase()} exercises available.`,
      });
    }
  }

  // Present in display order regardless of the order they were filled in.
  items.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  gaps.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  return { items, estimatedSeconds: total, gaps };
}

/**
 * Fill the most constrained slot first.
 *
 * A slot with one eligible exercise must claim it before a slot with ten
 * choices does — otherwise the permissive slot takes the only candidate the
 * narrow one had, and the narrow slot reports a gap while its exercise sits in
 * the wrong bucket. Which slot is narrowest depends on the catalog and on
 * what is due today, so it is measured rather than hard-coded.
 */
function fillOrder(
  recommendations: readonly Recommendation[],
  shape: SessionShape,
  dueSkills: ReadonlySet<string>,
): SessionSlot[] {
  const eligible = new Map<SessionSlot, number>();
  for (const slot of SLOT_ORDER) {
    eligible.set(
      slot,
      recommendations.filter((recommendation) => fitsSlot(recommendation.exercise, slot, dueSkills))
        .length,
    );
  }

  return [...SLOT_ORDER]
    .filter((slot) => shape[slot] > 0)
    .sort(
      (a, b) =>
        (eligible.get(a) ?? 0) - (eligible.get(b) ?? 0) ||
        FILL_PRIORITY.indexOf(a) - FILL_PRIORITY.indexOf(b),
    );
}

/**
 * Which slot an exercise can fill. Review is deliberately not a kind: any
 * exercise becomes a review when one of its skills comes due, so the scheduler
 * decides that, not the content.
 */
function fitsSlot(exercise: Exercise, slot: SessionSlot, dueSkills: ReadonlySet<string>): boolean {
  switch (slot) {
    case 'recall':
      return (
        exercise.kind === 'syntax-drill' ||
        exercise.kind === 'completion' ||
        exercise.kind === 'micro-problem'
      );
    case 'review':
      if (!exercise.skills.some((skillId) => dueSkills.has(skillId))) return false;
      return exercise.kind !== 'project' && exercise.kind !== 'progressive-stage';
    case 'focused':
      return (
        exercise.kind === 'focused-problem' ||
        exercise.kind === 'bug-fix' ||
        exercise.kind === 'translation'
      );
    case 'system':
      return (
        exercise.kind === 'stateful-problem' ||
        exercise.kind === 'progressive-stage' ||
        exercise.kind === 'project'
      );
  }
}

/** Group a plan for display, preserving slot order. */
export function groupBySlot(plan: SessionPlan): { slot: SessionSlot; items: PlannedExercise[] }[] {
  return SLOT_ORDER.map((slot) => ({
    slot,
    items: plan.items.filter((item) => item.slot === slot),
  })).filter((group) => group.items.length > 0);
}
