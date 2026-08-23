// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { clearEmail, describe, mergeProfiles, withEmail, type Profile } from '../main.ts';

const ada: Profile = { id: 'u1', name: 'Ada', email: 'ada@example.com', age: 36 };
const anonymous: Profile = { id: 'u2', name: 'Anon' };

test(
  'describe prints what is present',
  () => {
    expectEqual(describe(ada), 'Ada (u1), ada@example.com, age 36');
    expectEqual(describe(anonymous), 'Anon (u2)');
  },
  { concept: 'typescript.shapes.optional' },
);

test(
  'withEmail sets and preserves',
  () => {
    const updated = withEmail(anonymous, 'anon@example.com');
    expectEqual(updated.email, 'anon@example.com');
    expectEqual(updated.name, 'Anon');
    expectEqual(anonymous.email, undefined);
  },
  { concept: 'typescript.shapes.objects' },
);

test(
  'merge lets the patch win where it speaks',
  () => {
    const merged = mergeProfiles(ada, { name: 'Ada L.', age: 37 });
    expectEqual(merged.name, 'Ada L.');
    expectEqual(merged.age, 37);
    expectEqual(merged.email, 'ada@example.com');
  },
  { concept: 'typescript.shapes.objects' },
);
