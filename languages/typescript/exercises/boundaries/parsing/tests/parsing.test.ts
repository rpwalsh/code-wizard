// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: a good record, a bad one, and a list of both. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { isRecord, parseUser, parseUsers, type Json } from '../main.ts';

test(
  'a complete record parses',
  () => {
    const parsed = parseUser({ id: 1, name: 'ada', email: 'a@example.com', roles: ['admin'] });
    expectTrue(parsed.ok);
    if (parsed.ok) {
      expectEqual(parsed.value.id, 1);
      expectEqual(parsed.value.name, 'ada');
      expectEqual(parsed.value.roles, ['admin']);
    }
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'an absent optional field is simply absent',
  () => {
    const parsed = parseUser({ id: 1, name: 'ada', roles: [] });
    expectTrue(parsed.ok);
    if (parsed.ok) expectEqual('email' in parsed.value, false);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a wrong type is reported by field',
  () => {
    const parsed = parseUser({ id: 'one', name: 'ada', roles: [] });
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['id: expected an integer']);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'every problem is reported at once',
  () => {
    const parsed = parseUser({ id: 'one', name: 2, roles: 'admin' });
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems.length, 3);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'isRecord separates objects from arrays and null',
  () => {
    expectEqual(isRecord({ a: 1 }), true);
    expectEqual(isRecord([1, 2]), false);
    expectEqual(isRecord(null), false);
    expectEqual(isRecord('text'), false);
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'a list of good records parses',
  () => {
    const parsed = parseUsers([
      { id: 1, name: 'ada', roles: [] },
      { id: 2, name: 'bo', roles: ['admin'] },
    ]);

    expectTrue(parsed.ok);
    if (parsed.ok) expectEqual(parsed.value.length, 2);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a problem in a list names the record it came from',
  () => {
    const parsed = parseUsers([{ id: 1, name: 'ada', roles: [] }, { id: 2, name: 5, roles: [] }]);
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['[1] name: expected a string']);
  },
  { concept: 'typescript.boundaries.validation' },
);
