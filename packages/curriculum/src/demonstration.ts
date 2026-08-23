// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillGraph, SkillId, SkillMastery, TrainingMode } from '@code-retrainer/core';
import { makeMastery } from '@code-retrainer/core';
import type { Exercise } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import { computeMetrics } from '@code-retrainer/learning';

/**
 * "I know this. Skip it."
 *
 * An experienced programmer sent through a beginner's ladder will leave, and
 * they will be right to. But a system that simply believes the claim stops
 * measuring anything, and a mastery figure it produced afterwards would be
 * worth nothing.
 *
 * So the claim is neither refused nor trusted: it is put to a short test, on
 * the hardest exercise for the skill, with the starter code withdrawn. Pass it
 * cleanly and inside the time it should take, and the skill is credited along
 * with everything it depends on — the ladder below a skill you have just
 * demonstrated is not worth anyone's evening. Fail it and nothing is lost
 * except the shortcut, because a failed demonstration is not a failed
 * exercise: it is an answer to a question the learner asked.
 */
export interface Demonstration {
  readonly skillId: SkillId;
  readonly exerciseId: string;
  /**
   * Blank page: completing a skeleton would demonstrate recognition, and
   * recognition is the thing an experienced programmer already has.
   */
  readonly mode: TrainingMode;
  /**
   * The time it should take someone who genuinely knows this. Generous — the
   * point is to catch "I thought I knew this", not to run a stopwatch on
   * someone who does.
   */
  readonly budgetSeconds: number;
}

export interface DemonstrationOptions {
  /** Exercises already attempted, which cannot be used to demonstrate anything. */
  readonly attemptedExerciseIds?: ReadonlySet<string>;
  /** Multiple of the exercise estimate allowed. */
  readonly budgetFactor?: number;
}

/**
 * The exercise that would settle the claim, or null if nothing can.
 *
 * Returns null rather than inventing a weaker test when every exercise for the
 * skill has already been seen: a demonstration on a familiar exercise proves
 * the learner remembers that exercise.
 */
export function planDemonstration(
  skillId: SkillId,
  exercises: readonly Exercise[],
  options: DemonstrationOptions = {},
): Demonstration | null {
  const attempted = options.attemptedExerciseIds ?? new Set<string>();

  const candidates = exercises
    .filter((exercise) => exercise.skills.includes(skillId))
    .filter((exercise) => !attempted.has(exercise.id))
    // Hardest first: a demonstration that anyone could pass demonstrates
    // nothing, and the claim being tested is a strong one.
    .sort((a, b) => b.difficulty - a.difficulty || a.id.localeCompare(b.id));

  const chosen = candidates[0];
  if (!chosen) return null;

  return {
    skillId,
    exerciseId: chosen.id,
    mode: 'blank-page',
    budgetSeconds: Math.round(chosen.estimatedSeconds * (options.budgetFactor ?? 1.5)),
  };
}

export interface DemonstrationResult {
  readonly passed: boolean;
  /** Why, in the learner's language. Shown whichever way it went. */
  readonly reason: string;
  /** Skills to credit: the demonstrated one and everything beneath it. */
  readonly credited: readonly SkillId[];
}

/**
 * Judge a demonstration attempt.
 *
 * Stricter than ordinary grading on purpose. This is not measuring progress,
 * it is answering a yes/no question the learner asked about themselves, and
 * the cost of a false yes is that they skip material they actually needed.
 */
export function judgeDemonstration(
  attempt: Attempt,
  demonstration: Demonstration,
  graph: SkillGraph,
): DemonstrationResult {
  const metrics = computeMetrics(attempt);

  if (!metrics.solved) {
    return {
      passed: false,
      reason: 'Not solved. Nothing lost — this is the answer to the question you asked.',
      credited: [],
    };
  }

  if (!metrics.independent) {
    return {
      passed: false,
      reason: 'Solved, but with help. That is worth having; it is not the claim you made.',
      credited: [],
    };
  }

  const budgetMs = demonstration.budgetSeconds * 1000;
  if (metrics.totalMs > budgetMs) {
    return {
      passed: false,
      reason: `Solved unaided, in ${Math.round(metrics.totalMs / 1000)}s against a ${
        demonstration.budgetSeconds
      }s budget. Knowing it and having it to hand are different things.`,
      credited: [],
    };
  }

  return {
    passed: true,
    reason: 'Demonstrated. This skill and everything it rests on are credited.',
    credited: creditedSkills(demonstration.skillId, graph),
  };
}

/** The demonstrated skill plus everything it depends on, transitively. */
export function creditedSkills(skillId: SkillId, graph: SkillGraph): readonly SkillId[] {
  if (!graph.has(skillId)) return [skillId];
  return [skillId, ...graph.ancestors(skillId)];
}

/**
 * Mastery records for a passed demonstration.
 *
 * The demonstrated skill is credited on the strength of what was actually
 * shown. Its prerequisites are credited lower, because they were shown only by
 * implication — enough to stop gating the learner, not enough to claim they
 * were measured. `observations` reflects that difference honestly: the
 * demonstrated skill has real evidence behind it and the rest do not, so the
 * dashboard will not count them as measured skills.
 */
export function creditDemonstration(
  demonstration: Demonstration,
  graph: SkillGraph,
  at: string,
): readonly SkillMastery[] {
  const direct: SkillMastery = {
    skillId: demonstration.skillId,
    vector: makeMastery({
      knowledge: 0.9,
      recognition: 0.9,
      recall: 0.85,
      application: 0.9,
      independence: 0.9,
      speed: 0.8,
    }),
    observations: 1,
    lastPracticedAt: at,
  };

  const implied = graph.has(demonstration.skillId)
    ? graph.ancestors(demonstration.skillId).map((skillId): SkillMastery => ({
        skillId,
        vector: makeMastery({
          knowledge: 0.8,
          recognition: 0.8,
          recall: 0.6,
          application: 0.7,
        }),
        // Implied, not observed. Nothing here was actually measured, and
        // saying otherwise would put unearned skills in the fluency reading.
        observations: 0,
        lastPracticedAt: null,
      }))
    : [];

  return [direct, ...implied];
}
