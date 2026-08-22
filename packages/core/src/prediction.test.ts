import { describe, expect, it } from 'vitest';

import { isPredictionCorrect, matchesOutput } from './prediction.ts';

describe('predicted output', () => {
  it('accepts an exact match', () => {
    expect(matchesOutput('42', '42')).toBe(true);
  });

  it('forgives trailing whitespace and a missing final newline', () => {
    // Typing, not understanding.
    expect(matchesOutput('42', '42\n')).toBe(true);
    expect(matchesOutput('a  \nb', 'a\nb\n\n')).toBe(true);
  });

  it('normalises line endings, so the same claim travels between platforms', () => {
    expect(matchesOutput('a\nb', 'a\r\nb')).toBe(true);
  });

  it('rejects roughly right', () => {
    // "Roughly right" is exactly how not really knowing survives.
    expect(matchesOutput('42', '43')).toBe(false);
    expect(matchesOutput('[1, 2]', '[1,2]')).toBe(false);
    expect(matchesOutput('a\nb', 'b\na')).toBe(false);
  });

  it('does not treat an empty prediction as agreeing with everything', () => {
    expect(matchesOutput('', 'output')).toBe(false);
    expect(matchesOutput('', '')).toBe(true);
  });
});

describe('predicted verdict', () => {
  it('is right when the tests do what was claimed', () => {
    expect(isPredictionCorrect({ about: 'tests', predicted: 'pass' }, { green: true })).toBe(true);
    expect(isPredictionCorrect({ about: 'tests', predicted: 'fail' }, { green: false })).toBe(true);
  });

  it('is wrong when they do not', () => {
    expect(isPredictionCorrect({ about: 'tests', predicted: 'pass' }, { green: false })).toBe(
      false,
    );
  });

  it('cannot be judged by the wrong kind of outcome', () => {
    // A claim about output says nothing about a test verdict, so it must not
    // be scored as though it did.
    expect(isPredictionCorrect({ about: 'output', predicted: '42' }, { green: true })).toBe(false);
    expect(isPredictionCorrect({ about: 'tests', predicted: 'pass' }, { stdout: 'x' })).toBe(false);
  });
});
