// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Running registered tests, wherever they came from.
 *
 * Deliberately knows nothing about files, arguments or output. The Node entry
 * point hands it paths and writes the result to disk; the browser worker hands
 * it blob URLs and posts the result back. Splitting the two is what stops the
 * browser needing a filesystem, and what keeps both producing byte-identical
 * reports.
 */
import { collected, reset } from './test.js';

const SCHEMA = 1;

/** The first frame of a stack that points at the file being run. */
function locate(stack, file) {
  const name = file.split('/').pop() ?? file;
  for (const line of String(stack).split('\n')) {
    if (!line.includes(name)) continue;
    const match = /:(\d+):\d+\)?\s*$/.exec(line.trim());
    if (match) return { path: file, line: Number(match[1]) };
  }
  return { path: file, line: 0 };
}

/** Pull the structured expectation off an error, or fall back to its message. */
function describe(error) {
  const record = {};

  if (!(error instanceof Error)) {
    record.exceptionType = typeof error;
    record.received = String(error);
    record.message = String(error);
    return record;
  }

  record.exceptionType = error.name;

  const expected = error.retrainerExpected ?? null;
  const received = error.retrainerReceived ?? null;
  if (expected !== null) record.expected = String(expected);
  if (received !== null) record.received = String(received);

  if (error.retrainerMessage) {
    record.message = String(error.retrainerMessage);
  } else if (expected === null && received === null) {
    record.message = `${error.name}: ${error.message}`;
    record.received = `${error.name}: ${error.message}`;
  }

  if (error.retrainerConcept) record.concept = String(error.retrainerConcept);
  return record;
}

/**
 * Run every file and return the report document.
 *
 * `targets` is a list of `{ path, load }`, where `load` imports the file.
 * Importing is the caller's job because the two environments disagree about
 * what a module specifier is, and that disagreement is the only difference
 * between them.
 */
export async function runTargets(targets) {
  const cases = [];
  const collectionErrors = [];
  let failed = false;

  for (const target of targets) {
    reset();

    try {
      await target.load();
    } catch (error) {
      failed = true;
      collectionErrors.push({
        path: target.path,
        message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
      continue;
    }

    for (const registered of collected()) {
      const started = now();
      const record = {
        id: `${target.path}::${registered.name}`,
        file: target.path,
        name: registered.name,
        status: 'passed',
        durationMs: 0,
        location: locate(registered.site, target.path),
      };
      if (registered.concept) record.concept = registered.concept;

      try {
        // Awaited, so an async test is a test rather than a promise nobody
        // looked at — which passes, silently, always.
        await registered.body();
      } catch (error) {
        failed = true;
        record.status = 'failed';
        Object.assign(record, describe(error));
        if (registered.concept && !record.concept) record.concept = registered.concept;
      }

      record.durationMs = Math.round(now() - started);
      cases.push(record);
    }
  }

  return {
    schema: SCHEMA,
    exitStatus: failed ? 1 : 0,
    collectionErrors,
    cases,
  };
}

function now() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
