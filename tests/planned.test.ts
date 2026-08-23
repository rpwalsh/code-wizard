// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SkillGraph } from '@code-retrainer/core';
import { validateSyllabus } from '@code-retrainer/curriculum';
import { loadPlanned, loadSyllabus } from '@code-retrainer/exercises';
import { describe, expect, it } from 'vitest';

/**
 * The curricula that are designed and not yet runnable.
 *
 * A plan nobody checks decays faster than code, because nothing fails when it
 * rots. These are held to the same structural standard as the shipped
 * syllabus: real skill ids, an acyclic graph, contiguous numbering, and every
 * skill taught before it is depended on.
 *
 * What is deliberately *not* asserted is that any of them work, because none
 * of them do. That is the point of them being here.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'curricula');
const curricula = await loadPlanned(root);

describe('planned curricula', () => {
  it('are all loadable', () => {
    expect(curricula.length).toBeGreaterThan(0);
  });

  it('each say who they are for and what is missing', () => {
    // "Not done yet" without a reason is indistinguishable from forgotten.
    for (const curriculum of curricula) {
      expect(curriculum.summary.length, curriculum.id).toBeGreaterThan(40);
      expect(curriculum.blockedBy.length, curriculum.id).toBeGreaterThan(40);
    }
  });

  it('have acyclic skill graphs', () => {
    // SkillGraph.from throws on a cycle or a dangling prerequisite, so this
    // is the whole check.
    for (const curriculum of curricula) {
      expect(() => SkillGraph.from([...curriculum.skills]), curriculum.id).not.toThrow();
    }
  });

  it('name only skills that exist, in order, with sane difficulty', async () => {
    for (const curriculum of curricula) {
      const graph = SkillGraph.from([...curriculum.skills]);
      const syllabus = await loadSyllabus(curriculum.directory);
      expect(validateSyllabus(syllabus, graph), curriculum.id).toEqual([]);
    }
  });

  it('number their lessons contiguously from one', async () => {
    for (const curriculum of curricula) {
      const syllabus = await loadSyllabus(curriculum.directory);
      const ids = syllabus.stages.flatMap((stage) => stage.lessons).map((lesson) => lesson.id);
      const prefix = ids[0]?.split('.')[0];

      expect(prefix, curriculum.id).toBeTruthy();
      ids.forEach((id, index) => {
        expect(id, curriculum.id).toBe(`${prefix}.${String(index + 1).padStart(3, '0')}`);
      });
    }
  });

  it('teach every skill they depend on before depending on it', async () => {
    for (const curriculum of curricula) {
      const graph = SkillGraph.from([...curriculum.skills]);
      const syllabus = await loadSyllabus(curriculum.directory);
      const lessons = syllabus.stages.flatMap((stage) => stage.lessons);

      const firstTaught = new Map<string, number>();
      lessons.forEach((lesson, index) => {
        for (const skill of lesson.skills) {
          if (!firstTaught.has(skill)) firstTaught.set(skill, index);
        }
      });

      const late: string[] = [];
      for (const [skill, index] of firstTaught) {
        for (const prerequisite of graph.directPrerequisites(skill)) {
          const taught = firstTaught.get(prerequisite);
          if (taught !== undefined && taught > index) {
            late.push(
              `${skill} (lesson ${index + 1}) needs ${prerequisite} (lesson ${taught + 1})`,
            );
          }
        }
      }

      expect(late, curriculum.id).toEqual([]);
    }
  });

  it('do not claim a runtime', () => {
    // If one of these ever gains a runtime it moves to `languages/`, and this
    // test is what makes forgetting that step impossible to ignore.
    for (const curriculum of curricula) {
      expect(curriculum.directory.includes(`${path.sep}languages${path.sep}`)).toBe(false);
    }
  });
});
