// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Attempt, AttemptEvent } from '@code-wizard/learning';
import { abandonAttempt, recordEvent, startAttempt } from '@code-wizard/learning';
import { describe, expect, it } from 'vitest';

import { compareToBaseline, readAssistance, readBaseline } from './baseline.ts';

const START = Date.parse('2026-03-01T09:00:00.000Z');
const DAY = 86_400_000;

function at(day: number, seconds = 0): string {
  return new Date(START + day * DAY + seconds * 1000).toISOString();
}

function attempt(
  id: string,
  day: number,
  options: { solved?: boolean; hints?: number; seconds?: number } = {},
): Attempt {
  const { solved = true, hints = 0, seconds = 60 } = options;
  let current = startAttempt({
    id,
    exerciseId: 'ex',
    exerciseVersion: 1,
    mode: 'practice',
    startedAt: at(day),
  });

  for (let index = 0; index < hints; index += 1) {
    const event: AttemptEvent = { type: 'hint', at: at(day, 5 + index), level: 'conceptual' };
    current = recordEvent(current, event);
  }

  if (!solved) {
    current = recordEvent(current, {
      type: 'test',
      at: at(day, seconds),
      passed: 0,
      failed: 2,
      errored: 0,
      green: false,
    });
    return abandonAttempt(current, at(day, seconds + 10));
  }

  return recordEvent(current, {
    type: 'test',
    at: at(day, seconds),
    passed: 3,
    failed: 0,
    errored: 0,
    green: true,
  });
}

describe('personal baseline', () => {
  it('refuses to answer before there is enough evidence', () => {
    // A baseline from two attempts is a precise-looking number a third
    // attempt could move by fifty points, and everything measured against it
    // afterwards would inherit that noise.
    const attempts = [attempt('a', 0), attempt('b', 1)];
    expect(readBaseline(attempts)).toBeNull();
  });

  it('measures the opening window once there is', () => {
    const attempts = Array.from({ length: 5 }, (_, index) =>
      attempt(`a${index}`, index, { hints: 2 }),
    );
    const baseline = readBaseline(attempts);

    expect(baseline?.attempts).toBe(5);
    expect(baseline?.takenAt).toBe(at(0));
    expect(baseline?.independence).toBe(0);
    expect(baseline?.solveRate).toBe(1);
    expect(baseline?.hintsPerAttempt).toBe(2);
  });

  it('reads the opening window whatever order the log arrives in', () => {
    const attempts = [attempt('late', 9), attempt('first', 0)];
    for (let index = 1; index < 4; index += 1) attempts.push(attempt(`mid${index}`, index));

    expect(readBaseline(attempts)?.takenAt).toBe(at(0));
  });

  it('counts independence over solves, not over everything attempted', () => {
    // Failing without help is not independence; it is just failing.
    const attempts = [
      attempt('s1', 0),
      attempt('s2', 1),
      attempt('f1', 2, { solved: false }),
      attempt('f2', 3, { solved: false }),
      attempt('f3', 4, { solved: false }),
    ];
    expect(readBaseline(attempts)?.independence).toBe(1);
    expect(readBaseline(attempts)?.solveRate).toBe(0.4);
  });
});

describe('comparison against the baseline', () => {
  it('will not compare a window against itself', () => {
    // With only five attempts the "now" window is the baseline window, and any
    // progress reported would be arithmetic rather than learning.
    const attempts = Array.from({ length: 5 }, (_, index) => attempt(`a${index}`, index));
    expect(compareToBaseline(attempts)).toBeNull();
  });

  it('reports needing less help as positive movement', () => {
    const early = Array.from({ length: 5 }, (_, index) =>
      attempt(`early${index}`, index, { hints: 3, seconds: 300 }),
    );
    const late = Array.from({ length: 5 }, (_, index) =>
      attempt(`late${index}`, 10 + index, { seconds: 60 }),
    );

    const comparison = compareToBaseline([...early, ...late]);
    expect(comparison?.baseline.independence).toBe(0);
    expect(comparison?.now.independence).toBe(1);
    expect(comparison?.independenceChange).toBe(1);
    // Negative means faster.
    expect(comparison?.speedChangeMs).toBeLessThan(0);
  });

  it('reports going backwards honestly', () => {
    const early = Array.from({ length: 5 }, (_, index) => attempt(`early${index}`, index));
    const late = Array.from({ length: 5 }, (_, index) =>
      attempt(`late${index}`, 10 + index, { hints: 1 }),
    );

    expect(compareToBaseline([...early, ...late])?.independenceChange).toBe(-1);
  });
});

describe('assistance dependency', () => {
  it('produces one point per day across the window, inclusive', () => {
    const points = readAssistance([], { days: 30, now: new Date(START + 30 * DAY) });
    expect(points).toHaveLength(31);
  });

  it('says nothing rather than zero where there were no attempts', () => {
    // Zero dependency on a day with no practice is a lie the shape of good news.
    const points = readAssistance([], { days: 7, now: new Date(START + 7 * DAY) });
    expect(points.every((point) => point.dependency === null)).toBe(true);
  });

  it('falls as the learner stops reaching for help', () => {
    const attempts = [
      ...Array.from({ length: 3 }, (_, index) => attempt(`early${index}`, index, { hints: 1 })),
      ...Array.from({ length: 3 }, (_, index) => attempt(`late${index}`, 20 + index)),
    ];
    const points = readAssistance(attempts, { days: 30, now: new Date(START + 30 * DAY) });

    const early = points.find((point) => point.date === '2026-03-03');
    const late = points.find((point) => point.date === '2026-03-23');

    expect(early?.dependency).toBe(1);
    expect(late?.dependency).toBe(0);
  });

  it('smooths over a trailing window rather than a single day', () => {
    // One assisted afternoon among a good week is not a trend and must not
    // look like one.
    const attempts = [
      ...Array.from({ length: 6 }, (_, index) => attempt(`clean${index}`, index)),
      attempt('assisted', 6, { hints: 1 }),
    ];
    const points = readAssistance(attempts, { days: 10, now: new Date(START + 10 * DAY) });
    const spike = points.find((point) => point.date === '2026-03-07');

    expect(spike?.attempts).toBe(7);
    expect(spike?.dependency).toBeCloseTo(0.14, 2);
  });
});
