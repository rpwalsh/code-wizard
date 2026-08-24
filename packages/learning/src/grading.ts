// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MasteryDimension, TrainingMode } from '@code-wizard/core';
import { affordancesFor } from '@code-wizard/core';

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

/**
 * What the learner had already done before this attempt.
 *
 * Needed because two of the dimensions are about history rather than the
 * attempt itself: solving something for the first time is only *transfer* if
 * the skills behind it were practiced somewhere else first.
 */
export interface GradingContext {
  /** Attempts at this exact exercise, before this one. */
  readonly priorAttemptsAtExercise: number;
  /** Attempts at *other* exercises training any of the same skills. */
  readonly priorAttemptsAtSkill: number;
}

export const noHistory: GradingContext = Object.freeze({
  priorAttemptsAtExercise: 0,
  priorAttemptsAtSkill: 0,
});

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
  history: GradingContext = noHistory,
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
  const recall = recallEvidence(metrics, attempt.mode);
  evidence.recall = recall.value;
  reasons.push(recall.reason);

  // -- knowledge: did they know what the machine would do? -----------------
  //
  // The only place this dimension is ever earned. Everything else here
  // measures whether the code worked; a prediction made before running is the
  // only evidence that the learner knew *why* — and the only way a claim made
  // at onboarding can ever be corrected downward by reality.
  if (metrics.predictionAccuracy !== null) {
    evidence.knowledge = round(metrics.predictionAccuracy);
    reasons.push(
      `Predicted the outcome correctly ${metrics.predictionsCorrect} of ` +
        `${metrics.predictionsMade} ${metrics.predictionsMade === 1 ? 'time' : 'times'} ` +
        'before running.',
    );
  }

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

  // -- debugging: could they find the fault? ------------------------------
  //
  // Two sources. A bug-fix exercise *is* a debugging task, so solving it is
  // direct evidence. Any other exercise that went red and then green also
  // required a diagnosis, and how many red runs it took is the measure of how
  // efficiently they made it.
  const debugging = debuggingEvidence(metrics, profile);
  if (debugging) {
    evidence.debugging = debugging.value;
    reasons.push(debugging.reason);
  }

  // -- transfer: did they carry a known skill somewhere new? ---------------
  //
  // Only meaningful the first time an exercise is seen, and only when the
  // skills behind it were practiced elsewhere first. Otherwise this is not
  // transfer, it is learning — which the other dimensions already cover.
  if (history.priorAttemptsAtExercise === 0 && history.priorAttemptsAtSkill > 0) {
    evidence.transfer = metrics.solved ? 1 : 0;
    reasons.push(
      metrics.solved
        ? 'Applied a familiar skill in an exercise never seen before.'
        : 'Could not carry a familiar skill into an unfamiliar exercise.',
    );
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

function debuggingEvidence(
  metrics: FluencyMetrics,
  profile: ExerciseProfile,
): { value: number; reason: string } | null {
  if (profile.kind === 'bug-fix') {
    return metrics.solved
      ? { value: 1, reason: 'Located and corrected a fault in existing code.' }
      : { value: 0, reason: 'Could not locate the fault.' };
  }

  // No red run means nothing was ever diagnosed, so there is nothing to say.
  if (metrics.failedTestRuns === 0) return null;

  if (!metrics.solved) {
    return { value: 0, reason: 'Left the tests failing without finding the cause.' };
  }

  // One or two red runs before green is a diagnosis; ten is thrashing.
  const value = clamp01(1 - (metrics.failedTestRuns - 1) / 8);
  return {
    value: round(value),
    reason: `Went from failing to passing after ${metrics.failedTestRuns} red ${
      metrics.failedTestRuns === 1 ? 'run' : 'runs'
    }.`,
  };
}

/**
 * Full recall means producing the code, not completing it.
 *
 * A skeleton in the editor answers half the question before it is asked —
 * which shape, which signature, which imports. Reading that and filling the
 * gap is recognition wearing recall's clothes, so a solve with the starter
 * code in front of you cannot reach the top of this dimension. Only the rungs
 * that hand you an empty file can.
 */
const COMPLETION_CEILING = 0.85;

function recallEvidence(
  metrics: FluencyMetrics,
  mode: TrainingMode,
): { value: number; reason: string } {
  if (!metrics.solved) {
    return { value: 0, reason: 'Could not produce a working solution from memory.' };
  }

  if (!affordancesFor(mode).starterCode) {
    return metrics.deepestHint === null
      ? { value: 1, reason: 'Produced the whole solution from an empty file.' }
      : hintedRecall(metrics.deepestHint);
  }

  const hinted = hintedRecall(metrics.deepestHint);
  return {
    value: Math.min(hinted.value, COMPLETION_CEILING),
    reason:
      hinted.value > COMPLETION_CEILING
        ? 'Completed the starter code without a hint. Producing it from nothing is the next rung.'
        : hinted.reason,
  };
}

function hintedRecall(deepestHint: FluencyMetrics['deepestHint']): {
  value: number;
  reason: string;
} {
  switch (deepestHint) {
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
