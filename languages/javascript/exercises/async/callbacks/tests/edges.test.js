// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Ordering, laziness and the failure that gets reported. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { promisify, retry, sequence, sleep } from '../main.js';

test(
  'promisify does not call the function early',
  () => {
    let called = false;
    const wrapped = promisify(() => {
      called = true;
    });
    // Wrapping alone must not invoke; only the call does.
    expectEqual(called, false);
    void wrapped;
  },
  { concept: 'javascript.async.callbacks' },
);

test(
  'extra arguments pass through ahead of the callback',
  async () => {
    const add = promisify((a, b, callback) => callback(null, a + b));
    expectEqual(await add(2, 3), 5);
  },
  { concept: 'javascript.async.callbacks' },
);

test(
  'sequence runs steps one at a time, in order',
  async () => {
    const order = [];
    const step = (name, ms) => async (input) => {
      order.push(`start ${name}`);
      await sleep(ms);
      order.push(`end ${name}`);
      return input;
    };

    // The slow step is first; overlap would show as "start b" before "end a".
    await sequence([step('a', 15), step('b', 1)], null);
    expectEqual(order, ['start a', 'end a', 'start b', 'end b']);
  },
  { concept: 'javascript.async.await' },
);

test(
  'sleep returns a promise that waits its milliseconds',
  async () => {
    const before = Date.now();
    const pending = sleep(25);
    expectTrue(pending instanceof Promise);
    await pending;
    expectTrue(Date.now() - before >= 15);
  },
  { concept: 'javascript.async.await' },
);

test(
  'an empty sequence hands the input straight back',
  async () => {
    expectEqual(await sequence([], 'unchanged'), 'unchanged');
  },
  { concept: 'javascript.async.await' },
);

test(
  'retry stops at the attempt cap and throws the last error',
  async () => {
    let calls = 0;
    const failing = async () => {
      calls += 1;
      throw new Error(`failure ${calls}`);
    };

    let caught = null;
    try {
      await retry(failing, 3, 1);
    } catch (error) {
      caught = error;
    }

    expectEqual(calls, 3);
    // The last failure describes what finally went wrong.
    expectEqual(caught.message, 'failure 3');
  },
  { concept: 'javascript.async.await' },
);

test(
  'a success on the first try never retries',
  async () => {
    let calls = 0;
    const fine = async () => {
      calls += 1;
      return 'ok';
    };
    expectEqual(await retry(fine, 5, 50), 'ok');
    expectEqual(calls, 1);
  },
  { concept: 'javascript.async.await' },
);
