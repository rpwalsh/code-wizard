// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { validateSyllabus } from '@code-wizard/curriculum';
import { loadSyllabus } from '@code-wizard/exercises';
import { pythonCurriculumDir, pythonSkillGraph } from '@code-wizard/python';
import { describe, expect, it } from 'vitest';

/**
 * The real plan, against the real skill graph.
 *
 * The unit tests prove the checker works; this proves the thing it checks is
 * actually sound. A plan written once and consulted for months rots quietly:
 * a renamed skill leaves a lesson permanently uncoverable, and the only
 * symptom is a progress number that stops moving for reasons nobody
 * investigates.
 */
describe('the shipped syllabus', () => {
  it('loads', async () => {
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    expect(syllabus.stages.length).toBeGreaterThan(0);
  });

  it('is internally sound and names only skills that exist', async () => {
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    expect(validateSyllabus(syllabus, pythonSkillGraph)).toEqual([]);
  });

  it('runs from the first program to the last without a gap in the numbering', async () => {
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    const ids = syllabus.stages.flatMap((stage) => stage.lessons).map((lesson) => lesson.id);

    expect(ids[0]).toBe('py.001');
    ids.forEach((id, index) => {
      expect(id).toBe(`py.${String(index + 1).padStart(3, '0')}`);
    });
  });

  it('gets harder', async () => {
    // Not monotonically — a stage may open with something easy — but the last
    // stage must be harder than the first, or the ordering is decorative.
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    const first = syllabus.stages[0]!;
    const last = syllabus.stages.at(-1)!;

    expect(mean(last.lessons.map((lesson) => lesson.difficulty))).toBeGreaterThan(
      mean(first.lessons.map((lesson) => lesson.difficulty)),
    );
  });

  it('reaches the skills it was written to reach', async () => {
    // The whole point of the arc. If these fall out of the plan, the plan is
    // no longer the one that was agreed.
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    const skills = new Set(
      syllabus.stages.flatMap((stage) => stage.lessons).flatMap((lesson) => lesson.skills),
    );

    for (const destination of [
      'python.algorithms.traversal',
      'python.algorithms.shortest-path',
      'python.numerical.pagerank',
    ]) {
      expect(skills.has(destination), `syllabus never reaches ${destination}`).toBe(true);
    }
  });

  it('teaches every skill it depends on before depending on it', async () => {
    // A lesson that needs a skill first introduced twenty lessons later is a
    // wall the learner hits with no way through, and it is invisible in the
    // file because both lines look fine on their own.
    const syllabus = await loadSyllabus(pythonCurriculumDir);
    const lessons = syllabus.stages.flatMap((stage) => stage.lessons);

    const firstTaught = new Map<string, number>();
    lessons.forEach((lesson, index) => {
      for (const skill of lesson.skills) {
        if (!firstTaught.has(skill)) firstTaught.set(skill, index);
      }
    });

    const late: string[] = [];
    for (const [skill, index] of firstTaught) {
      for (const prerequisite of pythonSkillGraph.directPrerequisites(skill)) {
        const taught = firstTaught.get(prerequisite);
        if (taught !== undefined && taught > index) {
          late.push(`${skill} (lesson ${index + 1}) needs ${prerequisite} (lesson ${taught + 1})`);
        }
      }
    }

    expect(late).toEqual([]);
  });
});

function mean(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
