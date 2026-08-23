// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** A real round trip, no mocks anywhere. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { createApp, fetchJson, startServer } from '../main.js';

async function withServer(run) {
  const { port, close } = await startServer(createApp());
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await close();
  }
}

test(
  'health answers ok',
  async () => {
    await withServer(async (base) => {
      expectEqual(await fetchJson(`${base}/health`), { status: 200, body: { ok: true } });
    });
  },
  { concept: 'node.net.http-server' },
);

test(
  'echo reads the query string',
  async () => {
    await withServer(async (base) => {
      const { body } = await fetchJson(`${base}/echo?msg=hello`);
      expectEqual(body, { echo: 'hello' });
    });
  },
  { concept: 'node.net.http-server' },
);

test(
  'sum adds a posted array',
  async () => {
    await withServer(async (base) => {
      const { status, body } = await fetchJson(`${base}/sum`, {
        method: 'POST',
        body: JSON.stringify([1, 2, 3, 4]),
      });
      expectEqual(status, 200);
      expectEqual(body, { sum: 10 });
    });
  },
  { concept: 'node.net.http-client' },
);

test(
  'unknown routes are 404',
  async () => {
    await withServer(async (base) => {
      expectEqual((await fetchJson(`${base}/nope`)).status, 404);
    });
  },
  { concept: 'node.net.http-server' },
);
