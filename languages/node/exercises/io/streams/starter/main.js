// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';

/**
 * Count the lines in a file, without loading it all at once.
 *
 * @param {string} path
 * @returns {Promise<number>}
 */
export async function countLines(path) {
  throw new Error('not implemented');
}

/**
 * Describe a path: its line count, or why it could not be read.
 *
 * @param {string} path
 * @returns {Promise<{ ok: true, lines: number } | { ok: false, reason: string }>}
 */
export async function summarize(path) {
  throw new Error('not implemented');
}
