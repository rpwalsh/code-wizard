// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: nothing to do, a limit past the work, and the failing task. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createLimiter, mapLimit } from '../main.js';

test(
  'an empty list resolves to an empty list',
  async () => {
    // Naively spawning `limit` workers over no work must still terminate.
    expectEqual(await mapLimit([], 4, async (value) => value), []);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a limit larger than the work does not start idle workers',
  async () => {
    let started = 0;
    const results = await mapLimit([1, 2], 10, async (value) => {
      started += 1;
      return value;
    });

    expectEqual(results, [1, 2]);
    expectEqual(started, 2);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a limit of one runs strictly one at a time',
  async () => {
    let running = 0;
    let peak = 0;

    await mapLimit([1, 2, 3], 1, async (value) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 2));
      running -= 1;
      return value;
    });

    expectEqual(peak, 1);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a failing task rejects the whole call',
  async () => {
    let message = '';
    try {
      await mapLimit([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error('task two failed');
        return value;
      });
    } catch (error) {
      message = error.message;
    }

    expectEqual(message, 'task two failed');
  },
  { concept: 'javascript.async.errors' },
);

test(
  'a limiter frees its slot even when the work throws',
  async () => {
    const limited = createLimiter(1);

    let failed = false;
    try {
      await limited(async () => {
        throw new Error('boom');
      });
    } catch {
      failed = true;
    }
    expectTrue(failed);

    // Releasing only on success deadlocks the pool the first time anything
    // throws, and the symptom is a service that stops responding rather
    // than one that reports an error.
    const after = await limited(async () => 'still works');
    expectEqual(after, 'still works');
  },
  { concept: 'javascript.async.errors' },
);

test(
  'a limiter admits waiting callers in the order they arrived',
  async () => {
    const limited = createLimiter(1);
    const order = [];

    const hold = limited(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push('first');
    });

    // Queued behind the holder, and each other.
    const second = limited(async () => {
      order.push('second');
    });
    const third = limited(async () => {
      order.push('third');
    });

    await Promise.all([hold, second, third]);
    expectEqual(order, ['first', 'second', 'third']);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a limiter returns whatever the work returned',
  async () => {
    const limited = createLimiter(3);
    expectEqual(await limited(async () => 42), 42);
    expectEqual(await limited(async () => null), null);
    expectEqual(await limited(async () => undefined), undefined);
  },
  { concept: 'javascript.async.concurrency' },
);

test(
  'a limiter still holds the ceiling for callers arriving later',
  async () => {
    // The first burst drains the pool. A release that subtracts too much
    // leaves the count below zero, and the next burst walks straight past
    // the check — a ceiling that quietly stops being one after the first
    // batch, which is exactly when nobody is watching any more.
    const limited = createLimiter(2);

    const burst = async () => {
      let running = 0;
      let peak = 0;
      await Promise.all(
        [1, 2, 3, 4].map(() =>
          limited(async () => {
            running += 1;
            peak = Math.max(peak, running);
            await new Promise((resolve) => setTimeout(resolve, 5));
            running -= 1;
          }),
        ),
      );
      return peak;
    };

    expectTrue((await burst()) <= 2);
    expectTrue((await burst()) <= 2);
    expectTrue((await burst()) <= 2);
  },
  { concept: 'javascript.async.concurrency' },
);
