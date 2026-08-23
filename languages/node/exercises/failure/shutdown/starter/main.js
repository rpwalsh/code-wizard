// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Draining, refusing, and the loop's actual order.
 */
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export function createWorkTracker() {
  throw new Error('not implemented');
}

export async function runPipeline(chunks, transform) {
  throw new Error('not implemented');
}

export async function observeOrder() {
  throw new Error('not implemented');
}
