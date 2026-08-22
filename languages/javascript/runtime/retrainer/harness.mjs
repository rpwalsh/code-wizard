/**
 * The test harness.
 *
 * Runs the test files it is given and writes one JSON document describing
 * every case. The TypeScript side reads that document directly and never
 * parses human-readable output, for the same reason the Python side does not:
 * scraped output is a contract nobody agreed to and it breaks on a version
 * bump nobody noticed.
 *
 * The shape written here is deliberately identical to the one the Python
 * plugin writes. The engine above the runtime must not be able to tell which
 * language produced a result.
 *
 * It lives inside the `retrainer` package rather than beside it, and is run
 * from the copy inside the sandbox, so that its `./test.js` and the test
 * file's `retrainer/test.js` resolve to the same URL. Two paths to the same
 * source are two modules with two separate registries, and the first version
 * of this collected tests into a registry nobody ever read — reporting zero
 * cases, cheerfully, with no error anywhere.
 *
 * Usage: node node_modules/retrainer/harness.mjs --report <path> <testFile>...
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { collected, reset } from './test.js';

const SCHEMA = 1;

function parseArguments(argv) {
  let report = null;
  const files = [];

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--report') {
      report = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    files.push(argv[index]);
  }

  return { report, files };
}

/** The first frame of a stack that points at the file being run. */
function locate(stack, file) {
  const name = path.basename(file);
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
    // No structured data, so the message is all there is.
    record.message = `${error.name}: ${error.message}`;
  }

  if (error.retrainerConcept) record.concept = String(error.retrainerConcept);

  if (expected === null && received === null) {
    record.received = `${error.name}: ${error.message}`;
  }

  return record;
}

async function run() {
  const { report, files } = parseArguments(process.argv.slice(2));
  const cases = [];
  const collectionErrors = [];
  let failed = false;

  for (const file of files) {
    reset();

    try {
      // A fresh URL per file is unnecessary here — the process is short-lived
      // and each file is imported once — but importing by URL rather than by
      // path is what makes this work identically on Windows.
      await import(pathToFileURL(path.resolve(file)).href);
    } catch (error) {
      failed = true;
      collectionErrors.push({
        path: file,
        message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
      continue;
    }

    for (const registered of collected()) {
      const started = performance.now();
      const record = {
        id: `${file}::${registered.name}`,
        file,
        name: registered.name,
        status: 'passed',
        durationMs: 0,
        location: locate(registered.site, file),
      };
      if (registered.concept) record.concept = registered.concept;

      try {
        // Awaited so an async test is a test rather than a promise nobody
        // looked at — which passes, silently, always.
        await registered.body();
      } catch (error) {
        failed = true;
        record.status = 'failed';
        Object.assign(record, describe(error));
        if (registered.concept && !record.concept) record.concept = registered.concept;
      }

      record.durationMs = Math.round(performance.now() - started);
      cases.push(record);
    }
  }

  const document = {
    schema: SCHEMA,
    exitStatus: failed ? 1 : 0,
    collectionErrors,
    cases,
  };

  if (report) {
    const directory = path.dirname(report);
    if (directory) await mkdir(directory, { recursive: true });
    await writeFile(report, JSON.stringify(document), 'utf8');
  }

  process.exitCode = document.exitStatus;
}

await run();
