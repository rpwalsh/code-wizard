// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MasteryDimension, MasteryVector, SkillId } from '@code-wizard/core';
import { clamp01, makeMastery } from '@code-wizard/core';

import type { ActivityGrade } from './grading.ts';
import type { Activity } from './model.ts';
import { dimensionsByKind } from './model.ts';

/**
 * One graded observation, ready to fold into a skill's mastery.
 *
 * Shaped like the evidence an exercise attempt produces, so the projection
 * that builds mastery does not need to know which kind of practice it came
 * from — but capped so that it can never claim what it did not measure.
 */
export interface ActivityEvidence {
  readonly skillId: SkillId;
  readonly vector: MasteryVector;
  readonly correct: boolean;
  readonly at: string;
}

/**
 * The most any activity can contribute to a single dimension.
 *
 * Not one. A learner who answers every multiple-choice question in the
 * curriculum correctly has demonstrated that they recognize these ideas, and
 * this ceiling is the sentence "recognizes it, cannot yet be shown to produce
 * it" written as a number. Without it, a language with a hundred activities
 * and no runtime would report full mastery while nobody had ever compiled a
 * line of it — which is exactly the flattering, useless progress bar this
 * product exists to replace.
 *
 * Reaching past it requires writing code that passes tests. There is no other
 * route, and `activitiesCannotReachFluency` in the tests is what keeps it that
 * way.
 */
export const ACTIVITY_CEILING = 0.65;

/**
 * Harder questions are worth more, but the curve is shallow.
 *
 * A difficulty-5 question is worth about a third more than a difficulty-1 one,
 * not five times as much, because difficulty is an author's estimate and a
 * steep curve would turn that estimate into the dominant term in the score.
 */
function weightFor(difficulty: number): number {
  return 0.75 + clamp01((difficulty - 1) / 4) * 0.25;
}

/**
 * Turn a graded answer into evidence about each skill it touched.
 *
 * A wrong answer is evidence too, and it is recorded rather than discarded —
 * a skill someone keeps getting wrong should move down, or the map only ever
 * tells a story of progress. Both directions are folded by the same mastery
 * projection that handles exercise attempts.
 */
export function evidenceFrom(
  activity: Activity,
  result: ActivityGrade,
  at: string,
): readonly ActivityEvidence[] {
  const dimensions = dimensionsByKind[activity.kind];
  const value = result.correct ? ACTIVITY_CEILING * weightFor(activity.difficulty) : 0;

  return activity.skills.map((skillId) => ({
    skillId,
    vector: makeMastery(Object.fromEntries(dimensions.map((d) => [d, value]))),
    correct: result.correct,
    at,
  }));
}

/**
 * Dimensions no activity may ever touch.
 *
 * Stated as data so the rule is checkable rather than remembered. These are
 * the whole subject matter: building something, carrying it somewhere new,
 * doing it unaided. Recognizing a correct answer among four is not evidence
 * about any of them.
 */
export const unreachableByActivities: readonly MasteryDimension[] = Object.freeze([
  'application',
  'composition',
  'transfer',
  'independence',
  'speed',
  'retention',
]);
