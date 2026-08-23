// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Absent versus undefined, and the empty string that must survive. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { clearEmail, describe, mergeProfiles, type Profile } from '../main.ts';

const ada: Profile = { id: 'u1', name: 'Ada', email: 'ada@example.com', age: 36 };

test(
  'clearEmail removes the key entirely',
  () => {
    const cleared = clearEmail(ada);
    // in, not === undefined: a key set to undefined would still enumerate,
    // a ghost field that reads as a value bug later.
    expectFalse('email' in cleared);
    expectTrue('email' in ada);
  },
  { concept: 'typescript.shapes.optional' },
);

test(
  'an empty email is present and prints',
  () => {
    const withEmpty: Profile = { id: 'u3', name: 'Bo', email: '' };
    expectEqual(describe(withEmpty), 'Bo (u3), ');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'age zero is present too',
  () => {
    const newborn: Profile = { id: 'u4', name: 'New', age: 0 };
    expectEqual(describe(newborn), 'New (u4), age 0');
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'an explicit undefined in the patch does not erase',
  () => {
    const merged = mergeProfiles(ada, { email: undefined, name: 'Ada L.' });
    expectEqual(merged.email, 'ada@example.com');
    expectEqual(merged.name, 'Ada L.');
  },
  { concept: 'typescript.shapes.optional' },
);

test(
  'an empty patch changes nothing',
  () => {
    expectEqual(mergeProfiles(ada, {}), ada);
  },
  { concept: 'typescript.shapes.objects' },
);
