/** Cases the visible tests did not reach. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, isBlank, orDefault, sameValue } from '../main.js';

test(
  'whitespace of every kind is blank',
  () => {
    expectEqual(isBlank('\t\n  '), true);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'zero and false are not the same value',
  () => {
    expectEqual(sameValue(0, false), false);
    expectEqual(sameValue('', 0), false);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'negative zero is a different value from zero',
  () => {
    expectEqual(sameValue(0, -0), false);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'a default of undefined is still returned',
  () => {
    expectEqual(orDefault(null, undefined), undefined);
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'describing an object and an array',
  () => {
    expectEqual(describe({}), 'present');
    expectEqual(describe([]), 'present');
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'describing a non-empty number',
  () => {
    expectEqual(describe(42), 'present');
    expectEqual(describe(true), 'present');
  },
  { concept: 'javascript.syntax.equality' },
);
