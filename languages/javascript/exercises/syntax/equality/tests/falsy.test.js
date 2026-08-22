/** The falsy values that are not absent. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, isBlank, orDefault, sameValue } from '../main.js';

test(
  'zero survives a default',
  () => {
    // `value || fallback` replaces this, and the wrong number is plausible.
    expectEqual(orDefault(0, 99), 0);
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'an empty string and a false survive a default',
  () => {
    expectEqual(orDefault('', 'fallback'), '');
    expectEqual(orDefault(false, true), false);
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'both kinds of absent are replaced',
  () => {
    expectEqual(orDefault(null, 'fallback'), 'fallback');
    expectEqual(orDefault(undefined, 'fallback'), 'fallback');
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'absent text is blank',
  () => {
    expectEqual(isBlank(null), true);
    expectEqual(isBlank(undefined), true);
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'loose equality against null catches exactly the two absent values',
  () => {
    // The one place `==` is the right tool. Everything else it does is a trap.
    expectEqual(null == undefined, true);
    expectEqual(0 == null, false);
    expectEqual('' == null, false);
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'NaN is equal to itself here and to nothing under ===',
  () => {
    // Which is why indexOf never finds it.
    expectEqual(sameValue(NaN, NaN), true);
    expectEqual(NaN === NaN, false);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'describing every falsy value distinctly',
  () => {
    expectEqual(describe(undefined), 'absent');
    expectEqual(describe(''), 'empty');
    expectEqual(describe(0), 'zero');
    expectEqual(describe(false), 'false');
  },
  { concept: 'javascript.syntax.equality' },
);
