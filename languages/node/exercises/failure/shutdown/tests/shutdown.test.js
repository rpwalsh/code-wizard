// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary lifecycle. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createWorkTracker, runPipeline } from '../main.js';

test(
  'idle shutdown resolves immediately',
  async () => {
    const tracker = createWorkTracker();
    await tracker.shutdown();
    expectTrue(tracker.shuttingDown());
  },
  { concept: 'node.failure.shutdown' },
);

test(
  'shutdown waits for begun work',
  async () => {
    const tracker = createWorkTracker();
    const done = tracker.begin();

    let drained = false;
    const waiting = tracker.shutdown().then(() => {
      drained = true;
    });

    await Promise.resolve();
    expectEqual(drained, false);

    done();
    await waiting;
    expectTrue(drained);
  },
  { concept: 'node.failure.shutdown' },
);

test(
  'new work is refused after the signal',
  async () => {
    const tracker = createWorkTracker();
    void tracker.shutdown();
    expectEqual(tracker.begin(), null);
  },
  { concept: 'node.failure.shutdown' },
);

test(
  'a pipeline transforms in order',
  async () => {
    const doubled = await runPipeline([1, 2, 3], (n) => n * 2);
    expectEqual(doubled, [2, 4, 6]);
  },
  { concept: 'node.io.pipelines' },
);
