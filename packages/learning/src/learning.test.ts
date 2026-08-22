import { headlineMastery } from '@code-retrainer/core';
import { describe, expect, it } from 'vitest';

import type { Attempt, AttemptEvent, HintLevel } from './attempt.ts';
import { abandonAttempt, AttemptClosedError, recordEvent, startAttempt } from './attempt.ts';
import type { ExerciseProfile } from './grading.ts';
import { gradeAttempt, isGradable } from './grading.ts';
import { gradingContext } from './history-context.ts';
import { buildHistory, fluencyStage, independentCompletionRate } from './history.ts';
import {
  applyObservation,
  applyObservations,
  decayRetention,
  emptyMastery,
  reinforceRetention,
} from './mastery-update.ts';
import { computeMetrics } from './metrics.ts';

const START = '2026-03-01T10:00:00.000Z';

function at(secondsFromStart: number): string {
  return new Date(Date.parse(START) + secondsFromStart * 1000).toISOString();
}

const profile: ExerciseProfile = {
  id: 'python.collections.dict-lookup',
  version: 1,
  skills: ['python.collections.dict-lookup'],
  difficulty: 2,
  estimatedSeconds: 180,
  kind: 'micro-problem',
};

function attempt(
  events: AttemptEvent[],
  overrides: Partial<Pick<Attempt, 'mode' | 'id'>> = {},
): Attempt {
  let current = startAttempt({
    id: overrides.id ?? 'attempt-1',
    exerciseId: profile.id,
    exerciseVersion: profile.version,
    mode: overrides.mode ?? 'practice',
    startedAt: START,
  });
  for (const event of events) current = recordEvent(current, event);
  return current;
}

function green(seconds: number): AttemptEvent {
  return { type: 'test', at: at(seconds), passed: 5, failed: 0, errored: 0, green: true };
}

function red(seconds: number): AttemptEvent {
  return { type: 'test', at: at(seconds), passed: 2, failed: 3, errored: 0, green: false };
}

function hint(seconds: number, level: HintLevel): AttemptEvent {
  return { type: 'hint', at: at(seconds), level };
}

describe('attempt lifecycle', () => {
  it('finishes as soon as the tests go green', () => {
    const solved = attempt([red(30), green(90)]);
    expect(solved.outcome).toBe('solved');
    expect(solved.finishedAt).toBe(at(90));
  });

  it('refuses further events once finished', () => {
    const solved = attempt([green(60)]);
    expect(() => recordEvent(solved, hint(70, 'conceptual'))).toThrow(AttemptClosedError);
  });

  it('can be abandoned, and abandoning twice is a no-op', () => {
    const abandoned = abandonAttempt(attempt([red(20)]), at(300));
    expect(abandoned.outcome).toBe('abandoned');
    expect(abandonAttempt(abandoned, at(400))).toBe(abandoned);
  });
});

describe('fluency metrics', () => {
  it('measures time to first run and time to green separately', () => {
    const metrics = computeMetrics(attempt([{ type: 'run', at: at(20), failed: true }, green(75)]));
    expect(metrics.timeToFirstRunMs).toBe(20_000);
    expect(metrics.timeToFirstGreenMs).toBe(75_000);
    expect(metrics.totalMs).toBe(75_000);
  });

  it('counts failed test runs', () => {
    const metrics = computeMetrics(attempt([red(10), red(30), green(60)]));
    expect(metrics.testRuns).toBe(3);
    expect(metrics.failedTestRuns).toBe(2);
  });

  it('excludes paused time from the total', () => {
    const metrics = computeMetrics(
      attempt([
        red(10),
        { type: 'paused', at: at(20) },
        { type: 'resumed', at: at(200) },
        green(210),
      ]),
    );
    // 210s elapsed, 180s of it paused.
    expect(metrics.totalMs).toBe(30_000);
  });

  it('reports the deepest hint rather than only the count', () => {
    const metrics = computeMetrics(
      attempt([hint(10, 'conceptual'), hint(20, 'language'), hint(30, 'structural'), green(60)]),
    );
    expect(metrics.hintsRevealed).toBe(3);
    expect(metrics.deepestHint).toBe('language');
  });

  it('marks a clean solve as independent', () => {
    expect(computeMetrics(attempt([red(10), green(60)])).independent).toBe(true);
  });

  it('does not mark a hinted solve as independent', () => {
    expect(computeMetrics(attempt([hint(10, 'conceptual'), green(60)])).independent).toBe(false);
  });

  it('does not mark a documentation-assisted solve as independent', () => {
    const metrics = computeMetrics(
      attempt([{ type: 'documentation', at: at(10), query: 'dict.get' }, green(60)]),
    );
    expect(metrics.independent).toBe(false);
  });

  it('gives a revealed solution zero evidence weight', () => {
    const metrics = computeMetrics(attempt([{ type: 'solution-revealed', at: at(30) }, green(60)]));
    expect(metrics.evidenceWeight).toBe(0);
  });

  it('weights a fluency-mode solve above the same solve in learn mode', () => {
    const inFluency = computeMetrics(attempt([green(60)], { mode: 'fluency' }));
    const inLearn = computeMetrics(attempt([green(60)], { mode: 'learn' }));
    expect(inFluency.evidenceWeight).toBeGreaterThan(inLearn.evidenceWeight);
  });

  it('discounts an explicit hint far more than a conceptual one', () => {
    const nudged = computeMetrics(attempt([hint(5, 'conceptual'), green(60)]));
    const told = computeMetrics(attempt([hint(5, 'explicit'), green(60)]));
    expect(told.evidenceWeight).toBeLessThan(nudged.evidenceWeight);
  });
});

describe('grading', () => {
  it('ignores an attempt where the tests were never run', () => {
    const abandoned = abandonAttempt(attempt([]), at(30));
    expect(isGradable(abandoned)).toBe(false);
    expect(gradeAttempt(abandoned, profile)).toEqual([]);
  });

  it('ignores an attempt that is still in progress', () => {
    expect(isGradable(attempt([red(10)]))).toBe(false);
  });

  it('grades a failed attempt that did run the tests', () => {
    const failed = abandonAttempt(attempt([red(10), red(60)]), at(300));
    const [observation] = gradeAttempt(failed, profile);
    expect(observation?.evidence.application).toBe(0);
    expect(observation?.evidence.recall).toBe(0);
    // A failure is never discounted, however much help was available.
    expect(observation?.weight).toBe(1);
  });

  it('produces one observation per skill the exercise trains', () => {
    const observations = gradeAttempt(attempt([green(60)]), {
      ...profile,
      skills: ['a', 'b', 'c'],
    });
    expect(observations.map((observation) => observation.skillId)).toEqual(['a', 'b', 'c']);
  });

  it('scores recall lower when the syntax had to be handed over', () => {
    const unaided = gradeAttempt(attempt([green(60)]), profile)[0];
    const told = gradeAttempt(attempt([hint(5, 'explicit'), green(60)]), profile)[0];
    expect(unaided?.evidence.recall).toBeGreaterThan(0.8);
    expect(told?.evidence.recall).toBeLessThan(0.2);
  });

  it('reserves full recall for producing the code, not completing it', () => {
    // A skeleton answers half the question before it is asked: which shape,
    // which signature, which imports. Filling the gap is not the same act.
    const completed = gradeAttempt(attempt([green(60)], { mode: 'fluency' }), profile)[0];
    const produced = gradeAttempt(attempt([green(60)], { mode: 'blank-page' }), profile)[0];

    expect(produced?.evidence.recall).toBe(1);
    expect(completed?.evidence.recall).toBeLessThan(1);
    expect(completed?.evidence.recall).toBeGreaterThan(0.5);
  });

  it('says which rung comes next rather than only marking the gap', () => {
    const [observation] = gradeAttempt(attempt([green(60)], { mode: 'fluency' }), profile);
    expect(observation?.reasons.join(' ')).toMatch(/next rung/i);
  });

  it('does not punish a hinted solve twice for the mode it was in', () => {
    // The ceiling caps an unhinted completion. A hint already scores below it,
    // so it must be reported as the hint, not as the ceiling.
    const [observation] = gradeAttempt(attempt([hint(5, 'language'), green(60)]), profile);
    expect(observation?.evidence.recall).toBe(0.5);
  });

  it('separates application from independence for an assisted solve', () => {
    const [observation] = gradeAttempt(attempt([hint(5, 'syntax'), green(60)]), profile);
    // They did solve it — that is real. They did not do it alone.
    expect(observation?.evidence.application).toBe(1);
    expect(observation?.evidence.independence).toBe(0);
  });

  it('scores speed against the exercise estimate', () => {
    const fast = gradeAttempt(attempt([green(60)]), profile)[0];
    const slow = gradeAttempt(attempt([green(500)]), profile)[0];
    expect(fast?.evidence.speed).toBe(1);
    expect(slow?.evidence.speed).toBe(0);
  });

  it('does not judge composition on a single-skill drill', () => {
    const [observation] = gradeAttempt(attempt([green(30)]), {
      ...profile,
      difficulty: 1,
      skills: ['one'],
    });
    expect(observation?.evidence.composition).toBeUndefined();
  });

  it('judges composition on a multi-skill exercise', () => {
    const [observation] = gradeAttempt(attempt([green(30)]), {
      ...profile,
      skills: ['one', 'two'],
    });
    expect(observation?.evidence.composition).toBe(1);
  });

  it('explains itself in plain language', () => {
    const [observation] = gradeAttempt(attempt([hint(5, 'language'), green(60)]), profile);
    expect(observation?.reasons.join(' ')).toMatch(/Solved the exercise/);
    expect(observation?.reasons.join(' ')).toMatch(/hint/i);
  });
});

describe('debugging', () => {
  it('says nothing when nothing ever broke', () => {
    // Straight to green is not evidence about debugging, in either direction.
    const [observation] = gradeAttempt(attempt([green(60)]), profile);
    expect(observation?.evidence.debugging).toBeUndefined();
  });

  it('credits a red-to-green solve, because a fault was diagnosed', () => {
    const [observation] = gradeAttempt(attempt([red(10), green(60)]), profile);
    expect(observation?.evidence.debugging).toBe(1);
  });

  it('scores a long thrash below a clean diagnosis', () => {
    const clean = gradeAttempt(attempt([red(10), green(60)]), profile)[0];
    const thrashed = gradeAttempt(
      attempt([red(10), red(20), red(30), red(40), red(50), green(60)]),
      profile,
    )[0];
    expect(thrashed?.evidence.debugging).toBeLessThan(clean!.evidence.debugging!);
    expect(thrashed?.evidence.debugging).toBeGreaterThan(0);
  });

  it('treats a bug-fix exercise as a debugging task outright', () => {
    // No red run needed: locating the fault *is* the exercise.
    const [observation] = gradeAttempt(attempt([green(60)]), { ...profile, kind: 'bug-fix' });
    expect(observation?.evidence.debugging).toBe(1);
  });

  it('scores an unfixed bug at zero', () => {
    const failed = abandonAttempt(attempt([red(10)]), at(300));
    const [observation] = gradeAttempt(failed, { ...profile, kind: 'bug-fix' });
    expect(observation?.evidence.debugging).toBe(0);
  });
});

describe('transfer', () => {
  const familiar = { priorAttemptsAtExercise: 0, priorAttemptsAtSkill: 3 };

  it('says nothing without history, because there is nothing to transfer from', () => {
    const [observation] = gradeAttempt(attempt([green(60)]), profile);
    expect(observation?.evidence.transfer).toBeUndefined();
  });

  it('credits a known skill carried into an exercise never seen before', () => {
    const [observation] = gradeAttempt(attempt([green(60)]), profile, familiar);
    expect(observation?.evidence.transfer).toBe(1);
  });

  it('does not call repetition transfer', () => {
    // Second time at the same exercise. Solving it again proves retention, not
    // that the skill goes anywhere new.
    const [observation] = gradeAttempt(attempt([green(60)]), profile, {
      priorAttemptsAtExercise: 1,
      priorAttemptsAtSkill: 3,
    });
    expect(observation?.evidence.transfer).toBeUndefined();
  });

  it('records a failure to carry the skill across', () => {
    const failed = abandonAttempt(attempt([red(10)]), at(300));
    const [observation] = gradeAttempt(failed, profile, familiar);
    expect(observation?.evidence.transfer).toBe(0);
  });
});

describe('grading context', () => {
  const skills: Record<string, string[]> = {
    'ex.same-skill': ['python.collections.dict-lookup'],
    'ex.unrelated': ['python.functions'],
  };
  const skillsOf = (id: string) => skills[id] ?? [];

  function priorAttempt(id: string, exerciseId: string, secondsAgo: number): Attempt {
    return startAttempt({
      id,
      exerciseId,
      exerciseVersion: 1,
      mode: 'fluency',
      startedAt: at(-secondsAgo),
    });
  }

  const target = { exerciseId: profile.id, skills: profile.skills };

  it('counts repeats of the same exercise separately from the skill', () => {
    const context = gradingContext(
      [priorAttempt('a', profile.id, 100), priorAttempt('b', 'ex.same-skill', 200)],
      target,
      skillsOf,
      at(0),
    );
    expect(context).toEqual({ priorAttemptsAtExercise: 1, priorAttemptsAtSkill: 1 });
  });

  it('ignores exercises that share no skill', () => {
    const context = gradingContext(
      [priorAttempt('a', 'ex.unrelated', 100)],
      target,
      skillsOf,
      at(0),
    );
    expect(context.priorAttemptsAtSkill).toBe(0);
  });

  it('ignores attempts made after the one being graded', () => {
    // Grading is a replay over an append-only log, so it must see only what
    // had happened by then — otherwise re-deriving history changes it.
    const context = gradingContext(
      [priorAttempt('later', profile.id, -100)],
      target,
      skillsOf,
      at(0),
    );
    expect(context.priorAttemptsAtExercise).toBe(0);
  });
});

describe('mastery updates', () => {
  const solvedCleanly = () => gradeAttempt(attempt([green(60)]), profile)[0]!;
  const failed = () =>
    gradeAttempt(abandonAttempt(attempt([red(10), red(60)]), at(300)), profile)[0]!;

  it('moves toward the evidence without jumping to it', () => {
    const update = applyObservation(emptyMastery('s'), solvedCleanly());
    expect(update.mastery.vector.application).toBeGreaterThan(0);
    expect(update.mastery.vector.application).toBeLessThan(1);
  });

  it('records the observation count and the practice time', () => {
    const update = applyObservation(emptyMastery('s'), solvedCleanly());
    expect(update.mastery.observations).toBe(1);
    expect(update.mastery.lastPracticedAt).toBe(at(60));
  });

  it('leaves dimensions with no evidence untouched', () => {
    const update = applyObservation(emptyMastery('s'), solvedCleanly());
    expect(update.mastery.vector.knowledge).toBe(0);
    expect(update.mastery.vector.retention).toBe(0);
  });

  it('converges upward over repeated clean solves', () => {
    let mastery = emptyMastery('s');
    for (let i = 0; i < 12; i += 1) {
      mastery = applyObservation(mastery, solvedCleanly()).mastery;
    }
    expect(mastery.vector.independence).toBeGreaterThan(0.8);
    expect(headlineMastery(mastery.vector)).toBeGreaterThan(0.4);
  });

  it('never exceeds 1 however many successes accumulate', () => {
    let mastery = emptyMastery('s');
    for (let i = 0; i < 200; i += 1) {
      mastery = applyObservation(mastery, solvedCleanly()).mastery;
    }
    expect(mastery.vector.application).toBeLessThanOrEqual(1);
  });

  it('drops faster on failure than it rose on success', () => {
    let mastery = emptyMastery('s');
    for (let i = 0; i < 10; i += 1) {
      mastery = applyObservation(mastery, solvedCleanly()).mastery;
    }
    const peak = mastery.vector.application;
    const after = applyObservation(mastery, failed()).mastery.vector.application;
    expect(after).toBeLessThan(peak);
    // Established skills still resist a single bad day.
    expect(after).toBeGreaterThan(peak * 0.5);
  });

  it('stays responsive even after many observations', () => {
    let mastery = emptyMastery('s');
    for (let i = 0; i < 100; i += 1) {
      mastery = applyObservation(mastery, solvedCleanly()).mastery;
    }
    const before = mastery.vector.application;
    const after = applyObservation(mastery, failed()).mastery.vector.application;
    expect(before - after).toBeGreaterThan(0.05);
  });

  it('reports which dimensions moved, and how', () => {
    const update = applyObservation(emptyMastery('s'), solvedCleanly());
    const dimensions = update.changes.map((change) => change.dimension);
    expect(dimensions).toContain('application');
    expect(dimensions).toContain('independence');
    for (const change of update.changes) expect(change.to).not.toBe(change.from);
  });

  it('collapses a batch into one change per dimension', () => {
    const update = applyObservations(emptyMastery('s'), [
      solvedCleanly(),
      solvedCleanly(),
      solvedCleanly(),
    ]);
    const dimensions = update.changes.map((change) => change.dimension);
    expect(new Set(dimensions).size).toBe(dimensions.length);
    expect(update.mastery.observations).toBe(3);
  });

  it('gives a solution-revealed attempt no effect at all', () => {
    const revealed = gradeAttempt(
      attempt([{ type: 'solution-revealed', at: at(20) }, green(60)]),
      profile,
    )[0]!;
    const update = applyObservation(emptyMastery('s'), revealed);
    expect(update.changes).toEqual([]);
  });
});

describe('retention', () => {
  const practised = () => ({
    ...emptyMastery('s'),
    vector: { ...emptyMastery('s').vector, retention: 0.8 },
    lastPracticedAt: START,
    observations: 5,
  });

  it('decays with time away from the skill', () => {
    const later = decayRetention(practised(), new Date(Date.parse(START) + 60 * 86_400_000));
    expect(later.vector.retention).toBeLessThan(0.8);
  });

  it('does not decay on the same day', () => {
    const same = decayRetention(practised(), new Date(Date.parse(START)));
    expect(same.vector.retention).toBe(0.8);
  });

  it('decays a well-established skill more slowly than a shaky one', () => {
    const shaky = { ...practised(), vector: { ...practised().vector, retention: 0.2 } };
    const days = 30;
    const now = new Date(Date.parse(START) + days * 86_400_000);
    const strongLoss = 0.8 - decayRetention(practised(), now).vector.retention;
    const weakLoss = 0.2 - decayRetention(shaky, now).vector.retention;
    expect(strongLoss / 0.8).toBeLessThan(weakLoss / 0.2);
  });

  it('leaves a never-practised skill alone', () => {
    const untouched = decayRetention(emptyMastery('s'), new Date());
    expect(untouched.vector.retention).toBe(0);
  });

  it('rises when the skill is successfully recalled', () => {
    const observation = gradeAttempt(attempt([green(60)]), profile)[0]!;
    const after = reinforceRetention(emptyMastery('s'), observation);
    expect(after.vector.retention).toBeGreaterThan(0);
  });

  it('does not rise on a failed recall', () => {
    const observation = gradeAttempt(abandonAttempt(attempt([red(10)]), at(300)), profile)[0]!;
    expect(reinforceRetention(emptyMastery('s'), observation).vector.retention).toBe(0);
  });
});

describe('fluency history', () => {
  function solvedAttempt(id: string, startOffsetDays: number, seconds: number, hints: HintLevel[]) {
    const startedAt = new Date(Date.parse(START) + startOffsetDays * 86_400_000).toISOString();
    let current = startAttempt({
      id,
      exerciseId: profile.id,
      exerciseVersion: 1,
      mode: 'practice',
      startedAt,
    });
    const base = Date.parse(startedAt);
    hints.forEach((level, index) => {
      current = recordEvent(current, {
        type: 'hint',
        at: new Date(base + (index + 1) * 5000).toISOString(),
        level,
      });
    });
    current = recordEvent(current, {
      type: 'test',
      at: new Date(base + seconds * 1000).toISOString(),
      passed: 5,
      failed: 0,
      errored: 0,
      green: true,
    });
    return current;
  }

  // The §20 example: 4m18s with 3 hints, down to 1m32s with none.
  const attempts = [
    solvedAttempt('a1', 0, 258, ['conceptual', 'structural', 'language']),
    solvedAttempt('a2', 1, 167, ['conceptual']),
    solvedAttempt('a3', 3, 111, []),
    solvedAttempt('a4', 7, 92, []),
  ];

  it('orders attempts oldest first and numbers them', () => {
    const history = buildHistory(profile.id, [...attempts].reverse());
    expect(history.attempts.map((summary) => summary.attemptId)).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(history.attempts.map((summary) => summary.index)).toEqual([1, 2, 3, 4]);
  });

  it('reports best and latest times', () => {
    const history = buildHistory(profile.id, attempts);
    expect(history.bestTimeMs).toBe(92_000);
    expect(history.latestTimeMs).toBe(92_000);
  });

  it('reports improvement as a fraction of the first solved time', () => {
    const history = buildHistory(profile.id, attempts);
    expect(history.improvement).toBeCloseTo(0.64, 2);
  });

  it('has no improvement figure from a single attempt', () => {
    expect(buildHistory(profile.id, [attempts[0]!]).improvement).toBeNull();
  });

  it('reports the independent completion rate', () => {
    expect(buildHistory(profile.id, attempts).independentRate).toBe(0.5);
  });

  it('ignores attempts at other exercises', () => {
    const other = { ...attempts[0]!, id: 'other', exerciseId: 'python.other' };
    expect(buildHistory(profile.id, [...attempts, other]).attempts).toHaveLength(4);
  });

  it('walks the learner from unfamiliar to automatic', () => {
    expect(fluencyStage(buildHistory(profile.id, []))).toBe('unfamiliar');
    expect(fluencyStage(buildHistory(profile.id, attempts.slice(0, 1), 180))).toBe('understood');
    expect(fluencyStage(buildHistory(profile.id, attempts.slice(0, 3), 60))).toBe('recalled');
    expect(fluencyStage(buildHistory(profile.id, attempts, 180))).toBe('automatic');
  });

  it('reports an overall independent completion rate', () => {
    expect(independentCompletionRate(attempts)).toBe(0.5);
    expect(independentCompletionRate([])).toBeNull();
  });
});
