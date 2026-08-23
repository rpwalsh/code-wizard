// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: a cycle, an empty list, and order under concurrency. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { firstSuccess, rootCause, settle, wrap } from '../main.js';

test(
  'a cycle in the cause chain terminates instead of hanging',
  () => {
    // Two layers that wrap each other's errors in a retry loop produce
    // exactly this. A walker without a guard never returns, and an error
    // handler that hangs takes the process down saying nothing at all.
    const first = new Error('first');
    const second = new Error('second');
    first.cause = second;
    second.cause = first;

    const root = rootCause(first);
    expectTrue(root === first || root === second);
  },
  { concept: 'node.failure.errors' },
);

test(
  'settle on an empty list is an empty report, not a failure',
  async () => {
    const { values, failures } = await settle([]);
    expectEqual(values, []);
    expectEqual(failures, []);
  },
  { concept: 'node.failure.async' },
);

test(
  'settle keeps input order even when the fast tasks finish first',
  async () => {
    const slow = (value) => async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return value;
    };
    const fast = (value) => async () => value;

    const { values } = await settle([slow('first'), fast('second'), slow('third')]);

    // allSettled preserves the order of the input, not the order of
    // completion. Collecting results as they resolve would produce
    // ['second', 'first', 'third'] and pass a less careful test.
    expectEqual(values, ['first', 'second', 'third']);
  },
  { concept: 'node.failure.async' },
);

test(
  'settle runs the tasks concurrently rather than one after another',
  async () => {
    const began = Date.now();
    const wait = () => async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
      return 'done';
    };

    await settle([wait(), wait(), wait()]);

    // Three forty-millisecond tasks in sequence take a hundred and twenty.
    // Started together they take about forty, and the generous ceiling here
    // is for a loaded machine rather than for a sequential implementation.
    expectTrue(Date.now() - began < 100);
  },
  { concept: 'node.failure.async' },
);

test(
  'wrap does not mutate the error it wraps',
  () => {
    const original = new Error('the real problem');
    const wrapped = wrap(original, 'context', 'CODE');

    expectEqual(original.message, 'the real problem');
    expectEqual(original.cause, undefined);
    expectTrue(wrapped !== original);
  },
  { concept: 'node.failure.errors' },
);
