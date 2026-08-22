import { describe, expect, it } from 'vitest';

import { classifyFailure } from './errors.ts';
import {
  headlineMastery,
  makeMastery,
  masteryDimensions,
  weakestDimensions,
  zeroMastery,
} from './mastery.ts';
import type { TestCaseResult } from './testing.ts';
import { isGreen, redactHiddenTests, summarise } from './testing.ts';

describe('mastery vectors', () => {
  it('starts every dimension at zero', () => {
    for (const dimension of masteryDimensions) {
      expect(zeroMastery[dimension]).toBe(0);
    }
  });

  it('clamps values into [0, 1]', () => {
    const vector = makeMastery({ recall: 1.5, speed: -3 });
    expect(vector.recall).toBe(1);
    expect(vector.speed).toBe(0);
  });

  it('treats NaN as zero rather than propagating it', () => {
    expect(makeMastery({ recall: Number.NaN }).recall).toBe(0);
  });

  it('leaves unspecified dimensions at zero', () => {
    expect(makeMastery({ recall: 1 }).composition).toBe(0);
  });

  it('weights independent recall above conceptual knowledge', () => {
    const knowsButCannotWrite = makeMastery({ knowledge: 1, recognition: 1 });
    const writesButCannotExplain = makeMastery({ recall: 1, independence: 1 });
    // The whole product thesis: the second learner is further along.
    expect(headlineMastery(writesButCannotExplain)).toBeGreaterThan(
      headlineMastery(knowsButCannotWrite),
    );
  });

  it('reports a perfect vector as 1 and an empty one as 0', () => {
    const perfect = makeMastery(
      Object.fromEntries(masteryDimensions.map((dimension) => [dimension, 1])),
    );
    expect(headlineMastery(perfect)).toBe(1);
    expect(headlineMastery(zeroMastery)).toBe(0);
  });

  it('lists the weakest dimensions first', () => {
    const vector = makeMastery({
      knowledge: 0.9,
      recognition: 0.9,
      recall: 0.4,
      application: 0.9,
      composition: 0.6,
      speed: 0.9,
      retention: 0.9,
      independence: 0.9,
    });
    expect(weakestDimensions(vector).map((entry) => entry.dimension)).toEqual([
      'recall',
      'composition',
    ]);
  });
});

describe('failure classification', () => {
  it('recognises a Python traceback tail', () => {
    const traceback = [
      'Traceback (most recent call last):',
      '  File "main.py", line 4, in get_balance',
      '    return accounts[account_id]',
      "KeyError: 'acc-42'",
    ].join('\n');
    expect(classifyFailure(traceback)).toEqual({ kind: 'KeyError', detail: "'acc-42'" });
  });

  it('maps AssertionError onto the assertion failure kind', () => {
    expect(classifyFailure('AssertionError: values are not equal').kind).toBe('AssertionFailure');
  });

  it('returns Unknown rather than guessing', () => {
    expect(classifyFailure('the build broke somehow').kind).toBe('Unknown');
  });

  it('ignores an exception name mentioned in prose above the real error', () => {
    const text = 'Consider whether TypeError applies here.\nNameError: name "x" is not defined';
    expect(classifyFailure(text).kind).toBe('NameError');
  });
});

describe('test result helpers', () => {
  const base: TestCaseResult = {
    id: 'tests/test_a.py::test_one',
    name: 'one',
    status: 'passed',
    visibility: 'visible',
    durationMs: 1,
  };

  it('counts outcomes by status', () => {
    expect(
      summarise([
        base,
        { ...base, id: '2', status: 'failed' },
        { ...base, id: '3', status: 'skipped' },
      ]),
    ).toEqual({ passed: 1, failed: 1, errored: 0, skipped: 1 });
  });

  it('does not call a run green when nothing ran', () => {
    expect(
      isGreen({
        outcome: 'completed',
        cases: [],
        passed: 0,
        failed: 0,
        errored: 0,
        skipped: 0,
        durationMs: 0,
        stdout: '',
        stderr: '',
        truncated: false,
      }),
    ).toBe(false);
  });

  it('strips the detail of a failing hidden test', () => {
    const [redacted] = redactHiddenTests([
      {
        ...base,
        visibility: 'hidden',
        status: 'failed',
        message: 'assert get_balance({"x": 1}, "x") == 1',
        expected: '1',
        received: '0',
        location: { path: 'tests/test_hidden.py', line: 12 },
      },
    ]);

    expect(redacted?.expected).toBeUndefined();
    expect(redacted?.received).toBeUndefined();
    expect(redacted?.location).toBeUndefined();
    expect(redacted?.message).not.toContain('get_balance');
    // The learner still learns that it failed, and which one.
    expect(redacted?.status).toBe('failed');
    expect(redacted?.name).toBe('one');
  });

  it('leaves a passing hidden test with no failure message', () => {
    const [redacted] = redactHiddenTests([{ ...base, visibility: 'hidden', status: 'passed' }]);
    expect(redacted?.message).toBeUndefined();
  });

  it('leaves visible tests untouched', () => {
    const [redacted] = redactHiddenTests([{ ...base, status: 'failed', expected: '1' }]);
    expect(redacted?.expected).toBe('1');
  });
});
