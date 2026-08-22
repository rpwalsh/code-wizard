import fs from 'node:fs/promises';
import path from 'node:path';

import { bundleSizeBytes, parseBundle, toBundle } from '@code-retrainer/exercises';

import { createContext, relativeToRepository, repositoryRoot } from '../context.ts';
import { columns, heading, indent, style, symbol } from '../terminal.ts';
import type { Flags } from './runtime.ts';

const DEFAULT_OUTPUT = 'apps/web/public/content/catalog.json';

function flagString(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

export async function runContentCommand(args: readonly string[], flags: Flags): Promise<number> {
  const [subcommand] = args;

  switch (subcommand) {
    case undefined:
    case 'bundle':
      return bundle(flags);
    case 'inspect':
      return inspect(flags);
    default:
      console.error(style.red(`Unknown content command "${subcommand}".`));
      console.error('Try: code-retrainer content bundle [--out <path>]');
      return 2;
  }
}

/**
 * Emit the whole curriculum as one JSON file for the web build.
 *
 * A static host has no filesystem to walk, so the loader that reads exercise
 * directories cannot run there. This is that loader, run once at build time.
 */
async function bundle(flags: Flags): Promise<number> {
  const context = await createContext();

  if (context.loadFailures.length > 0) {
    console.error(heading(`${context.loadFailures.length} exercise(s) failed to load`));
    for (const failure of context.loadFailures) {
      console.error(`${symbol.fail} ${relativeToRepository(failure.directory)}`);
      console.error(indent(style.grey(failure.message), 4));
    }
    // Publishing a bundle that silently omits broken exercises would ship a
    // curriculum with holes nobody notices until a learner hits one.
    console.error(style.red('\nRefusing to bundle while any exercise is broken.'));
    return 1;
  }

  const output = path.resolve(repositoryRoot, flagString(flags, 'out') ?? DEFAULT_OUTPUT);

  const document = toBundle(context.catalog.all(), context.skillGraph.all(), {
    relativise: (directory) => relativeToRepository(directory),
  });

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(document), 'utf8');

  const bytes = bundleSizeBytes(document);
  console.log(heading('Content bundle'));
  console.log(
    columns([
      ['exercises', String(document.exercises.length)],
      ['skills', String(document.skills.length)],
      ['size', `${(bytes / 1024).toFixed(1)} KiB`],
      ['written to', relativeToRepository(output)],
    ]),
  );
  return 0;
}

async function inspect(flags: Flags): Promise<number> {
  const target = path.resolve(repositoryRoot, flagString(flags, 'out') ?? DEFAULT_OUTPUT);

  let raw: string;
  try {
    raw = await fs.readFile(target, 'utf8');
  } catch {
    console.error(style.red(`No bundle at ${relativeToRepository(target)}.`));
    console.error('Build one with: code-retrainer content bundle');
    return 2;
  }

  const document = parseBundle(raw);
  console.log(heading(`Bundle at ${relativeToRepository(target)}`));
  console.log(
    columns([
      ['generated', document.generatedAt],
      ['exercises', String(document.exercises.length)],
      ['skills', String(document.skills.length)],
      ['size', `${(bundleSizeBytes(document) / 1024).toFixed(1)} KiB`],
    ]),
  );
  return 0;
}
