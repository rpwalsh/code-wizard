// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Attempt } from './attempt.ts';
import type { GradingContext } from './grading.ts';

/**
 * What a learner had already done, from the attempt log.
 *
 * Derived rather than stored, like everything else that feeds mastery, so a
 * change to what counts as prior experience re-reads history instead of
 * needing it to have been recorded differently at the time.
 */
export function gradingContext(
  attempts: readonly Attempt[],
  target: { readonly exerciseId: string; readonly skills: readonly string[] },
  skillsOf: (exerciseId: string) => readonly string[],
  before: string,
): GradingContext {
  const cutoff = Date.parse(before);
  const skills = new Set(target.skills);

  let priorAttemptsAtExercise = 0;
  let priorAttemptsAtSkill = 0;

  for (const attempt of attempts) {
    if (Date.parse(attempt.startedAt) >= cutoff) continue;

    if (attempt.exerciseId === target.exerciseId) {
      priorAttemptsAtExercise += 1;
      continue;
    }
    // A different exercise counts only if it trained one of the same skills;
    // otherwise it says nothing about whether this is familiar ground.
    if (skillsOf(attempt.exerciseId).some((skill) => skills.has(skill))) {
      priorAttemptsAtSkill += 1;
    }
  }

  return { priorAttemptsAtExercise, priorAttemptsAtSkill };
}
