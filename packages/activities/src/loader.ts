// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';

import type { JsonValue } from '@code-retrainer/core';
import { toError } from '@code-retrainer/core';
import { parse as parseYaml } from 'yaml';
import type { ZodError } from 'zod';

import type { Activity } from './model.ts';
import { activityFileSchema } from './schema.ts';

export class ActivityLoadError extends Error {
  constructor(
    readonly file: string,
    message: string,
    options?: { cause?: Error },
  ) {
    super(`${file}: ${message}`, options);
    this.name = 'ActivityLoadError';
  }
}

/**
 * Load every activity in one YAML file.
 *
 * Activities come in files of ten to thirty rather than a directory each, the
 * way exercises do. An exercise is a workspace — starter files, tests, a
 * solution — and needs a directory. An activity is twelve lines, and giving
 * each one a folder would make writing two hundred of them a filing exercise
 * instead of a writing one.
 */
export async function loadActivities(file: string): Promise<readonly Activity[]> {
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (caught) {
    throw new ActivityLoadError(file, 'cannot be read', { cause: toError(caught) });
  }

  let parsed: JsonValue;
  try {
    parsed = parseYaml(raw) as JsonValue;
  } catch (caught) {
    throw new ActivityLoadError(file, 'is not valid YAML', { cause: toError(caught) });
  }

  const result = activityFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new ActivityLoadError(file, describe(result.error));
  }

  const seen = new Set<string>();
  for (const activity of result.data.activities) {
    if (seen.has(activity.id)) {
      throw new ActivityLoadError(file, `two activities share the id '${activity.id}'`);
    }
    seen.add(activity.id);
  }

  return result.data.activities;
}

/**
 * Every activity for one language.
 *
 * Reads `<language>/activities/*.yaml`, in filename order so a numbered set
 * loads in the order it was written. Ids are checked across the whole language
 * rather than per file, because a duplicate that spans two files is the one
 * nobody notices.
 */
export async function loadActivitiesForLanguage(root: string): Promise<readonly Activity[]> {
  const directory = path.join(root, 'activities');

  let entries: string[];
  try {
    entries = (await fs.readdir(directory)).filter((name) => name.endsWith('.yaml')).sort();
  } catch {
    // A language with no activities yet is not an error; it is the normal
    // state of a language somebody has just started writing.
    return [];
  }

  const all: Activity[] = [];
  const seen = new Map<string, string>();

  for (const entry of entries) {
    const file = path.join(directory, entry);
    for (const activity of await loadActivities(file)) {
      const previous = seen.get(activity.id);
      if (previous !== undefined) {
        throw new ActivityLoadError(file, `id '${activity.id}' is already used in ${previous}`);
      }
      seen.set(activity.id, entry);
      all.push(activity);
    }
  }

  return all;
}

/** Zod's issue list, flattened into something a content author can act on. */
function describe(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
