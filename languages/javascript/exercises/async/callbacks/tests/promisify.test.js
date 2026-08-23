// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { promisify, retry, sequence, sleep } from '../main.js';

// A callback-style API to wrap: parses on the next tick, error-first.
function parseLater(text, callback) {
  setTimeout(() => {
    try {
      callback(null, JSON.parse(text));
    } catch (error) {
      callback(error);
    }
  }, 1);
}

test(
  'a callback success becomes a resolution',
  async () => {
    const parse = promisify(parseLater);
    expectEqual(await parse('{"ok":true}'), { ok: true });
  },
  { concept: 'javascript.async.callbacks' },
);

test(
  'a callback error becomes a rejection',
  async () => {
    const parse = promisify(parseLater);
    let caught = null;
    try {
      await parse('{nope');
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof SyntaxError);
  },
  { concept: 'javascript.async.callbacks' },
);

test(
  'sequence feeds each result to the next step',
  async () => {
    const result = await sequence(
      [async (n) => n + 1, async (n) => n * 10, async (n) => `got ${n}`],
      4,
    );
    expectEqual(result, 'got 50');
  },
  { concept: 'javascript.async.await' },
);

test(
  'retry succeeds once the operation does',
  async () => {
    let calls = 0;
    const flaky = async () => {
      calls += 1;
      if (calls < 3) throw new Error('not yet');
      return 'finally';
    };

    expectEqual(await retry(flaky, 5, 1), 'finally');
    expectEqual(calls, 3);
  },
  { concept: 'javascript.async.await' },
);
