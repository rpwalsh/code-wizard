// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: what a good body produces, and what a bad one says. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { firstProblem, validateOrder } from '../main.js';

test(
  'a complete body passes and comes back trimmed',
  () => {
    const result = validateOrder({
      customer: '  ada  ',
      quantity: 3,
      priority: 'high',
      notes: 'leave at the door',
    });

    expectEqual(result.ok, true);
    expectEqual(result.value, {
      customer: 'ada',
      quantity: 3,
      priority: 'high',
      notes: 'leave at the door',
    });
  },
  { concept: 'node.net.validation' },
);

test(
  'priority defaults to normal when it is not given',
  () => {
    const result = validateOrder({ customer: 'ada', quantity: 1 });
    expectEqual(result.ok, true);
    expectEqual(result.value.priority, 'normal');
  },
  { concept: 'node.net.validation' },
);

test(
  'absent notes leaves the key off entirely',
  () => {
    const result = validateOrder({ customer: 'ada', quantity: 1 });
    // Not present, rather than present and undefined. The two are different
    // and only `in` can tell them apart.
    expectEqual('notes' in result.value, false);
  },
  { concept: 'node.net.validation' },
);

test(
  'missing required fields are each reported',
  () => {
    const result = validateOrder({});
    expectEqual(result.ok, false);
    expectEqual(result.errors, ['customer: is required', 'quantity: is required']);
  },
  { concept: 'node.net.validation' },
);

test(
  'a numeric string is not a number',
  () => {
    // The whole point. Accepting "3" here is how it becomes "33" later.
    const result = validateOrder({ customer: 'ada', quantity: '3' });
    expectEqual(result.ok, false);
    expectEqual(result.errors, ['quantity: must be an integer']);
  },
  { concept: 'node.net.validation' },
);

test(
  'an unknown priority is refused by name',
  () => {
    const result = validateOrder({ customer: 'ada', quantity: 1, priority: 'urgent' });
    expectEqual(result.errors, ['priority: must be one of low, normal, high']);
  },
  { concept: 'node.net.validation' },
);

test(
  'firstProblem is null on success and the first error otherwise',
  () => {
    expectEqual(firstProblem(validateOrder({ customer: 'ada', quantity: 1 })), null);
    expectEqual(firstProblem(validateOrder({})), 'customer: is required');
  },
  { concept: 'node.failure.errors' },
);
