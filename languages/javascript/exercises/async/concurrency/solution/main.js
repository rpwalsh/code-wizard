// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Doing many things at once, but not all of them at once.
 */

export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  // One worker per slot, each pulling the next index when it finishes.
  // Chunking instead — ten at a time, wait for all ten — idles the whole
  // pool while the slowest of each batch finishes.
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      // Written to its own slot, so the output order is the input order
      // regardless of which task finished first.
      results[index] = await worker(items[index], index);
    }
  }

  const slots = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: slots }, () => run()));
  return results;
}

export function createLimiter(limit) {
  let active = 0;
  const waiting = [];

  const release = () => {
    active -= 1;
    const resume = waiting.shift();
    if (resume) resume();
  };

  return async function limited(work) {
    if (active >= limit) {
      // Park until a slot frees. The queue is first in, first out, so a
      // caller cannot be starved by later arrivals.
      await new Promise((resolve) => waiting.push(resolve));
    }

    active += 1;
    try {
      return await work();
    } finally {
      // In a finally, so a failing task frees its slot. Releasing only on
      // success deadlocks the pool the first time anything throws.
      release();
    }
  };
}
