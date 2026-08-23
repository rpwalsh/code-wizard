// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { makeMastery, masteryDimensions, SkillGraph } from '@code-retrainer/core';
import type { Exercise } from '@code-retrainer/exercises';
import { ExerciseCatalog } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import { recordEvent, startAttempt } from '@code-retrainer/learning';
import { describe, expect, it } from 'vitest';

import { buildSkillMap, findConstraints, readFluency, replayTrajectory } from './analytics.ts';

const NOW = new Date('2026-03-31T12:00:00.000Z');

/** Every dimension at the same value. */
function uniform(value: number) {
  return makeMastery(Object.fromEntries(masteryDimensions.map((dimension) => [dimension, value])));
}

const graph = SkillGraph.from([
  { id: 'core', name: 'Core syntax', category: 'Syntax', prerequisites: [], language: 'python' },
  {
    id: 'collections',
    name: 'Collections',
    category: 'Collections',
    prerequisites: ['core'],
    language: 'python',
  },
  {
    id: 'dict-lookup',
    name: 'Dictionary lookup',
    category: 'Collections',
    prerequisites: ['collections'],
    language: 'python',
  },
  {
    id: 'dict-mutation',
    name: 'Dictionary mutation',
    category: 'Collections',
    prerequisites: ['dict-lookup'],
    language: 'python',
  },
  {
    id: 'state',
    name: 'State modeling',
    category: 'Data Modeling',
    prerequisites: ['dict-mutation'],
    language: 'python',
  },
]);

function exercise(id: string, skills: string[]): Exercise {
  return {
    id,
    version: 1,
    language: 'python',
    title: id,
    kind: 'micro-problem',
    difficulty: 2,
    estimatedSeconds: 180,
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

const catalog = new ExerciseCatalog([
  exercise('ex.lookup', ['dict-lookup']),
  exercise('ex.state', ['state']),
]);

function solvedAttempt(id: string, exerciseId: string, daysAgo: number): Attempt {
  const startedAt = new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString();
  let attempt = startAttempt({
    id,
    exerciseId,
    exerciseVersion: 1,
    mode: 'fluency',
    startedAt,
  });
  attempt = recordEvent(attempt, {
    type: 'test',
    at: new Date(Date.parse(startedAt) + 60_000).toISOString(),
    passed: 3,
    failed: 0,
    errored: 0,
    green: true,
  });
  return attempt;
}

describe('trajectory', () => {
  it('produces one point per day across the window, inclusive', () => {
    const points = replayTrajectory([], catalog, { days: 30, now: NOW });
    expect(points).toHaveLength(31);
    expect(points.at(-1)?.date).toBe('2026-03-31');
  });

  it('stays at zero with no attempts', () => {
    const points = replayTrajectory([], catalog, { days: 7, now: NOW });
    expect(points.every((point) => point.score === 0)).toBe(true);
  });

  it('rises as attempts accumulate', () => {
    const attempts = [
      solvedAttempt('a', 'ex.lookup', 20),
      solvedAttempt('b', 'ex.lookup', 15),
      solvedAttempt('c', 'ex.lookup', 10),
      solvedAttempt('d', 'ex.lookup', 2),
    ];
    const points = replayTrajectory(attempts, catalog, { days: 30, now: NOW });

    expect(points[0]?.score).toBe(0);
    expect(points.at(-1)?.score).toBeGreaterThan(0);
    // Monotonic here because every attempt was a clean solve.
    for (let index = 1; index < points.length; index += 1) {
      expect(points[index]!.score).toBeGreaterThanOrEqual(points[index - 1]!.score);
    }
  });

  it('starts from where the learner already stood', () => {
    // Practice that happened before the window still counts toward the first
    // point, or the chart would claim they started from nothing.
    const attempts = [solvedAttempt('old', 'ex.lookup', 90)];
    const points = replayTrajectory(attempts, catalog, { days: 30, now: NOW });
    expect(points[0]?.score).toBeGreaterThan(0);
  });

  it('ignores attempts at exercises no longer in the catalog', () => {
    const attempts = [solvedAttempt('gone', 'ex.deleted', 5)];
    const points = replayTrajectory(attempts, catalog, { days: 30, now: NOW });
    expect(points.at(-1)?.score).toBe(0);
  });
});

describe('fluency reading', () => {
  it('reports no change from a standing start', () => {
    const trajectory = replayTrajectory([solvedAttempt('a', 'ex.lookup', 3)], catalog, {
      days: 30,
      now: NOW,
    });
    const reading = readFluency(new Map(), trajectory, 30);
    // The first measurement is not improvement.
    expect(reading.change).toBeNull();
  });

  it('counts only skills with evidence', () => {
    const reading = readFluency(
      new Map([
        [
          'measured',
          {
            skillId: 'measured',
            vector: uniform(0.5),
            observations: 3,
            lastPracticedAt: null,
          },
        ],
        [
          'seeded',
          {
            skillId: 'seeded',
            vector: uniform(0.5),
            observations: 0,
            lastPracticedAt: null,
          },
        ],
      ]),
      [],
      30,
    );

    expect(reading.measuredSkills).toBe(1);
    expect(reading.dimensions.recall).toBe(0.5);
  });
});

describe('skill map', () => {
  const map = buildSkillMap(graph, new Map(), new Map(), catalog);

  it('layers skills by their longest path from a root', () => {
    const depth = (id: string) => map.nodes.find((node) => node.skillId === id)?.depth;
    expect(depth('core')).toBe(0);
    expect(depth('collections')).toBe(1);
    expect(depth('dict-lookup')).toBe(2);
    expect(depth('state')).toBe(4);
    expect(map.maximumDepth).toBe(4);
  });

  it('carries one edge per prerequisite', () => {
    expect(map.edges).toContainEqual({ from: 'dict-mutation', to: 'state' });
    expect(map.edges).toHaveLength(4);
  });

  it('marks unpracticed skills as unmeasured rather than weak', () => {
    expect(map.nodes.every((node) => node.unmeasured)).toBe(true);
  });

  it('reports how many exercises train each skill', () => {
    const lookup = map.nodes.find((node) => node.skillId === 'dict-lookup');
    const core = map.nodes.find((node) => node.skillId === 'core');
    expect(lookup?.exerciseCount).toBe(1);
    expect(core?.exerciseCount).toBe(0);
  });
});

describe('constraints', () => {
  function mastery(entries: Record<string, number>) {
    return new Map(
      Object.entries(entries).map(([skillId, value]) => [
        skillId,
        {
          skillId,
          vector: uniform(value),
          observations: 4,
          lastPracticedAt: null,
        },
      ]),
    );
  }

  it('names the weakest prerequisite holding a skill back', () => {
    const found = findConstraints(
      graph,
      mastery({ core: 0.9, collections: 0.85, 'dict-lookup': 0.3, 'dict-mutation': 0.8 }),
      'state',
    );
    expect(found[0]?.skillId).toBe('dict-lookup');
  });

  it('walks the whole prerequisite closure, not just direct parents', () => {
    const found = findConstraints(graph, mastery({ core: 0.1 }), 'state');
    expect(found.map((entry) => entry.skillId)).toContain('core');
  });

  it('says nothing when every prerequisite is strong', () => {
    const strong = mastery({
      core: 0.95,
      collections: 0.95,
      'dict-lookup': 0.95,
      'dict-mutation': 0.95,
    });
    expect(findConstraints(graph, strong, 'state')).toEqual([]);
  });

  it('returns nothing for a skill outside the graph', () => {
    expect(findConstraints(graph, new Map(), 'nonexistent')).toEqual([]);
  });
});
