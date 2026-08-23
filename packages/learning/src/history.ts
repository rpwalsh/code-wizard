// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Attempt } from './attempt.ts';
import type { FluencyMetrics } from './metrics.ts';
import { computeMetrics } from './metrics.ts';

/**
 * One row of the fluency history in spec §20 — the view that shows a learner
 * moving from "unfamiliar" to "automatic" on the same exercise.
 */
export interface AttemptSummary {
  readonly attemptId: string;
  readonly index: number;
  readonly at: string;
  readonly exerciseVersion: number;
  readonly metrics: FluencyMetrics;
}

export interface FluencyHistory {
  readonly exerciseId: string;
  readonly attempts: readonly AttemptSummary[];
  /** Best (lowest) completion time across solved attempts, in ms. */
  readonly bestTimeMs: number | null;
  /** Completion time of the most recent solved attempt, in ms. */
  readonly latestTimeMs: number | null;
  /**
   * Fractional improvement from the first solved attempt to the latest, e.g.
   * 0.71 for 2m41s → 47s. Null until there are two solved attempts.
   */
  readonly improvement: number | null;
  /** Fraction of solved attempts that needed no assistance at all. */
  readonly independentRate: number | null;
  /** True when the latest solved attempt used no assistance and beat the estimate. */
  readonly automatic: boolean;
}

export function buildHistory(
  exerciseId: string,
  attempts: readonly Attempt[],
  estimatedSeconds?: number,
): FluencyHistory {
  const relevant = attempts
    .filter((attempt) => attempt.exerciseId === exerciseId)
    .slice()
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));

  const summaries: AttemptSummary[] = relevant.map((attempt, index) => ({
    attemptId: attempt.id,
    index: index + 1,
    at: attempt.startedAt,
    exerciseVersion: attempt.exerciseVersion,
    metrics: computeMetrics(attempt),
  }));

  const solved = summaries.filter((summary) => summary.metrics.solved);
  const times = solved.map((summary) => summary.metrics.totalMs);

  const first = times[0] ?? null;
  const latest = times.at(-1) ?? null;
  const improvement =
    times.length >= 2 && first !== null && latest !== null && first > 0
      ? round((first - latest) / first)
      : null;

  const latestSummary = solved.at(-1);
  const automatic =
    latestSummary !== undefined &&
    latestSummary.metrics.independent &&
    (estimatedSeconds === undefined || latestSummary.metrics.totalMs <= estimatedSeconds * 1000);

  return {
    exerciseId,
    attempts: summaries,
    bestTimeMs: times.length > 0 ? Math.min(...times) : null,
    latestTimeMs: latest,
    improvement,
    independentRate:
      solved.length > 0
        ? round(solved.filter((summary) => summary.metrics.independent).length / solved.length)
        : null,
    automatic,
  };
}

/**
 * The four-stage progression the product is trying to produce. Stated as a
 * label so the UI does not have to reimplement the thresholds.
 */
export type FluencyStage = 'unfamiliar' | 'understood' | 'recalled' | 'automatic';

export function fluencyStage(history: FluencyHistory): FluencyStage {
  const solved = history.attempts.filter((summary) => summary.metrics.solved);
  if (solved.length === 0) return 'unfamiliar';
  if (history.automatic) return 'automatic';

  const latest = solved.at(-1);
  if (latest?.metrics.independent === true) return 'recalled';
  return 'understood';
}

/** Rate of independent completion across every exercise, for the dashboard. */
export function independentCompletionRate(attempts: readonly Attempt[]): number | null {
  const solved = attempts
    .map((attempt) => computeMetrics(attempt))
    .filter((metrics) => metrics.solved);
  if (solved.length === 0) return null;
  return round(solved.filter((metrics) => metrics.independent).length / solved.length);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
