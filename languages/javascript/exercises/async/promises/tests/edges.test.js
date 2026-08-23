// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Concurrency: what runs when, and how much at once. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { fetchAll, fetchLimited, fetchSettled } from '../main.js';

test(
  'no tasks is an empty result, not a hang',
  async () => {
    expectEqual(await fetchAll([]), []);
    expectEqual(await fetchSettled([]), []);
    expectEqual(await fetchLimited([], 3), []);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'fetchAll starts every task before any finishes',
  async () => {
    let started = 0;
    const task = () => {
      started += 1;
      return new Promise((resolve) => setTimeout(resolve, 5));
    };

    const pending = fetchAll([task, task, task]);
    // All three ran synchronously at the start; none has resolved yet.
    expectEqual(started, 3);
    await pending;
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'fetchLimited never exceeds its limit',
  async () => {
    let running = 0;
    let peak = 0;
    const task = () => {
      running += 1;
      peak = Math.max(peak, running);
      return new Promise((resolve) =>
        setTimeout(() => {
          running -= 1;
          resolve('done');
        }, 2),
      );
    };

    await fetchLimited(Array.from({ length: 9 }, () => task), 3);
    expectEqual(peak, 3);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'fetchLimited still returns results in input order',
  async () => {
    const delays = [15, 1, 8, 1, 12];
    const tasks = delays.map((ms, index) =>
      () => new Promise((resolve) => setTimeout(() => resolve(index), ms)),
    );

    const results = await fetchLimited(tasks, 2);
    expectEqual(results.map((result) => result.value), [0, 1, 2, 3, 4]);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'fetchLimited collects failures like fetchSettled does',
  async () => {
    const tasks = [
      () => Promise.resolve('fine'),
      () => Promise.reject(new Error('boom')),
    ];
    const results = await fetchLimited(tasks, 1);
    expectEqual(results[0], { ok: true, value: 'fine' });
    expectEqual(results[1].ok, false);
  },
  { concept: 'javascript.async.errors' },
);

test(
  'a limit larger than the task list is harmless',
  async () => {
    const results = await fetchLimited([() => Promise.resolve(1)], 50);
    expectEqual(results, [{ ok: true, value: 1 }]);
  },
  { concept: 'javascript.async.concurrency' },
);
