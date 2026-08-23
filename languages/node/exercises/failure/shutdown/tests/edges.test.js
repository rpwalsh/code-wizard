// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Double-done, failing transforms, and the loop's order. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createWorkTracker, observeOrder, runPipeline } from '../main.js';

test(
  'done is idempotent',
  async () => {
    const tracker = createWorkTracker();
    const first = tracker.begin();
    const second = tracker.begin();

    // The first unit finishes twice — handler and error handler both
    // firing. If it decremented twice, shutdown would resolve now with
    // the second unit still running.
    first();
    first();

    let drained = false;
    const waiting = tracker.shutdown().then(() => {
      drained = true;
    });
    await Promise.resolve();
    expectEqual(drained, false);

    second();
    await waiting;
    expectTrue(drained);
  },
  { concept: 'node.failure.shutdown' },
);

test(
  'repeated shutdowns share one promise',
  async () => {
    const tracker = createWorkTracker();
    expectTrue(tracker.shutdown() === tracker.shutdown());
  },
  { concept: 'node.failure.shutdown' },
);

test(
  'a throwing transform rejects the pipeline with its error',
  async () => {
    let caught = null;
    try {
      await runPipeline([1, 2, 3], (n) => {
        if (n === 2) throw new Error('bad chunk');
        return n;
      });
    } catch (error) {
      caught = error;
    }
    expectTrue(caught !== null && caught.message === 'bad chunk');
  },
  { concept: 'node.io.pipelines' },
);

test(
  'an empty pipeline resolves to an empty list',
  async () => {
    expectEqual(await runPipeline([], (n) => n), []);
  },
  { concept: 'node.io.pipelines' },
);

test(
  'sync beats microtasks beat both macrotask queues',
  async () => {
    const order = await observeOrder();
    expectEqual(order.slice(0, 2), ['sync', 'microtask']);
    // timeout versus immediate from the main context is famously a race —
    // Node documents it as nondeterministic — so the assertion stops at
    // the truth: both ran, after every microtask.
    expectEqual([...order.slice(2)].sort(), ['immediate', 'timeout']);
  },
  { concept: 'node.runtime.eventloop' },
);
