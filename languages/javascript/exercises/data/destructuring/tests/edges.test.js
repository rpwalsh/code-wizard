// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Missing arguments, nulls, and the input surviving intact. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { connect, firstAndLast, splitUser } from '../main.js';

test(
  'no argument at all behaves like an empty object',
  () => {
    // Without the outer default this throws inside destructuring, not here.
    let caught = null;
    try {
      connect();
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof TypeError);
    expectTrue(caught.message.includes('host'));
  },
  { concept: 'javascript.functions.parameters' },
);

test(
  'a missing phone takes its default',
  () => {
    const split = splitUser({ name: 'Bo', contact: { email: 'bo@example.com' } });
    expectEqual(split.contact, 'bo@example.com <none>');
  },
  { concept: 'javascript.functions.parameters' },
);

test(
  'the input object is not modified',
  () => {
    const user = { name: 'Cy', contact: { email: 'cy@example.com' }, role: 'user' };
    splitUser(user);
    expectEqual(user.name, 'Cy');
    expectEqual(user.role, 'user');
    expectTrue('contact' in user);
  },
  { concept: 'javascript.data.objects' },
);

test(
  'a null host is a chosen value, so the undefined check leaves it alone',
  () => {
    // The check is === undefined; with == , null would throw here too.
    expectEqual(connect({ host: null }), 'pg://null:5432');
  },
  { concept: 'javascript.functions.parameters' },
);

test(
  'port zero is a chosen value, not an absence',
  () => {
    // Defaults fire on undefined only; 0 was somebody's decision.
    expectEqual(connect({ host: 'h', port: 0 }), 'pg://h:0');
  },
  { concept: 'javascript.functions.parameters' },
);

test(
  'one element is both first and last',
  () => {
    expectEqual(firstAndLast(['only']), { first: 'only', last: 'only', count: 1 });
  },
  { concept: 'javascript.data.objects' },
);

test(
  'an empty array has neither',
  () => {
    expectEqual(firstAndLast([]), { first: undefined, last: undefined, count: 0 });
  },
  { concept: 'javascript.data.objects' },
);
