import type { MasteryDimension } from '@forge/core';

import type { Attempt } from './attempt.ts';
import type { FluencyMetrics } from './metrics.ts';
import { computeMetrics } from './metrics.ts';

/**
 * The slice of an exercise the learning engine needs. Deliberately narrow:
 * grading must not depend on prompts, hints, files or language, so the same
 * rules apply to a Python drill and a Rust project.
 */
export interface ExerciseProfile {
  readonly id: string;
  readonly version: number;
  readonly skills: readonly string[];
  /** 1–5. */
  readonly difficulty: number;
  readonly estimatedSeconds: number;
  readonly kind: string;
}

export interface MasteryObservation {
  readonly skillId: string;
  readonly exerciseId: string;
  readonly at: string;
  /** Confidence in [0, 1]. Multiplies how far the mastery vector moves. */
  readonly weight: number;
  /** Only the dimensions this attempt actually says something about. */
  readonly evidence: Readonly<Partial<Record<MasteryDimension, number>>>;
  /** Plain-language justification, surfaced to the learner (spec §17). */
  readonly reasons: readonly string[];
}

/**
 * An attempt that never ran the tests says nothing: the learner opened the
 * exercise and walked away. Grading it would punish curiosity.
 */
export function isGradable(
  attempt: Attempt,
  metrics: FluencyMetrics = computeMetrics(attempt),
): boolean {
  if (attempt.outcome === 'in-progress') return false;
  if (metrics.solved) return true;
  return metrics.testRuns > 0;
}

export function gradeAttempt(
  attempt: Attempt,
  profile: ExerciseProfile,
): readonly MasteryObservation[] {
  const metrics = computeMetrics(attempt);
  if (!isGradable(attempt, metrics)) return [];

  const evidence: Partial<Record<MasteryDimension, number>> = {};
  const reasons: string[] = [];

  // -- application: did it work at all? ------------------------------------
  evidence.application = metrics.solved ? 1 : 0;
  reasons.push(
    metrics.solved
      ? 'Solved the exercise.'
      : `Did not reach a passing solution after ${metrics.testRuns} test runs.`,
  );

  // -- recall: could they produce the syntax unaided? ----------------------
  const recall = recallEvidence(metrics);
  evidence.recall = recall.value;
  reasons.push(recall.reason);

  // -- composition: only where several pieces had to be combined ----------
  if (profile.skills.length > 1 || profile.difficulty >= 3) {
    evidence.composition = metrics.solved ? 1 : 0;
    reasons.push(
      metrics.solved
        ? 'Combined several constructs in one working solution.'
        : 'Could not combine the required constructs.',
    );
  }

  // -- speed: only meaningful for a solved attempt ------------------------
  if (metrics.solved) {
    const speed = speedEvidence(metrics, profile);
    evidence.speed = speed.value;
    reasons.push(speed.reason);
  }

  // -- independence: the product's headline dimension ---------------------
  evidence.independence = metrics.independent ? 1 : 0;
  reasons.push(
    metrics.independent ? 'Completed without hints or documentation.' : assistanceSummary(metrics),
  );

  // A failure is unambiguous evidence however much help was on offer, so it
  // is never discounted the way an assisted success is.
  const weight = metrics.solved ? metrics.evidenceWeight : 1;

  return profile.skills.map((skillId) => ({
    skillId,
    exerciseId: profile.id,
    at: attempt.finishedAt ?? attempt.startedAt,
    weight,
    evidence,
    reasons,
  }));
}

function recallEvidence(metrics: FluencyMetrics): { value: number; reason: string } {
  if (!metrics.solved) {
    return { value: 0, reason: 'Could not produce a working solution from memory.' };
  }
  switch (metrics.deepestHint) {
    case null:
      return { value: 1, reason: 'Recalled the syntax without any hint.' };
    case 'conceptual':
      return { value: 0.9, reason: 'Needed only a conceptual nudge.' };
    case 'structural':
      return { value: 0.75, reason: 'Needed a structural hint about the shape of the solution.' };
    case 'language':
      return { value: 0.5, reason: 'Needed to be pointed at the language feature.' };
    case 'syntax':
      return { value: 0.25, reason: 'Needed the syntax itself.' };
    case 'explicit':
      return { value: 0.05, reason: 'Needed the answer spelled out.' };
  }
}

function speedEvidence(
  metrics: FluencyMetrics,
  profile: ExerciseProfile,
): { value: number; reason: string } {
  const budgetMs = profile.estimatedSeconds * 1000;
  const ratio = budgetMs > 0 ? metrics.totalMs / budgetMs : 1;

  // At or under half the budget is full marks; at or over double it is zero.
  const value = clamp01((2 - ratio) / 1.5);
  const percentage = Math.round(ratio * 100);
  return {
    value: round(value),
    reason: `Took ${percentage}% of the estimated time.`,
  };
}

function assistanceSummary(metrics: FluencyMetrics): string {
  if (metrics.solutionRevealed) return 'Read the reference solution.';
  const parts: string[] = [];
  if (metrics.hintsRevealed > 0) {
    parts.push(`${metrics.hintsRevealed} hint${metrics.hintsRevealed === 1 ? '' : 's'}`);
  }
  if (metrics.documentationLookups > 0) {
    parts.push(
      `${metrics.documentationLookups} documentation lookup${
        metrics.documentationLookups === 1 ? '' : 's'
      }`,
    );
  }
  if (parts.length === 0) return 'Did not complete the exercise.';
  return `Used ${parts.join(' and ')}.`;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : value < 0 ? 0 : value > 1 ? 1 : value;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
