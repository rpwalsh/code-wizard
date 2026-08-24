// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: null where an object was expected, and present-but-null. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { isRecord, parseUser, parseUsers, type Json } from '../main.ts';

test(
  'null is not a record, however much typeof says otherwise',
  () => {
    // typeof null === 'object' is the oldest wrong answer in the language,
    // and a guard that forgets it crashes on the first null field.
    expectEqual(isRecord(null), false);
    const parsed = parseUser(null);
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['expected an object']);
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'an array is not a record either',
  () => {
    const parsed = parseUser([1, 2, 3]);
    expectTrue(!parsed.ok);
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'a present but null optional field is a problem, not an absence',
  () => {
    // { email: null } is somebody sending null on purpose. Treating it as
    // absent silently accepts data the schema does not describe.
    const parsed = parseUser({ id: 1, name: 'ada', email: null, roles: [] });
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['email: expected a string']);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a non-integer number is not an id',
  () => {
    expectTrue(!parseUser({ id: 1.5, name: 'ada', roles: [] }).ok);
    expectTrue(!parseUser({ id: Number.NaN, name: 'ada', roles: [] }).ok);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a missing field is reported rather than crashing',
  () => {
    const parsed = parseUser({ id: 1 });
    expectTrue(!parsed.ok);
    if (!parsed.ok) {
      expectTrue(parsed.problems.includes('name: expected a string'));
      expectTrue(parsed.problems.includes('roles: expected an array'));
    }
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'a bad element inside roles names its index',
  () => {
    const parsed = parseUser({ id: 1, name: 'ada', roles: ['admin', 7] });
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['roles[1]: expected a string']);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'an empty list parses to an empty list',
  () => {
    const parsed = parseUsers([]);
    expectTrue(parsed.ok);
    if (parsed.ok) expectEqual(parsed.value, []);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'problems from several records are all collected',
  () => {
    const parsed = parseUsers([{ id: 'a', name: 'x', roles: [] }, { id: 'b', name: 'y', roles: [] }]);
    expectTrue(!parsed.ok);
    if (!parsed.ok) {
      expectEqual(parsed.problems, ['[0] id: expected an integer', '[1] id: expected an integer']);
    }
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'something that is not a list at all is refused',
  () => {
    const parsed = parseUsers({ id: 1 });
    expectTrue(!parsed.ok);
    if (!parsed.ok) expectEqual(parsed.problems, ['expected an array']);
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'an empty string is a string',
  () => {
    // '' is falsy and is a perfectly good value. A guard written with a
    // truthiness fallback turns it into "expected a string", which rejects
    // a name somebody deliberately cleared.
    const parsed = parseUser({ id: 1, name: '', roles: [] });
    expectTrue(parsed.ok);
    if (parsed.ok) expectEqual(parsed.value.name, '');
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'an empty optional string is kept rather than refused',
  () => {
    const parsed = parseUser({ id: 1, name: 'ada', email: '', roles: [] });
    expectTrue(parsed.ok);
    if (parsed.ok) expectEqual(parsed.value.email, '');
  },
  { concept: 'typescript.boundaries.validation' },
);

