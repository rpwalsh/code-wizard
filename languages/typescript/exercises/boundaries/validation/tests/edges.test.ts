// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The values that break sloppy guards. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { isUser, parseUser, parseUsers } from '../main.ts';

const ada = { id: 1, name: 'Ada', email: 'ada@example.com', tags: ['math'] };

test(
  'null is an object to typeof, and still not a user',
  () => {
    expectEqual(isUser(null), false);
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'primitives and arrays are not users',
  () => {
    expectEqual(isUser('user'), false);
    expectEqual(isUser(42), false);
    expectEqual(isUser([]), false);
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'an array of the wrong element type is caught',
  () => {
    // Array.isArray alone would pass this; the element check is the guard.
    expectEqual(isUser({ ...ada, tags: [1, 2, 3] }), false);
    expectEqual(isUser({ ...ada, tags: ['ok', 7] }), false);
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'empty tags are a valid user',
  () => {
    expectEqual(isUser({ ...ada, tags: [] }), true);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'extra fields are tolerated',
  () => {
    expectEqual(isUser({ ...ada, role: 'admin' }), true);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a lone user object is not an array of users',
  () => {
    expectEqual(parseUsers(JSON.stringify(ada)), { ok: false, error: 'not an array' });
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'an empty array is a success with nothing in it',
  () => {
    expectEqual(parseUsers('[]'), { ok: true, users: [], skipped: 0 });
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'json null parses but is not a user',
  () => {
    expectEqual(parseUser('null'), { ok: false, error: 'not a user' });
  },
  { concept: 'typescript.basics.narrowing' },
);
