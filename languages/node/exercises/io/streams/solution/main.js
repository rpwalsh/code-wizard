// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';

/**
 * Count the lines in a file, one chunk at a time.
 *
 * `crlfDelay: Infinity` makes a CRLF pair count as one break rather than two,
 * so a file written on Windows does not report twice as many lines.
 */
export async function countLines(path) {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  });

  let count = 0;
  for await (const line of rl) {
    void line;
    count += 1;
  }
  return count;
}

export async function summarize(path) {
  let stats;
  try {
    stats = await stat(path);
  } catch (error) {
    // A missing file is an expected outcome of asking about a path, not an
    // exceptional one. Anything else is genuinely unexpected and rethrown.
    if (error && error.code === 'ENOENT') return { ok: false, reason: 'missing' };
    throw error;
  }

  if (!stats.isFile()) return { ok: false, reason: 'not a file' };
  return { ok: true, lines: await countLines(path) };
}
