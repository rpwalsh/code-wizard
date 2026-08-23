// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: every coercion JavaScript would perform for you, refused. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { validateOrder } from '../main.js';

test(
  'every problem is reported at once, in field order',
  () => {
    const result = validateOrder({
      customer: '   ',
      quantity: 0,
      priority: 'urgent',
      notes: 'x'.repeat(201),
    });

    // Four problems, four messages. A validator that returns after the
    // first turns filling in a form into a conversation.
    expectEqual(result.errors, [
      'customer: must not be empty',
      'quantity: must be at least 1',
      'priority: must be one of low, normal, high',
      'notes: must be 200 characters or fewer',
    ]);
  },
  { concept: 'node.net.validation' },
);

test(
  'NaN is a number and is still not a quantity',
  () => {
    // typeof NaN === 'number', which is why that check is the wrong one.
    const result = validateOrder({ customer: 'ada', quantity: Number.NaN });
    expectEqual(result.errors, ['quantity: must be an integer']);
  },
  { concept: 'node.net.validation' },
);

test(
  'infinity and fractions are refused as well',
  () => {
    expectEqual(validateOrder({ customer: 'ada', quantity: Infinity }).errors, [
      'quantity: must be an integer',
    ]);
    expectEqual(validateOrder({ customer: 'ada', quantity: 2.5 }).errors, [
      'quantity: must be an integer',
    ]);
  },
  { concept: 'node.net.validation' },
);

test(
  'a non-string customer is a type problem, not an empty one',
  () => {
    // 42 has no trim(). Checking emptiness before type is how a validator
    // crashes on the input it was written to reject.
    const result = validateOrder({ customer: 42, quantity: 1 });
    expectEqual(result.errors, ['customer: must be a string']);
  },
  { concept: 'node.net.validation' },
);

test(
  'exactly at the limits is accepted',
  () => {
    const result = validateOrder({
      customer: 'a',
      quantity: 1,
      notes: 'x'.repeat(200),
    });
    // One is the minimum and two hundred is the maximum, and both are
    // allowed. Off-by-one at a boundary is the classic validator bug.
    expectTrue(result.ok);
    expectEqual(result.value.quantity, 1);
    expectEqual(result.value.notes.length, 200);
  },
  { concept: 'node.net.validation' },
);

test(
  'a failed result carries no value, and a good one carries no errors',
  () => {
    const bad = validateOrder({});
    const good = validateOrder({ customer: 'ada', quantity: 1 });

    expectEqual('value' in bad, false);
    expectEqual('errors' in good, false);
  },
  { concept: 'node.net.validation' },
);
