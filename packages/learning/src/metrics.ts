import { affordancesFor } from '@forge/core';

import type { Attempt, HintLevel } from './attempt.ts';

const HINT_ORDER: readonly HintLevel[] = [
  'conceptual',
  'structural',
  'language',
  'syntax',
  'explicit',
];

/**
 * The fluency metrics of spec §19. Every field is derived from the event log,
 * so changing how a metric is computed re-derives history rather than
 * invalidating it.
 */
export interface FluencyMetrics {
  /** Wall-clock from start to finish, minus any paused time. */
  readonly totalMs: number;
  /** How long before the learner ran anything at all. Hesitation, roughly. */
  readonly timeToFirstRunMs: number | null;
  /** How long before every test passed. Null when it never did. */
  readonly timeToFirstGreenMs: number | null;
  readonly runs: number;
  readonly testRuns: number;
  readonly failedTestRuns: number;
  readonly hintsRevealed: number;
  /** The most explicit hint reached, which matters more than the count. */
  readonly deepestHint: HintLevel | null;
  readonly documentationLookups: number;
  readonly solutionRevealed: boolean;
  readonly solved: boolean;
  /**
   * Solved with no hint, no documentation lookup and no solution reveal. The
   * single most important bit in the whole record (spec §33).
   */
  readonly independent: boolean;
  /**
   * How much this attempt should count as evidence, from the mode's
   * affordances and the assistance actually used. In [0, 1].
   */
  readonly evidenceWeight: number;
}

export function computeMetrics(attempt: Attempt): FluencyMetrics {
  const start = Date.parse(attempt.startedAt);
  const end = attempt.finishedAt
    ? Date.parse(attempt.finishedAt)
    : (lastEventTime(attempt) ?? start);

  let runs = 0;
  let testRuns = 0;
  let failedTestRuns = 0;
  let hintsRevealed = 0;
  let documentationLookups = 0;
  let solutionRevealed = false;
  let deepestHintIndex = -1;
  let firstRunAt: number | null = null;
  let firstGreenAt: number | null = null;
  let pausedMs = 0;
  let pausedSince: number | null = null;

  for (const event of attempt.events) {
    const at = Date.parse(event.at);

    switch (event.type) {
      case 'run':
        runs += 1;
        firstRunAt ??= at;
        break;
      case 'test':
        testRuns += 1;
        firstRunAt ??= at;
        if (!event.green) failedTestRuns += 1;
        else firstGreenAt ??= at;
        break;
      case 'hint':
        hintsRevealed += 1;
        deepestHintIndex = Math.max(deepestHintIndex, HINT_ORDER.indexOf(event.level));
        break;
      case 'documentation':
        documentationLookups += 1;
        break;
      case 'solution-revealed':
        solutionRevealed = true;
        break;
      case 'paused':
        pausedSince ??= at;
        break;
      case 'resumed':
        if (pausedSince !== null) {
          pausedMs += Math.max(0, at - pausedSince);
          pausedSince = null;
        }
        break;
    }
  }

  // An attempt left paused should not accrue time while the learner is away.
  if (pausedSince !== null) pausedMs += Math.max(0, end - pausedSince);

  const solved = attempt.outcome === 'solved';
  const independent =
    solved && hintsRevealed === 0 && documentationLookups === 0 && !solutionRevealed;

  return {
    totalMs: Math.max(0, end - start - pausedMs),
    timeToFirstRunMs: firstRunAt === null ? null : Math.max(0, firstRunAt - start),
    timeToFirstGreenMs: firstGreenAt === null ? null : Math.max(0, firstGreenAt - start - pausedMs),
    runs,
    testRuns,
    failedTestRuns,
    hintsRevealed,
    deepestHint: deepestHintIndex >= 0 ? (HINT_ORDER[deepestHintIndex] ?? null) : null,
    documentationLookups,
    solutionRevealed,
    solved,
    independent,
    evidenceWeight: evidenceWeight(attempt, {
      hintsRevealed,
      deepestHintIndex,
      documentationLookups,
      solutionRevealed,
    }),
  };
}

/**
 * How seriously to take this attempt. Assistance does not invalidate a
 * success — it discounts it. Reading the solution discounts it to nothing.
 */
function evidenceWeight(
  attempt: Attempt,
  used: {
    hintsRevealed: number;
    deepestHintIndex: number;
    documentationLookups: number;
    solutionRevealed: boolean;
  },
): number {
  if (used.solutionRevealed) return 0;

  let weight = affordancesFor(attempt.mode).evidenceWeight;

  // A conceptual nudge costs little; being handed the answer costs almost
  // everything. The penalty is driven by the deepest hint, not the count.
  if (used.deepestHintIndex >= 0) {
    const penalty = [0.9, 0.75, 0.6, 0.45, 0.25][used.deepestHintIndex] ?? 0.25;
    weight *= penalty;
  }
  if (used.documentationLookups > 0) weight *= 0.9;

  return round(clamp01(weight));
}

function lastEventTime(attempt: Attempt): number | null {
  const last = attempt.events.at(-1);
  return last ? Date.parse(last.at) : null;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : value < 0 ? 0 : value > 1 ? 1 : value;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
