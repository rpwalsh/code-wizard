// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The one that catches readFile. */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { countLines } from '../main.js';

test(
  'a file with many lines is counted correctly',
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'retrainer-'));
    const target = path.join(directory, 'big.txt');
    await writeFile(
      target,
      Array.from({ length: 50_000 }, (_, i) => `line ${i}`).join('\n'),
      'utf8',
    );
    expectEqual(await countLines(target), 50_000);
  },
  { concept: 'node.io.streams' },
);

test(
  'counting a large file does not hold it all in memory',
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'retrainer-'));
    const target = path.join(directory, 'huge.txt');
    // Roughly 40 MB. readFile would allocate all of it at once; a stream
    // never holds more than a chunk.
    const block = `${'x'.repeat(999)}\n`.repeat(1000);
    await writeFile(target, block.repeat(40), 'utf8');

    global.gc?.();
    const before = process.memoryUsage().heapUsed;
    const lines = await countLines(target);
    const grew = process.memoryUsage().heapUsed - before;

    expectEqual(lines, 40_000);
    // Generous: the point is that growth does not track the file size.
    expectTrue(grew < 20_000_000, `heap grew by ${grew} bytes`);
  },
  { concept: 'node.io.streams' },
);
