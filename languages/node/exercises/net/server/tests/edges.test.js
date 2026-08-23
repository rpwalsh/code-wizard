// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Bad bodies, absent parameters, and the clocks. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createApp, fetchJson, startServer, timed } from '../main.js';

async function withServer(run) {
  const { port, close } = await startServer(createApp());
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await close();
  }
}

test(
  'a malformed body is a 400, not a crash',
  async () => {
    await withServer(async (base) => {
      const { status, body } = await fetchJson(`${base}/sum`, {
        method: 'POST',
        body: '{not json',
      });
      expectEqual(status, 400);
      expectEqual(body, { error: 'bad json' });
    });
  },
  { concept: 'node.net.http-server' },
);

test(
  'a JSON object that is not an array is bad json too',
  async () => {
    await withServer(async (base) => {
      const { status } = await fetchJson(`${base}/sum`, {
        method: 'POST',
        body: '{"a":1}',
      });
      expectEqual(status, 400);
    });
  },
  { concept: 'node.net.http-server' },
);

test(
  'echo without a message echoes emptiness',
  async () => {
    await withServer(async (base) => {
      expectEqual((await fetchJson(`${base}/echo`)).body, { echo: '' });
    });
  },
  { concept: 'node.net.http-client' },
);

test(
  'two servers on port zero coexist',
  async () => {
    // The whole reason for the ephemeral port: parallel runs cannot collide.
    const first = await startServer(createApp());
    const second = await startServer(createApp());
    try {
      expectTrue(first.port !== second.port);
    } finally {
      await first.close();
      await second.close();
    }
  },
  { concept: 'node.operations.testing' },
);

test(
  'timed measures with a monotonic clock',
  async () => {
    const { result, elapsedMs } = await timed(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'done';
    });
    expectEqual(result, 'done');
    expectTrue(elapsedMs >= 10, 'the delay is visible in the measurement');
    expectTrue(elapsedMs < 2000, 'and it is a duration, not a timestamp');
  },
  { concept: 'node.operations.performance' },
);
