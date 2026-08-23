// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, isBlank, orDefault, sameValue } from '../main.js';

test(
  'blank text',
  () => {
    expectEqual(isBlank(''), true);
    expectEqual(isBlank('   '), true);
    expectEqual(isBlank(' a '), false);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'a default when there is nothing',
  () => {
    expectEqual(orDefault(undefined, 'fallback'), 'fallback');
    expectEqual(orDefault('given', 'fallback'), 'given');
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'comparing without coercion',
  () => {
    expectEqual(sameValue(1, 1), true);
    expectEqual(sameValue(1, '1'), false);
  },
  { concept: 'javascript.syntax.equality' },
);

test(
  'describing a value',
  () => {
    expectEqual(describe(null), 'absent');
    expectEqual(describe('x'), 'present');
  },
  { concept: 'javascript.syntax.equality' },
);
