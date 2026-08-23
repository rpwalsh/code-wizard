// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';

import { checkActivities } from '@code-retrainer/activities';
import { bundleSizeBytes, parseBundle, toBundle } from '@code-retrainer/exercises';

import { collectActivitySets } from '../activity-sources.ts';
import { createContext, relativeToRepository, repositoryRoot } from '../context.ts';
import { columns, heading, indent, style, symbol } from '../terminal.ts';
import type { Flags } from './runtime.ts';

const DEFAULT_OUTPUT = 'apps/web/public/content/catalog.json';
const ACTIVITY_OUTPUT = 'apps/web/public/content/activities.json';

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
    case 'activities':
      return bundleActivities(flags);
    default:
      console.error(style.red(`Unknown content command "${subcommand}".`));
      console.error('Try: code-retrainer content bundle | activities | inspect');
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
      console.error(indent(style.gray(failure.message), 4));
    }
    // Publishing a bundle that silently omits broken exercises would ship a
    // curriculum with holes nobody notices until a learner hits one.
    console.error(style.red('\nRefusing to bundle while any exercise is broken.'));
    return 1;
  }

  const output = path.resolve(repositoryRoot, flagString(flags, 'out') ?? DEFAULT_OUTPUT);

  // A bundle must not contain a language the target cannot run. The website
  // ships CPython in WebAssembly and nothing else, so bundling JavaScript
  // there would put skills on the map whose exercises cannot be attempted —
  // which is a dead end wearing the clothes of a curriculum.
  const languages = (flagString(flags, 'language') ?? 'python')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const exercises = context.catalog.all().filter((entry) => languages.includes(entry.language));
  // A skill with no language is a cross-language concept and belongs in every
  // bundle.
  const skills = context.skillGraph
    .all()
    .filter((skill) => skill.language === null || languages.includes(skill.language));

  if (exercises.length === 0) {
    console.error(style.red(`No exercises for: ${languages.join(', ')}.`));
    return 2;
  }

  const document = toBundle(exercises, skills, {
    relativize: (directory) => relativeToRepository(directory),
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
      ['languages', languages.join(', ')],
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

/**
 * Emit every activity, for every curriculum, as one file the website can read.
 *
 * Separate from the exercise bundle, and deliberately not filtered by
 * language. The exercise bundle must exclude anything the target cannot run,
 * because an exercise you cannot attempt is a dead end. An activity has no
 * such constraint — it is answered by reading — so every curriculum ships,
 * including the fifteen with no runtime behind them. That is the entire reason
 * this exists: it is what turns "designed, unusable" into "practisable today".
 */
async function bundleActivities(flags: Flags): Promise<number> {
  const output = path.resolve(repositoryRoot, flagString(flags, 'out') ?? ACTIVITY_OUTPUT);
  const sets = await collectActivitySets();

  const problems = sets.flatMap((set) => checkActivities(set.activities));
  if (problems.length > 0) {
    console.error(heading(`${problems.length} malformed activity/activities`));
    for (const problem of problems) console.error(`${symbol.fail} ${problem}`);
    // A wrong answer key ships silently and marks correct answers wrong. It is
    // the one content failure with no visible symptom, so it stops the build.
    console.error('');
    console.error(style.red('Refusing to bundle while any activity is malformed.'));
    return 1;
  }

  const document = JSON.stringify({ curricula: sets });
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, document, 'utf8');

  const total = sets.reduce((sum, set) => sum + set.activities.length, 0);
  console.log(heading('Activity bundle'));
  console.log(
    columns([
      ['courses', String(sets.length)],
      ['with exercises too', String(sets.filter((set) => set.runnable).length)],
      ['activities', String(total)],
      ['size', `${(Buffer.byteLength(document, 'utf8') / 1024).toFixed(1)} KiB`],
      ['written to', relativeToRepository(output)],
    ]),
  );
  return 0;
}
