// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: order, the ceiling, and the limiter. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createLimiter, mapLimit } from '../main.js';

/** A worker that records how many are running at once. */
function watched(delayMs = 5) {
  const state = { running: 0, peak: 0 };
  const worker = async (value) => {
    state.running += 1;
    state.peak = Math.max(state.peak, state.running);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    state.running -= 1;
    return value * 2;
  };
  return { state, worker };
}

test(
  'results come back in input order',
  async () => {
    // The slowest task is first, so anything collecting results as they
    // finish would return them backwards.
    const results = await mapLimit([3, 2, 1], 3, async (value) => {
      await new Promise((resolve) => setTimeout(resolve, value * 10));
      return value * 2;
    });

    expectEqual(results, [6, 4, 2]);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'no more than the limit run at once',
  async () => {
    const { state, worker } = watched();
    await mapLimit([1, 2, 3, 4, 5, 6, 7, 8], 3, worker);

    expectTrue(state.peak <= 3);
    expectEqual(state.running, 0);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'the pool is actually used, not left idle',
  async () => {
    const { state, worker } = watched();
    await mapLimit([1, 2, 3, 4, 5, 6], 3, worker);

    // A sequential implementation passes the ceiling test and fails this.
    expectEqual(state.peak, 3);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'every item is processed exactly once',
  async () => {
    const seen = [];
    const results = await mapLimit([1, 2, 3, 4, 5], 2, async (value) => {
      seen.push(value);
      return value;
    });

    expectEqual(results, [1, 2, 3, 4, 5]);
    expectEqual([...seen].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'the worker receives the index alongside the value',
  async () => {
    const results = await mapLimit(['a', 'b', 'c'], 2, async (value, index) => `${index}:${value}`);
    expectEqual(results, ['0:a', '1:b', '2:c']);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a limiter holds callers to its ceiling',
  async () => {
    const limited = createLimiter(2);
    let running = 0;
    let peak = 0;

    const work = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return 'done';
    };

    const all = await Promise.all([1, 2, 3, 4, 5].map(() => limited(work)));

    expectEqual(all.length, 5);
    expectTrue(peak <= 2);
  },
  { concept: 'javascript.async.concurrency' },
);
