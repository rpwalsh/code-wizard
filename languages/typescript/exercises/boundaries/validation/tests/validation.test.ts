// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { isUser, parseUser, parseUsers } from '../main.ts';

const ada = { id: 1, name: 'Ada', email: 'ada@example.com', tags: ['math'] };

test(
  'a well-shaped object is a user',
  () => {
    expectEqual(isUser(ada), true);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'missing and mistyped fields are refused',
  () => {
    expectEqual(isUser({ id: 1, name: 'Ada', email: 'a@b' }), false);
    expectEqual(isUser({ ...ada, id: '1' }), false);
    expectEqual(isUser({ ...ada, name: 7 }), false);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'good json with the right shape parses',
  () => {
    expectEqual(parseUser(JSON.stringify(ada)), { ok: true, user: ada });
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'malformed json and a wrong shape fail differently',
  () => {
    expectEqual(parseUser('{nope'), { ok: false, error: 'invalid json' });
    expectEqual(parseUser('{"id": 1}'), { ok: false, error: 'not a user' });
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a mixed array keeps the good and counts the bad',
  () => {
    const text = JSON.stringify([ada, { id: 'x' }, { ...ada, id: 2 }]);
    const result = parseUsers(text);
    expectEqual(result.ok, true);
    if (result.ok) {
      expectEqual(result.users.length, 2);
      expectEqual(result.skipped, 1);
    }
  },
  { concept: 'typescript.shapes.discriminated' },
);
