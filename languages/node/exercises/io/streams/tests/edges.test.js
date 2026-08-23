// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Absence, emptiness and the difference between them. */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

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
  'an error that is not a missing file is rethrown',
  async () => {
    // A path containing a NUL byte is refused by Node itself, on every
    // platform, with a code that is not ENOENT. Without the code check every
    // error would be reported as 'missing' and the real failure — a bad
    // path, a permission problem — would vanish into a plausible answer.
    const poisoned = `poisoned${String.fromCharCode(0)}.txt`;

    let caught = null;
    try {
      await summarize(poisoned);
    } catch (error) {
      caught = error;
    }
    expectTrue(caught !== null, 'the unexpected error must escape');
    expectTrue(caught.code !== 'ENOENT', 'and it is not a missing-file error');
  },
  { concept: 'node.io.streams' },
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
