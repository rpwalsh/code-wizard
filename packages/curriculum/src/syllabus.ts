// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillGraph, SkillId } from '@code-retrainer/core';
import type { Exercise } from '@code-retrainer/exercises';

/**
 * The planned course, from the first program to the last.
 *
 * Separate from the exercise catalog on purpose. The catalog is what
 * exists; the syllabus is what was intended, and the gap between them is the
 * only honest measure of how far the content has actually got. A README
 * claiming "200 lessons planned" is a sentence; this is a number that goes
 * down as work lands and that a test can shout about when the plan drifts out
 * of step with the skill graph.
 *
 * A lesson is a unit of study rather than a unit of work. It names what the
 * learner should be able to do afterwards and which skills that touches; the
 * exercises underneath it carry their own time allowances, scaled to their own
 * difficulty.
 */
export interface Lesson {
  /** Stable, ordered, and never reused: `py.001`. */
  readonly id: string;
  readonly title: string;
  /** What this lesson drills, in a sentence, for whoever writes the exercises. */
  readonly focus: string;
  readonly skills: readonly SkillId[];
  /** 1 (first program) to 5 (the last stretch). */
  readonly difficulty: number;
}

export interface SyllabusStage {
  readonly stage: string;
  readonly title: string;
  readonly lessons: readonly Lesson[];
}

export interface Syllabus {
  readonly stages: readonly SyllabusStage[];
}

export function allLessons(syllabus: Syllabus): readonly Lesson[] {
  return syllabus.stages.flatMap((stage) => stage.lessons);
}

export interface LessonProgress {
  readonly lesson: Lesson;
  readonly stage: string;
  /** Skills of this lesson that have at least one exercise. */
  readonly skillsCovered: number;
  /** The ones that do not, which is the list of what to write next. */
  readonly missingSkills: readonly SkillId[];
}

export interface SyllabusProgress {
  readonly total: number;
  /** Lessons with at least one exercise behind them. */
  readonly covered: number;
  readonly byStage: readonly {
    readonly stage: string;
    readonly title: string;
    readonly total: number;
    readonly covered: number;
  }[];
  /** Every lesson with nothing behind it yet, in course order. */
  readonly outstanding: readonly LessonProgress[];
}

/**
 * How much of the plan actually exists.
 *
 * Coverage is judged by skill rather than by a declared link from lesson to
 * exercise, so that content written for one lesson counts for every lesson it
 * genuinely serves — and so nobody can mark a lesson done by editing a list.
 *
 * A lesson counts only when *every* skill it names has something behind it.
 * Counting a lesson as done because one of its three skills is covered was the
 * first version of this, and it reported 37% written when ten exercises
 * existed. A progress number that flatters is worse than none: it is the thing
 * you would consult to decide whether you can stop.
 */
export function readSyllabusProgress(
  syllabus: Syllabus,
  exercises: readonly Exercise[],
): SyllabusProgress {
  const trained = new Map<SkillId, number>();
  for (const exercise of exercises) {
    for (const skill of exercise.skills) {
      trained.set(skill, (trained.get(skill) ?? 0) + 1);
    }
  }

  const outstanding: LessonProgress[] = [];
  const byStage: {
    stage: string;
    title: string;
    total: number;
    covered: number;
  }[] = [];
  let covered = 0;
  let total = 0;

  for (const stage of syllabus.stages) {
    let stageCovered = 0;

    for (const lesson of stage.lessons) {
      total += 1;
      const missingSkills = lesson.skills.filter((skill) => (trained.get(skill) ?? 0) === 0);

      if (missingSkills.length === 0) {
        covered += 1;
        stageCovered += 1;
      } else {
        outstanding.push({
          lesson,
          stage: stage.stage,
          skillsCovered: lesson.skills.length - missingSkills.length,
          missingSkills,
        });
      }
    }

    byStage.push({
      stage: stage.stage,
      title: stage.title,
      total: stage.lessons.length,
      covered: stageCovered,
    });
  }

  return { total, covered, byStage, outstanding };
}

export interface SyllabusIssue {
  readonly lessonId: string;
  readonly message: string;
}

/**
 * Ways the plan can be wrong on its own terms.
 *
 * Checked rather than trusted, because a syllabus is written once and then
 * consulted for months: a typo in a skill id would quietly mean a lesson can
 * never be marked covered, and nobody would notice until they wondered why the
 * number had stopped moving.
 */
export function validateSyllabus(syllabus: Syllabus, graph: SkillGraph): readonly SyllabusIssue[] {
  const issues: SyllabusIssue[] = [];
  const seen = new Set<string>();
  let previousId = '';

  for (const lesson of allLessons(syllabus)) {
    if (seen.has(lesson.id)) {
      issues.push({ lessonId: lesson.id, message: 'duplicate lesson id' });
    }
    seen.add(lesson.id);

    // Course order is the whole point of the ids; out of order means a lesson
    // was inserted without renumbering, and the sequence stops meaning anything.
    if (previousId && lesson.id <= previousId) {
      issues.push({ lessonId: lesson.id, message: `out of order after ${previousId}` });
    }
    previousId = lesson.id;

    if (lesson.skills.length === 0) {
      issues.push({ lessonId: lesson.id, message: 'names no skill' });
    }

    for (const skill of lesson.skills) {
      if (!graph.has(skill)) {
        issues.push({ lessonId: lesson.id, message: `unknown skill "${skill}"` });
      }
    }

    if (lesson.difficulty < 1 || lesson.difficulty > 5) {
      issues.push({ lessonId: lesson.id, message: `difficulty ${lesson.difficulty} out of range` });
    }
  }

  return issues;
}

/**
 * Lessons a learner could sensibly do next, in course order.
 *
 * The syllabus is a path rather than a menu, so this walks it from the start
 * and stops at the first lesson whose skills are not yet supported by content.
 * Someone who wants to jump ahead can still reach any exercise directly; this
 * is the answer to "what is next", not a gate.
 */
export function nextLessons(
  syllabus: Syllabus,
  exercises: readonly Exercise[],
  limit = 5,
): readonly Lesson[] {
  const trained = new Set<SkillId>();
  for (const exercise of exercises) {
    for (const skill of exercise.skills) trained.add(skill);
  }

  return allLessons(syllabus)
    .filter((lesson) => lesson.skills.some((skill) => trained.has(skill)))
    .slice(0, limit);
}
