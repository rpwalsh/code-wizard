// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Draining, refusing, and the loop's actual order.
 */
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export function createWorkTracker() {
  let inFlight = 0;
  let stopping = false;
  let resolveDrained;
  const drained = new Promise((resolve) => {
    resolveDrained = resolve;
  });

  const settle = () => {
    if (stopping && inFlight === 0) {
      resolveDrained();
    }
  };

  return {
    begin() {
      // The refusal half: no new work once shutdown has begun.
      if (stopping) return null;
      inFlight += 1;

      let finished = false;
      return () => {
        // Idempotent: a response handler and an error handler both firing
        // must count once, or shutdown resolves with work still running.
        if (finished) return;
        finished = true;
        inFlight -= 1;
        settle();
      };
    },
    shuttingDown: () => stopping,
    shutdown() {
      stopping = true;
      settle();
      return drained;
    },
  };
}

export async function runPipeline(chunks, transform) {
  const collected = [];

  await pipeline(
    Readable.from(chunks),
    new Transform({
      objectMode: true,
      transform(chunk, _encoding, callback) {
        // pipeline propagates this error and tears the whole chain down —
        // the cleanup .pipe never did.
        try {
          callback(null, transform(chunk));
        } catch (error) {
          callback(error);
        }
      },
    }),
    new Writable({
      objectMode: true,
      write(chunk, _encoding, callback) {
        collected.push(chunk);
        callback();
      },
    }),
  );

  return collected;
}

export async function observeOrder() {
  const order = [];

  order.push('sync');
  queueMicrotask(() => order.push('microtask'));
  const timer = new Promise((resolve) =>
    setTimeout(() => {
      order.push('timeout');
      resolve();
    }, 0),
  );
  const immediate = new Promise((resolve) =>
    setImmediate(() => {
      order.push('immediate');
      resolve();
    }),
  );

  await Promise.all([timer, immediate]);
  return order;
}
