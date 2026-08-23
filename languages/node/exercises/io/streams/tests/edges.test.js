// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Absence, emptiness and the difference between them. */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { countLines, summarize } from '../main.js';

test(
  'an empty file has no lines',
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'retrainer-'));
    const target = path.join(directory, 'empty.txt');
    await writeFile(target, '', 'utf8');
    expectEqual(await countLines(target), 0);
  },
  { concept: 'node.io.files' },
);

test(
  'a missing file is a reason, not a crash',
  async () => {
    const result = await summarize(path.join(tmpdir(), 'definitely-not-here-8f2a'));
    expectEqual(result.ok, false);
    expectEqual(result.reason, 'missing');
  },
  { concept: 'node.failure.async' },
);

test(
  'a directory is not a file',
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'retrainer-'));
    const result = await summarize(directory);
    expectEqual(result.ok, false);
    expectEqual(result.reason, 'not a file');
  },
  { concept: 'node.failure.async' },
);
