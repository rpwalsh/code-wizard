// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { countLines, summarize } from '../main.js';

async function fileWith(contents) {
  const directory = await mkdtemp(path.join(tmpdir(), 'retrainer-'));
  const target = path.join(directory, 'data.txt');
  await writeFile(target, contents, 'utf8');
  return target;
}

test(
  'counts the lines in a small file',
  async () => {
    expectEqual(await countLines(await fileWith('a\nb\nc\n')), 3);
  },
  { concept: 'node.io.files' },
);

test(
  'a missing trailing newline does not change the count',
  async () => {
    expectEqual(await countLines(await fileWith('a\nb\nc')), 3);
  },
  { concept: 'node.io.files' },
);

test(
  'summarize reports a real file',
  async () => {
    const result = await summarize(await fileWith('one\ntwo\n'));
    expectEqual(result.ok, true);
    expectEqual(result.lines, 2);
  },
  { concept: 'node.io.files' },
);
