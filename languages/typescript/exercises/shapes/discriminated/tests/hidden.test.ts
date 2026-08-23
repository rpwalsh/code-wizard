// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Held back until the visible cases pass. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, parseAge, unwrapOr } from '../main.ts';

test(
  'every reason is reachable',
  () => {
    const reasons = ['abc', '12.5', '200'].map((input) => {
      const result = parseAge(input);
      return result.ok ? 'succeeded' : result.reason;
    });
    expectEqual(reasons, ['not a number', 'not a whole number', 'out of range']);
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'describe covers both members',
  () => {
    expectEqual(describe(parseAge('1')), 'age 1');
    expectEqual(describe(parseAge('x')), 'failed: not a number');
    expectEqual(describe(parseAge('300')), 'failed: out of range');
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'a falsy value survives unwrapOr',
  () => {
    // Age zero is a real answer. An implementation using `||` returns the
    // fallback here, which is the bug this case exists to catch.
    expectEqual(unwrapOr(parseAge('0'), -1), 0);
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'infinity is not a number for this purpose',
  () => {
    const result = parseAge('Infinity');
    expectEqual(result.ok, false);
  },
  { concept: 'typescript.basics.narrowing' },
);
