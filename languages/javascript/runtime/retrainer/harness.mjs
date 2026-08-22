/**
 * The Node entry point for the test harness.
 *
 * Parses arguments, imports the files it is given, and writes one JSON
 * document describing every case. The TypeScript side reads that document
 * directly and never parses human-readable output, for the same reason the
 * Python side does not: scraped output is a contract nobody agreed to, and it
 * breaks on a version bump nobody noticed.
 *
 * All the actual running lives in `run.js`, which the browser worker uses too.
 * This file is only the part that knows about `process` and the disk.
 *
 * It lives inside the `retrainer` package rather than beside it, and is run
 * from the copy inside the sandbox, so that its `./run.js` and the test file's
 * `retrainer/test.js` resolve to the same URLs. Two paths to the same source
 * are two modules with two separate registries, and an earlier version
 * collected tests into a registry nobody ever read — reporting zero cases,
 * cheerfully, with no error anywhere.
 *
 * Usage: node node_modules/retrainer/harness.mjs --report <path> <testFile>...
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { runTargets } from './run.js';

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

const { report, files } = parseArguments(process.argv.slice(2));

const document = await runTargets(
  files.map((file) => ({
    path: file,
    // Imported by URL rather than by path, which is what makes this behave
    // identically on Windows.
    load: () => import(pathToFileURL(path.resolve(file)).href),
  })),
);

if (report) {
  const directory = path.dirname(report);
  if (directory) await mkdir(directory, { recursive: true });
  await writeFile(report, JSON.stringify(document), 'utf8');
}

process.exitCode = document.exitStatus;
