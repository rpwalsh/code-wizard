import { SkillGraph } from '@code-retrainer/core';
import type { Exercise } from '@code-retrainer/exercises';
import { describe, expect, it } from 'vitest';

import type { Syllabus } from './syllabus.ts';
import { allLessons, readSyllabusProgress, validateSyllabus } from './syllabus.ts';

const graph = SkillGraph.from([
  { id: 'a', name: 'A', category: 'X', prerequisites: [], language: 'python' },
  { id: 'b', name: 'B', category: 'X', prerequisites: ['a'], language: 'python' },
  { id: 'c', name: 'C', category: 'X', prerequisites: ['b'], language: 'python' },
]);

function lesson(id: string, skills: string[], difficulty = 1) {
  return { id, title: id, focus: 'something', skills, difficulty };
}

const syllabus: Syllabus = {
  stages: [
    { stage: 'one', title: 'One', lessons: [lesson('py.001', ['a']), lesson('py.002', ['b'])] },
    { stage: 'two', title: 'Two', lessons: [lesson('py.003', ['b', 'c'])] },
  ],
};

function exercise(id: string, skills: string[]): Exercise {
  return {
    id,
    version: 1,
    language: 'python',
    title: id,
    kind: 'micro-problem',
    difficulty: 1,
    estimatedSeconds: 60,
    skills,
    prerequisites: [],
    learningObjectives: ['x'],
    prompt: 'x',
    starter: { files: [{ path: 'main.py', contents: '' }] },
    solution: { files: [{ path: 'main.py', contents: '' }] },
    tests: [{ path: 'tests/test_a.py', visibility: 'visible', contents: '' }],
    hints: [],
    source: { directory: '/tmp' },
  };
}

describe('reading the syllabus', () => {
  it('flattens the stages in course order', () => {
    expect(allLessons(syllabus).map((entry) => entry.id)).toEqual(['py.001', 'py.002', 'py.003']);
  });
});

describe('progress against the plan', () => {
  it('counts nothing written as nothing written', () => {
    const progress = readSyllabusProgress(syllabus, []);
    expect(progress.total).toBe(3);
    expect(progress.covered).toBe(0);
    expect(progress.outstanding).toHaveLength(3);
  });

  it('requires every skill of a lesson, not just one', () => {
    // The flattering version of this counted a three-skill lesson as done
    // because one skill had an exercise. A progress number you would consult
    // to decide whether you can stop must not round in its own favour.
    const progress = readSyllabusProgress(syllabus, [exercise('e1', ['b'])]);

    expect(progress.covered).toBe(1);
    const partial = progress.outstanding.find((entry) => entry.lesson.id === 'py.003');
    expect(partial?.skillsCovered).toBe(1);
    expect(partial?.missingSkills).toEqual(['c']);
  });

  it('names exactly what is missing, so the next job is obvious', () => {
    const progress = readSyllabusProgress(syllabus, []);
    expect(progress.outstanding[0]?.missingSkills).toEqual(['a']);
  });

  it('counts a lesson once however many exercises train it', () => {
    const progress = readSyllabusProgress(syllabus, [
      exercise('e1', ['a']),
      exercise('e2', ['a']),
      exercise('e3', ['a']),
    ]);
    expect(progress.covered).toBe(1);
  });

  it('reports each stage separately, so the shape of the gap is visible', () => {
    const progress = readSyllabusProgress(syllabus, [exercise('e1', ['a'])]);
    expect(progress.byStage).toEqual([
      { stage: 'one', title: 'One', total: 2, covered: 1 },
      { stage: 'two', title: 'Two', total: 1, covered: 0 },
    ]);
  });
});

describe('validating the plan itself', () => {
  it('accepts a sound syllabus', () => {
    expect(validateSyllabus(syllabus, graph)).toEqual([]);
  });

  it('catches a skill that does not exist', () => {
    // A typo here would mean a lesson could never be marked covered, and
    // nobody would notice until they wondered why the number had stopped.
    const broken: Syllabus = {
      stages: [{ stage: 'one', title: 'One', lessons: [lesson('py.001', ['typo'])] }],
    };
    expect(validateSyllabus(broken, graph)[0]?.message).toMatch(/unknown skill/);
  });

  it('catches a duplicate id', () => {
    const broken: Syllabus = {
      stages: [
        { stage: 'one', title: 'One', lessons: [lesson('py.001', ['a'])] },
        { stage: 'two', title: 'Two', lessons: [lesson('py.001', ['b'])] },
      ],
    };
    expect(validateSyllabus(broken, graph).map((issue) => issue.message)).toContain(
      'duplicate lesson id',
    );
  });

  it('catches a lesson inserted without renumbering', () => {
    // Course order is what the ids are for; out of order and the sequence
    // stops meaning anything.
    const broken: Syllabus = {
      stages: [
        {
          stage: 'one',
          title: 'One',
          lessons: [lesson('py.005', ['a']), lesson('py.002', ['b'])],
        },
      ],
    };
    expect(validateSyllabus(broken, graph)[0]?.message).toMatch(/out of order/);
  });

  it('catches a difficulty outside the scale', () => {
    const broken: Syllabus = {
      stages: [{ stage: 'one', title: 'One', lessons: [lesson('py.001', ['a'], 9)] }],
    };
    expect(validateSyllabus(broken, graph)[0]?.message).toMatch(/difficulty/);
  });
});
