import type { Attempt } from '@code-retrainer/learning';
import { computeMetrics } from '@code-retrainer/learning';

/**
 * Where the learner started, and how far that is from where they are.
 *
 * Derived from the attempt log rather than stored, like everything else that
 * feeds a number on screen. A baseline captured once and frozen would be a
 * derived value pretending to be evidence: improving the scoring model would
 * leave the old figure stranded, and the comparison it anchors would silently
 * become nonsense.
 *
 * This exists because the honest question is never "how good are you?" — it is
 * "how much less help do you need than you did?" That comparison is against
 * the learner's own first sessions and nobody else's, which is also why there
 * is no percentile anywhere in this file.
 */
export interface Baseline {
  /** When the first measured attempt happened. */
  readonly takenAt: string;
  /** How many attempts the reading is over. */
  readonly attempts: number;
  /** Share of solved attempts that needed no help at all. */
  readonly independence: number;
  /** Share of attempts that reached a passing solution. */
  readonly solveRate: number;
  /** Median time to green among solves, or null if nothing was solved. */
  readonly medianTimeToGreenMs: number | null;
  /** Mean hints taken per attempt. */
  readonly hintsPerAttempt: number;
}

export interface BaselineComparison {
  readonly baseline: Baseline;
  readonly now: Baseline;
  /**
   * Change in independence, in points. Positive means less help is needed.
   *
   * The headline number of the whole product: not how much they know, but how
   * much of the machinery is back in their own hands.
   */
  readonly independenceChange: number;
  /** Change in median time to green, negative meaning faster. Null if unknown. */
  readonly speedChangeMs: number | null;
}

export interface BaselineOptions {
  /**
   * Attempts on each side of the comparison.
   *
   * Small enough that a baseline exists after one honest sitting, large enough
   * that a single lucky exercise cannot define it.
   */
  readonly size?: number;
}

const DEFAULT_SIZE = 5;

/**
 * The learner's opening reading, or null while there is not enough evidence.
 *
 * Refusing to answer is the right behaviour here. A baseline computed from two
 * attempts would put a precise-looking number on screen that a third attempt
 * could move by fifty points, and every comparison drawn against it afterwards
 * would inherit that noise.
 */
export function readBaseline(
  attempts: readonly Attempt[],
  options: BaselineOptions = {},
): Baseline | null {
  const size = options.size ?? DEFAULT_SIZE;
  const ordered = chronological(attempts);
  if (ordered.length < size) return null;
  return measure(ordered.slice(0, size));
}

/**
 * The baseline beside the most recent equivalent window.
 *
 * Null until there are enough attempts for the two windows not to overlap:
 * comparing a learner's first five attempts against a set that includes those
 * same five would report progress that is partly just arithmetic.
 */
export function compareToBaseline(
  attempts: readonly Attempt[],
  options: BaselineOptions = {},
): BaselineComparison | null {
  const size = options.size ?? DEFAULT_SIZE;
  const ordered = chronological(attempts);
  if (ordered.length < size * 2) return null;

  const baseline = measure(ordered.slice(0, size));
  const now = measure(ordered.slice(-size));

  return {
    baseline,
    now,
    independenceChange: round(now.independence - baseline.independence),
    speedChangeMs:
      baseline.medianTimeToGreenMs === null || now.medianTimeToGreenMs === null
        ? null
        : now.medianTimeToGreenMs - baseline.medianTimeToGreenMs,
  };
}

/**
 * How much the learner leaned on assistance, day by day.
 *
 * The chart that matters for someone rebuilding capability after leaning on a
 * model: not what they scored, but whether the line is going down. Each point
 * is a trailing window rather than a single day's attempts, because one bad
 * afternoon is not a trend and should not look like one.
 */
export interface AssistancePoint {
  /** ISO date, midnight UTC. */
  readonly date: string;
  /**
   * Share of attempts in the trailing window that used a hint, a documentation
   * lookup, or the revealed solution. Null where the window holds nothing.
   */
  readonly dependency: number | null;
  readonly attempts: number;
}

export function readAssistance(
  attempts: readonly Attempt[],
  options: { readonly days: number; readonly now: Date; readonly windowDays?: number },
): readonly AssistancePoint[] {
  const windowDays = options.windowDays ?? 7;
  const ordered = chronological(attempts);
  const points: AssistancePoint[] = [];

  const end = startOfUtcDay(options.now);
  for (let offset = options.days; offset >= 0; offset -= 1) {
    const day = end - offset * DAY_MS;
    const from = day - (windowDays - 1) * DAY_MS;

    const inWindow = ordered.filter((attempt) => {
      const at = startOfUtcDay(new Date(attempt.startedAt));
      return at >= from && at <= day;
    });

    const assisted = inWindow.filter((attempt) => {
      const metrics = computeMetrics(attempt);
      return (
        metrics.hintsRevealed > 0 || metrics.documentationLookups > 0 || metrics.solutionRevealed
      );
    });

    points.push({
      date: new Date(day).toISOString().slice(0, 10),
      dependency: inWindow.length === 0 ? null : round(assisted.length / inWindow.length),
      attempts: inWindow.length,
    });
  }

  return points;
}

const DAY_MS = 86_400_000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function chronological(attempts: readonly Attempt[]): readonly Attempt[] {
  return [...attempts].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
}

function measure(window: readonly Attempt[]): Baseline {
  const metrics = window.map((attempt) => computeMetrics(attempt));
  const solved = metrics.filter((entry) => entry.solved);
  const times = solved
    .map((entry) => entry.timeToFirstGreenMs)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  return {
    takenAt: window[0]?.startedAt ?? new Date(0).toISOString(),
    attempts: window.length,
    independence:
      solved.length === 0
        ? 0
        : round(solved.filter((entry) => entry.independent).length / solved.length),
    solveRate: round(solved.length / window.length),
    medianTimeToGreenMs: median(times),
    hintsPerAttempt: round(
      metrics.reduce((total, entry) => total + entry.hintsRevealed, 0) / window.length,
    ),
  };
}

function median(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const low = sorted[middle - 1];
  const high = sorted[middle];
  return low === undefined || high === undefined ? null : Math.round((low + high) / 2);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
