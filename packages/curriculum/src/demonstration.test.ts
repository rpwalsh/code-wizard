// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { SkillGraph } from '@code-retrainer/core';
import type { Exercise } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import { abandonAttempt, recordEvent, startAttempt } from '@code-retrainer/learning';
import { describe, expect, it } from 'vitest';

import {
  creditDemonstration,
  creditedSkills,
  judgeDemonstration,
  planDemonstration,
} from './demonstration.ts';

const graph = SkillGraph.from([
  { id: 'syntax', name: 'Syntax', category: 'Syntax', prerequisites: [], language: 'python' },
  {
    id: 'dict',
    name: 'Dictionaries',
    category: 'Collections',
    prerequisites: ['syntax'],
    language: 'python',
  },
  {
    id: 'lookup',
    name: 'Safe lookup',
    category: 'Collections',
    prerequisites: ['dict'],
    language: 'python',
  },
]);

function exercise(id: string, skills: string[], difficulty: number, seconds = 120): Exercise {
  return {
    id,
    version: 1,
    language: 'python',
    title: id,
    kind: 'micro-problem',
    difficulty,
    estimatedSeconds: seconds,
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

const exercises = [
  exercise('easy', ['lookup'], 1),
  exercise('hard', ['lookup'], 4),
  exercise('other', ['dict'], 5),
];

const START = '2026-04-01T10:00:00.000Z';

function at(seconds: number): string {
  return new Date(Date.parse(START) + seconds * 1000).toISOString();
}

function attempt(options: { seconds: number; solved?: boolean; hint?: boolean }): Attempt {
  const { seconds, solved = true, hint = false } = options;
  let current = startAttempt({
    id: 'demo',
    exerciseId: 'hard',
    exerciseVersion: 1,
    mode: 'blank-page',
    startedAt: START,
  });

  if (hint) current = recordEvent(current, { type: 'hint', at: at(5), level: 'conceptual' });

  current = recordEvent(current, {
    type: 'test',
    at: at(seconds),
    passed: solved ? 3 : 0,
    failed: solved ? 0 : 3,
    errored: 0,
    green: solved,
  });

  return solved ? current : abandonAttempt(current, at(seconds + 5));
}

describe('planning a demonstration', () => {
  it('picks the hardest exercise for the skill', () => {
    // A demonstration anyone could pass demonstrates nothing, and the claim
    // being tested is a strong one.
    expect(planDemonstration('lookup', exercises)?.exerciseId).toBe('hard');
  });

  it('withdraws the starter code', () => {
    // Completing a skeleton would show recognition, which is exactly the thing
    // an experienced programmer already has.
    expect(planDemonstration('lookup', exercises)?.mode).toBe('blank-page');
  });

  it('allows more time than the estimate, not less', () => {
    const plan = planDemonstration('lookup', exercises);
    expect(plan?.budgetSeconds).toBeGreaterThan(120);
  });

  it('refuses to use an exercise the learner has already seen', () => {
    // Demonstrating on a familiar exercise demonstrates that it is familiar.
    const plan = planDemonstration('lookup', exercises, {
      attemptedExerciseIds: new Set(['hard']),
    });
    expect(plan?.exerciseId).toBe('easy');
  });

  it('says nothing rather than inventing a weaker test', () => {
    const plan = planDemonstration('lookup', exercises, {
      attemptedExerciseIds: new Set(['hard', 'easy']),
    });
    expect(plan).toBeNull();
  });

  it('has nothing to offer for a skill no exercise trains', () => {
    expect(planDemonstration('syntax', exercises)).toBeNull();
  });
});

describe('judging a demonstration', () => {
  const plan = planDemonstration('lookup', exercises)!;

  it('passes a clean, quick, unaided solve', () => {
    const result = judgeDemonstration(attempt({ seconds: 90 }), plan, graph);
    expect(result.passed).toBe(true);
    expect(result.credited).toContain('lookup');
  });

  it('credits everything the skill rests on', () => {
    // The ladder below something you have just demonstrated is not worth
    // anyone's evening.
    const result = judgeDemonstration(attempt({ seconds: 90 }), plan, graph);
    expect(result.credited).toEqual(expect.arrayContaining(['lookup', 'dict', 'syntax']));
  });

  it('refuses a solve that needed help', () => {
    const result = judgeDemonstration(attempt({ seconds: 90, hint: true }), plan, graph);
    expect(result.passed).toBe(false);
    expect(result.credited).toEqual([]);
    expect(result.reason).toMatch(/not the claim you made/);
  });

  it('refuses a solve that took too long', () => {
    // Knowing it and having it to hand are different things, and the second is
    // the entire subject matter.
    const result = judgeDemonstration(attempt({ seconds: 900 }), plan, graph);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/budget/);
  });

  it('treats a failure as an answer rather than a penalty', () => {
    const result = judgeDemonstration(attempt({ seconds: 60, solved: false }), plan, graph);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/Nothing lost/);
  });
});

describe('crediting a demonstration', () => {
  const plan = planDemonstration('lookup', exercises)!;

  it('marks the demonstrated skill as measured', () => {
    const credited = creditDemonstration(plan, graph, at(90));
    const direct = credited.find((record) => record.skillId === 'lookup');

    expect(direct?.observations).toBe(1);
    expect(direct?.lastPracticedAt).toBe(at(90));
    expect(direct?.vector.independence).toBeGreaterThan(0.8);
  });

  it('does not claim the prerequisites were measured', () => {
    // They were shown by implication. Counting them as evidence would put
    // skills nobody demonstrated into the headline fluency reading.
    const credited = creditDemonstration(plan, graph, at(90));
    const implied = credited.filter((record) => record.skillId !== 'lookup');

    expect(implied.length).toBeGreaterThan(0);
    for (const record of implied) {
      expect(record.observations).toBe(0);
      expect(record.lastPracticedAt).toBeNull();
    }
  });

  it('credits prerequisites lower than the thing actually shown', () => {
    const credited = creditDemonstration(plan, graph, at(90));
    const direct = credited.find((record) => record.skillId === 'lookup');
    const implied = credited.find((record) => record.skillId === 'syntax');

    expect(implied?.vector.recall).toBeLessThan(direct?.vector.recall ?? 0);
    expect(implied?.vector.independence).toBe(0);
  });

  it('lists a skill outside the graph as itself and nothing more', () => {
    expect(creditedSkills('unknown', graph)).toEqual(['unknown']);
  });
});
