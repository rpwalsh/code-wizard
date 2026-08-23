// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The boundaries, and the inputs that fail more than one rule. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { parseAge } from '../main.ts';

function reasonOf(input: string): string {
  const result = parseAge(input);
  return result.ok ? 'succeeded' : result.reason;
}

test(
  'both ends of the range are valid',
  () => {
    expectEqual(reasonOf('0'), 'succeeded');
    expectEqual(reasonOf('150'), 'succeeded');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'just outside the range is not',
  () => {
    expectEqual(reasonOf('151'), 'out of range');
    expectEqual(reasonOf('-1'), 'out of range');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'a fractional value is rejected before the range is considered',
  () => {
    // 12.5 is a number, is not whole, and is in range: the order of the
    // checks is what decides which reason comes back.
    expectEqual(reasonOf('12.5'), 'not a whole number');
    // 999.5 fails two rules at once. The earlier one wins.
    expectEqual(reasonOf('999.5'), 'not a whole number');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'an empty string is not a number',
  () => {
    // Number('') is 0, so a naive implementation reports this as a valid age.
    expectEqual(reasonOf(''), 'not a number');
    expectEqual(reasonOf('   '), 'not a number');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'surrounding whitespace is tolerated',
  () => {
    expectEqual(reasonOf('  42  '), 'succeeded');
  },
  { concept: 'typescript.basics.narrowing' },
);
