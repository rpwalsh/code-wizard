// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The types are checked by using them; the functions prove they run. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { makeSetters, pickFields } from '../main.ts';
import type { Chosen, Locked, Mine, Setters, Unwrapped } from '../main.ts';

interface User {
  name: string;
  age: number;
  active: boolean;
}

test(
  'Mine makes every field optional',
  () => {
    // Compiles only if every field is optional.
    const nothing: Mine<User> = {};
    const some: Mine<User> = { name: 'Ada' };
    expectEqual(nothing, {});
    expectEqual(some.name, 'Ada');
  },
  { concept: 'typescript.types.mapped' },
);

test(
  'Chosen picks exactly the named keys',
  () => {
    const picked: Chosen<User, 'name' | 'age'> = { name: 'Ada', age: 36 };
    expectEqual(picked, { name: 'Ada', age: 36 });
  },
  { concept: 'typescript.types.mapped' },
);

test(
  'pickFields builds the picked object at runtime',
  () => {
    const user: User = { name: 'Ada', age: 36, active: true };
    expectEqual(pickFields(user, ['name', 'active']), { name: 'Ada', active: true });
  },
  { concept: 'typescript.types.utility' },
);

test(
  'Unwrapped removes one promise layer',
  () => {
    // Type-level assertions: these lines compile only if Unwrapped works.
    const n: Unwrapped<Promise<number>> = 42;
    const s: Unwrapped<string> = 'plain';
    expectEqual(n, 42);
    expectEqual(s, 'plain');
  },
  { concept: 'typescript.types.conditional' },
);

test(
  'setters write through to the target',
  () => {
    const user = { name: 'Ada', age: 36 };
    const setters: Setters<typeof user> = makeSetters(user);
    setters.setName('Bo');
    setters.setAge(20);
    expectEqual(user, { name: 'Bo', age: 20 });
  },
  { concept: 'typescript.types.mapped' },
);
