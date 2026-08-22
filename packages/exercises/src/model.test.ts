import { describe, expect, it } from 'vitest';

import { timeBudgetSeconds } from './model.ts';

describe('time budget', () => {
  it('gives more than the fluent estimate, because the learner is not fluent yet', () => {
    expect(timeBudgetSeconds({ difficulty: 1, estimatedSeconds: 60 })).toBeGreaterThan(60);
  });

  it('scales with the exercise rather than being a flat clock', () => {
    // A twenty-minute problem must not tick against the same allowance as a
    // sixty-second drill.
    const drill = timeBudgetSeconds({ difficulty: 1, estimatedSeconds: 60 });
    const problem = timeBudgetSeconds({ difficulty: 1, estimatedSeconds: 1200 });
    expect(problem).toBeGreaterThan(drill * 10);
  });

  it('grows the allowance with difficulty, not just the estimate', () => {
    // The spread between "knows it" and "rebuilding it" widens as the problem
    // gets harder, so a fixed percentage would squeeze the hard end.
    const easy = timeBudgetSeconds({ difficulty: 1, estimatedSeconds: 600 });
    const hard = timeBudgetSeconds({ difficulty: 5, estimatedSeconds: 600 });
    expect(hard).toBeGreaterThan(easy);
  });

  it('is monotonic across every difficulty', () => {
    const budgets = [1, 2, 3, 4, 5].map((difficulty) =>
      timeBudgetSeconds({ difficulty, estimatedSeconds: 300 }),
    );
    for (let index = 1; index < budgets.length; index += 1) {
      expect(budgets[index]!).toBeGreaterThanOrEqual(budgets[index - 1]!);
    }
  });

  it('still answers for a difficulty outside the table', () => {
    // Content is data and can carry anything the schema allows; a timer that
    // returned NaN would put "NaN remaining" on screen.
    expect(Number.isFinite(timeBudgetSeconds({ difficulty: 9, estimatedSeconds: 120 }))).toBe(true);
  });

  it('returns whole seconds', () => {
    expect(timeBudgetSeconds({ difficulty: 3, estimatedSeconds: 65 }) % 1).toBe(0);
  });
});
