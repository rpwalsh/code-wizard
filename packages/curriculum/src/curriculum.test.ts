import type { Skill, SkillMastery } from '@forge/core';
import { isClaimable, makeMastery, masteryDimensions, SkillGraph } from '@forge/core';
import type { Exercise, ExerciseKind } from '@forge/exercises';
import type { MasteryObservation } from '@forge/learning';
import { describe, expect, it } from 'vitest';

import type { ExerciseHistory, LearnerState } from './recommender.ts';
import { emptyHistory, recommend } from './recommender.ts';
import type { ReviewState } from './scheduler.ts';
import { beginReview, dueForReview, isDue, REVIEW_LADDER, scheduleNext } from './scheduler.ts';
import { experienceLevels, planDiagnostic, seedFromExperience } from './diagnostic.ts';
import { groupBySlot, planSession } from './session.ts';

const NOW = new Date('2026-03-10T09:00:00.000Z');

function iso(daysFromNow: number): string {
  return new Date(NOW.getTime() + daysFromNow * 86_400_000).toISOString();
}

function observation(recall: number, at = iso(0)): MasteryObservation {
  return {
    skillId: 's',
    exerciseId: 'e',
    at,
    weight: 1,
    evidence: { recall, application: recall > 0 ? 1 : 0 },
    reasons: [],
  };
}

function skill(id: string, prerequisites: string[] = []): Skill {
  return { id, name: id, category: 'Test', prerequisites, language: 'python' };
}

function exercise(
  id: string,
  overrides: Partial<
    Pick<Exercise, 'skills' | 'prerequisites' | 'difficulty' | 'kind' | 'estimatedSeconds'>
  > = {},
): Exercise {
  return {
    id,
    version: 1,
    language: 'python',
    title: id,
    kind: overrides.kind ?? 'micro-problem',
    difficulty: overrides.difficulty ?? 2,
    estimatedSeconds: overrides.estimatedSeconds ?? 180,
    skills: overrides.skills ?? ['dict'],
    prerequisites: overrides.prerequisites ?? [],
    learningObjectives: ['x'],
    prompt: 'x',
    starter: { files: [{ path: 'main.py', contents: '' }] },
    solution: { files: [{ path: 'main.py', contents: '' }] },
    tests: [{ path: 'tests/test_a.py', visibility: 'visible', contents: '' }],
    hints: [],
    source: { directory: '/tmp' },
  };
}

function mastery(skillId: string, value: number): SkillMastery {
  return {
    skillId,
    observations: 5,
    lastPracticedAt: iso(-5),
    vector: makeMastery({
      knowledge: value,
      recognition: value,
      recall: value,
      application: value,
      composition: value,
      speed: value,
      retention: value,
      independence: value,
    }),
  };
}

function learnerState(overrides: Partial<LearnerState> = {}): LearnerState {
  return {
    mastery: new Map(),
    reviews: new Map(),
    attempts: new Map(),
    now: NOW,
    ...overrides,
  };
}

describe('spaced repetition', () => {
  it('schedules the first review for the next day', () => {
    const decision = scheduleNext(null, 's', observation(1));
    expect(decision.state.intervalDays).toBe(REVIEW_LADDER[0]);
    expect(decision.state.dueAt).toBe(iso(1));
  });

  it('walks up the ladder on clean recalls', () => {
    let state: ReviewState | null = null;
    const intervals: number[] = [];
    for (let day = 0; day < 6; day += 1) {
      const decision = scheduleNext(state, 's', observation(1, iso(day)));
      state = decision.state;
      intervals.push(state.intervalDays);
    }
    // The §21 ladder: 1, 3, 7, 14, 30, 60.
    expect(intervals).toEqual([1, 3, 7, 14, 30, 60]);
  });

  it('holds the interval when recall was shaky', () => {
    const first = scheduleNext(null, 's', observation(1, iso(0))).state;
    const second = scheduleNext(first, 's', observation(1, iso(1))).state;
    expect(second.intervalDays).toBe(3);

    const held = scheduleNext(second, 's', observation(0.5, iso(4)));
    expect(held.state.intervalDays).toBe(3);
    expect(held.state.streak).toBe(second.streak);
    expect(held.reason).toMatch(/holds at 3 days/);
  });

  it('resets to one day and counts a lapse when recall fails', () => {
    let state = scheduleNext(null, 's', observation(1, iso(0))).state;
    for (let day = 1; day < 4; day += 1) {
      state = scheduleNext(state, 's', observation(1, iso(day))).state;
    }
    expect(state.intervalDays).toBeGreaterThan(3);

    const lapsed = scheduleNext(state, 's', observation(0, iso(20)));
    expect(lapsed.state.intervalDays).toBe(1);
    expect(lapsed.state.streak).toBe(0);
    expect(lapsed.state.lapses).toBe(1);
    expect(lapsed.reason).toMatch(/resets/);
  });

  it('caps the interval', () => {
    let state = scheduleNext(null, 's', observation(1, iso(0))).state;
    for (let round = 0; round < 20; round += 1) {
      state = scheduleNext(state, 's', observation(1, iso(round + 1))).state;
    }
    expect(state.intervalDays).toBeLessThanOrEqual(180);
  });

  it('reports due skills, most overdue first', () => {
    const states: ReviewState[] = [
      { ...beginReview('a', iso(-10)), dueAt: iso(-1) },
      { ...beginReview('b', iso(-30)), dueAt: iso(-20) },
      { ...beginReview('c', iso(0)), dueAt: iso(5) },
    ];
    const due = dueForReview(states, NOW);
    expect(due.map((state) => state.skillId)).toEqual(['b', 'a']);
    expect(isDue(states[2]!, NOW)).toBe(false);
  });
});

describe('recommendation', () => {
  const graph = SkillGraph.from([
    skill('dict'),
    skill('dict-mutation', ['dict']),
    skill('classes', ['dict-mutation']),
  ]);

  it('blocks an exercise whose prerequisites are not yet strong enough', () => {
    const result = recommend([exercise('e1', { prerequisites: ['dict'] })], graph, learnerState());
    expect(result.recommendations).toHaveLength(0);
    expect(result.blocked[0]?.missing).toEqual(['dict']);
  });

  it('unlocks it once the prerequisite is strong enough', () => {
    const result = recommend(
      [exercise('e1', { prerequisites: ['dict'] })],
      graph,
      learnerState({ mastery: new Map([['dict', mastery('dict', 0.8)]]) }),
    );
    expect(result.recommendations).toHaveLength(1);
    expect(result.blocked).toHaveLength(0);
  });

  it('does not block on a prerequisite that is missing from the graph', () => {
    // That is a content bug for the validator to catch, not a wall for the learner.
    const result = recommend(
      [exercise('e1', { prerequisites: ['does-not-exist'] })],
      graph,
      learnerState(),
    );
    expect(result.recommendations).toHaveLength(1);
  });

  it('puts a due review above an untouched exercise', () => {
    const due: ReviewState = { ...beginReview('dict', iso(-10)), dueAt: iso(-3) };
    const result = recommend(
      [exercise('review-me', { skills: ['dict'] }), exercise('brand-new', { skills: ['classes'] })],
      graph,
      learnerState({
        reviews: new Map([['dict', due]]),
        attempts: new Map([['review-me', { ...emptyHistory, attempts: 2, solvedAttempts: 2 }]]),
      }),
    );
    expect(result.recommendations[0]?.exercise.id).toBe('review-me');
  });

  it('prioritises the weaker of two skills', () => {
    const result = recommend(
      [exercise('weak', { skills: ['dict'] }), exercise('strong', { skills: ['classes'] })],
      graph,
      learnerState({
        mastery: new Map([
          ['dict', mastery('dict', 0.2)],
          ['classes', mastery('classes', 0.65)],
        ]),
      }),
    );
    expect(result.recommendations[0]?.exercise.id).toBe('weak');
  });

  it('raises an exercise the learner keeps failing', () => {
    const failing: ExerciseHistory = {
      ...emptyHistory,
      attempts: 3,
      solvedAttempts: 0,
      recentFailures: 3,
      lastAttemptAt: iso(-2),
    };
    const result = recommend(
      [exercise('hard', { skills: ['dict'] }), exercise('other', { skills: ['dict'] })],
      graph,
      learnerState({ attempts: new Map([['hard', failing]]) }),
    );
    expect(result.recommendations[0]?.exercise.id).toBe('hard');
    expect(result.recommendations[0]?.reason).toMatch(/failed 3 recent attempts/);
  });

  it('demotes something already solved independently and not due', () => {
    const solved: ExerciseHistory = {
      ...emptyHistory,
      attempts: 3,
      solvedAttempts: 3,
      lastWasIndependent: true,
      lastAttemptAt: iso(-30),
    };
    const result = recommend(
      [exercise('done', { skills: ['dict'] }), exercise('fresh', { skills: ['dict'] })],
      graph,
      learnerState({ attempts: new Map([['done', solved]]) }),
    );
    expect(result.recommendations[0]?.exercise.id).toBe('fresh');
  });

  it('applies a cooldown to something attempted minutes ago', () => {
    const justNow: ExerciseHistory = {
      ...emptyHistory,
      attempts: 1,
      lastAttemptAt: new Date(NOW.getTime() - 30 * 60_000).toISOString(),
    };
    const result = recommend(
      [exercise('just-did-it', { skills: ['dict'] }), exercise('other', { skills: ['dict'] })],
      graph,
      learnerState({ attempts: new Map([['just-did-it', justNow]]) }),
    );
    expect(result.recommendations[0]?.exercise.id).toBe('other');
  });

  it('prefers a difficulty near the learner level over one far above it', () => {
    const state = learnerState({ mastery: new Map([['dict', mastery('dict', 0.25)]]) });
    const result = recommend(
      [
        exercise('too-hard', { skills: ['dict'], difficulty: 5 }),
        exercise('just-right', { skills: ['dict'], difficulty: 2 }),
      ],
      graph,
      state,
    );
    expect(result.recommendations[0]?.exercise.id).toBe('just-right');
  });

  it('shows its arithmetic', () => {
    const result = recommend([exercise('e1', { skills: ['dict'] })], graph, learnerState());
    const first = result.recommendations[0]!;
    const summed = first.factors.reduce((total, factor) => total + factor.delta, 0);
    expect(first.score).toBe(Math.round(summed));
    expect(first.factors.length).toBeGreaterThan(1);
  });

  it('is deterministic and stable for equal scores', () => {
    const candidates = [exercise('b'), exercise('a'), exercise('c')];
    const first = recommend(candidates, graph, learnerState()).recommendations;
    const second = recommend([...candidates].reverse(), graph, learnerState()).recommendations;
    expect(first.map((r) => r.exercise.id)).toEqual(second.map((r) => r.exercise.id));
  });

  it('honours a limit', () => {
    const result = recommend([exercise('a'), exercise('b'), exercise('c')], graph, learnerState(), {
      limit: 2,
    });
    expect(result.recommendations).toHaveLength(2);
  });
});

describe('session planning', () => {
  const graph = SkillGraph.from([skill('dict')]);

  function recommendationsFor(kinds: [string, ExerciseKind][]) {
    return recommend(
      kinds.map(([id, kind]) => exercise(id, { kind })),
      graph,
      learnerState(),
    ).recommendations;
  }

  it('fills the §50 shape', () => {
    const plan = planSession(
      recommendationsFor([
        ['drill-1', 'syntax-drill'],
        ['drill-2', 'syntax-drill'],
        ['micro-1', 'micro-problem'],
        ['micro-2', 'micro-problem'],
        ['micro-3', 'micro-problem'],
        ['review-1', 'completion'],
        ['bug-1', 'bug-fix'],
        ['system-1', 'stateful-problem'],
      ]),
    );

    const counts = Object.fromEntries(
      groupBySlot(plan).map((group) => [group.slot, group.items.length]),
    );
    expect(counts.recall).toBe(5);
    expect(counts.focused).toBe(1);
    expect(counts.system).toBe(1);
  });

  it('never schedules the same exercise twice', () => {
    const plan = planSession(
      recommendationsFor([
        ['micro-1', 'micro-problem'],
        ['system-1', 'stateful-problem'],
      ]),
    );
    const ids = plan.items.map((item) => item.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports the slots it could not fill', () => {
    const plan = planSession(recommendationsFor([['drill-1', 'syntax-drill']]));
    const gapSlots = plan.gaps.map((gap) => gap.slot);
    expect(gapSlots).toContain('focused');
    expect(gapSlots).toContain('system');
    expect(plan.gaps.find((gap) => gap.slot === 'focused')?.reason).toMatch(/No focused problem/i);
  });

  it('stays inside the time budget', () => {
    const long = recommend(
      [
        exercise('a', { kind: 'syntax-drill', estimatedSeconds: 600 }),
        exercise('b', { kind: 'syntax-drill', estimatedSeconds: 600 }),
        exercise('c', { kind: 'syntax-drill', estimatedSeconds: 600 }),
      ],
      graph,
      learnerState(),
    ).recommendations;

    const plan = planSession(long, { timeBudgetSeconds: 1300 });
    expect(plan.estimatedSeconds).toBeLessThanOrEqual(1300);
    expect(plan.items).toHaveLength(2);
  });

  it('sums the estimated time', () => {
    const plan = planSession(
      recommendationsFor([
        ['a', 'syntax-drill'],
        ['b', 'micro-problem'],
      ]),
    );
    expect(plan.estimatedSeconds).toBe(360);
  });

  it('does not put a progressive stage in a recall slot', () => {
    const plan = planSession(recommendationsFor([['stage', 'progressive-stage']]));
    expect(plan.items.every((item) => item.slot === 'system')).toBe(true);
  });

  it('fills the review slot only with exercises whose skills are due', () => {
    const recommendations = recommend(
      [
        exercise('due-one', { kind: 'micro-problem', skills: ['dict'] }),
        exercise('not-due', { kind: 'micro-problem', skills: ['other'] }),
      ],
      graph,
      learnerState(),
    ).recommendations;

    const plan = planSession(recommendations, {
      shape: { recall: 0, review: 1, focused: 0, system: 0 },
      dueSkills: new Set(['dict']),
    });
    expect(plan.items.map((item) => item.exercise.id)).toEqual(['due-one']);
  });

  it('leaves the review slot empty when nothing is due', () => {
    const plan = planSession(recommendationsFor([['micro-1', 'micro-problem']]), {
      shape: { recall: 0, review: 2, focused: 0, system: 0 },
    });
    expect(plan.items).toHaveLength(0);
    expect(plan.gaps[0]?.slot).toBe('review');
  });

  it('does not let the review slot steal an exercise a narrow slot needs', () => {
    // bug-fix is the only candidate that can fill `focused`, and it is also
    // review-eligible; filling in display order would misplace it.
    const recommendations = recommend(
      [
        exercise('bug', { kind: 'bug-fix', skills: ['dict'] }),
        exercise('micro', { kind: 'micro-problem', skills: ['dict'] }),
      ],
      graph,
      learnerState(),
    ).recommendations;

    const plan = planSession(recommendations, {
      shape: { recall: 0, review: 1, focused: 1, system: 0 },
      dueSkills: new Set(['dict']),
    });
    expect(plan.items.find((item) => item.slot === 'focused')?.exercise.id).toBe('bug');
    expect(plan.items.find((item) => item.slot === 'review')?.exercise.id).toBe('micro');
  });

  it('presents items in display order even though it fills in another', () => {
    const recommendations = recommend(
      [
        exercise('drill', { kind: 'syntax-drill', skills: ['dict'] }),
        exercise('system', { kind: 'stateful-problem', skills: ['dict'] }),
      ],
      graph,
      learnerState(),
    ).recommendations;

    const plan = planSession(recommendations, {
      shape: { recall: 1, review: 0, focused: 0, system: 1 },
    });
    expect(plan.items.map((item) => item.slot)).toEqual(['recall', 'system']);
  });

  it('accepts a custom shape', () => {
    const plan = planSession(
      recommendationsFor([
        ['a', 'syntax-drill'],
        ['b', 'syntax-drill'],
        ['c', 'syntax-drill'],
      ]),
      { shape: { recall: 2, review: 0, focused: 0, system: 0 } },
    );
    expect(plan.items).toHaveLength(2);
    expect(plan.gaps).toHaveLength(0);
  });
});

describe('onboarding', () => {
  it('seeds only the dimensions a claim can be evidence for', () => {
    // Saying you know the language is evidence about knowledge. It is not
    // evidence that you can produce it from an empty editor, find a fault in
    // it, or carry it somewhere new — that is the subject matter, and it
    // starts at zero however senior the learner is.
    for (const level of experienceLevels) {
      for (const mastery of seedFromExperience(graph, level, { at: iso(0) }).values()) {
        for (const dimension of masteryDimensions) {
          if (isClaimable(dimension)) continue;
          expect(mastery.vector[dimension]).toBe(0);
        }
        // A prior is a starting point, not evidence.
        expect(mastery.observations).toBe(0);
      }
    }
  });

  const graph = SkillGraph.from([
    skill('dict'),
    skill('dict-mutation', ['dict']),
    skill('classes', ['dict-mutation']),
  ]);

  it('gives an experienced programmer enough prior to unlock the graph', () => {
    const seeded = seedFromExperience(graph, 'new-to-language', { at: iso(0) });
    const result = recommend(
      [exercise('e1', { prerequisites: ['dict'] })],
      graph,
      learnerState({ mastery: seeded }),
    );
    expect(result.recommendations).toHaveLength(1);
  });

  it('leaves a true beginner gated', () => {
    const seeded = seedFromExperience(graph, 'new-to-programming', { at: iso(0) });
    const result = recommend(
      [exercise('e1', { prerequisites: ['dict'] })],
      graph,
      learnerState({ mastery: seeded }),
    );
    expect(result.blocked).toHaveLength(1);
  });

  it('does seed the dimensions a claim is evidence for', () => {
    const seeded = seedFromExperience(graph, 'working-knowledge', { at: iso(0) });
    expect(seeded.get('dict')!.vector.knowledge).toBeGreaterThan(0);
  });

  it('does not record a prior as practice', () => {
    const seeded = seedFromExperience(graph, 'rusty', { at: iso(0) });
    expect(seeded.get('dict')!.lastPracticedAt).toBeNull();
    expect(seeded.get('dict')!.observations).toBe(0);
  });

  it('spreads the diagnostic across categories rather than down one', () => {
    const wide = SkillGraph.from([
      { ...skill('a'), category: 'Syntax' },
      { ...skill('b'), category: 'Collections' },
      { ...skill('c'), category: 'Functions' },
    ]);
    const candidates = [
      exercise('syntax-1', { skills: ['a'], difficulty: 1 }),
      exercise('syntax-2', { skills: ['a'], difficulty: 1 }),
      exercise('syntax-3', { skills: ['a'], difficulty: 1 }),
      exercise('collections-1', { skills: ['b'], difficulty: 2 }),
      exercise('functions-1', { skills: ['c'], difficulty: 2 }),
    ];

    const plan = planDiagnostic(candidates, wide, { size: 3 });
    expect(plan.coverage).toEqual(['Collections', 'Functions', 'Syntax']);
  });

  it('ignores prerequisites, since the diagnostic is what unlocks them', () => {
    const plan = planDiagnostic([exercise('gated', { prerequisites: ['classes'] })], graph, {
      size: 5,
    });
    expect(plan.exercises).toHaveLength(1);
  });

  it('excludes exercises above the difficulty ceiling', () => {
    const plan = planDiagnostic(
      [exercise('hard', { difficulty: 5 }), exercise('fine', { difficulty: 2 })],
      graph,
      { maximumDifficulty: 3 },
    );
    expect(plan.exercises.map((item) => item.id)).toEqual(['fine']);
  });

  it('reports the categories it could not probe', () => {
    const plan = planDiagnostic([exercise('only', { skills: ['dict'] })], graph, { size: 5 });
    expect(plan.uncovered).not.toContain('Test');
    expect(plan.estimatedSeconds).toBe(180);
  });
});
