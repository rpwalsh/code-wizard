import type { JsonValue, Skill } from '@forge/core';
import { isJsonObject, parseJson, readNumber, readString, toError } from '@forge/core';

import { toExercise, toSkill } from './bundle-parse.ts';
import { ExerciseCatalog } from './catalog.ts';
import type { Exercise } from './model.ts';

export const BUNDLE_FORMAT = 'forge-content';
export const BUNDLE_VERSION = 1;

/**
 * A whole curriculum as one JSON document.
 *
 * The desktop build reads exercises from directories on disk. A static web
 * host has no filesystem to walk, so the same content is emitted at build time
 * and fetched as a single file. Both end up with an identical `ExerciseCatalog`
 * — the difference stops at the loader.
 */
export interface ContentBundle {
  readonly format: string;
  readonly version: number;
  readonly generatedAt: string;
  readonly skills: readonly Skill[];
  readonly exercises: readonly BundledExercise[];
}

/**
 * An exercise with its authoring path replaced by a portable one.
 *
 * Structurally an `Exercise`: only the meaning of `source.directory` changes,
 * from an absolute authoring path to a repository-relative one.
 */
export type BundledExercise = Exercise;

export class BundleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BundleError';
  }
}

export interface BundleOptions {
  /**
   * Rewrites each exercise's absolute authoring directory to something
   * portable. Absolute paths in a published bundle leak the author's machine
   * layout and mean nothing to a reader.
   */
  readonly relativise?: (absoluteDirectory: string) => string;
  readonly generatedAt?: string;
}

export function toBundle(
  exercises: readonly Exercise[],
  skills: readonly Skill[],
  options: BundleOptions = {},
): ContentBundle {
  const relativise = options.relativise ?? ((directory: string) => directory);

  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    skills: [...skills].sort((a, b) => a.id.localeCompare(b.id)),
    exercises: [...exercises]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((exercise) => ({
        ...exercise,
        source: { directory: relativise(exercise.source.directory) },
      })),
  };
}

/**
 * Parse a bundle back into a catalogue.
 *
 * Validation is structural rather than exhaustive: a bundle is produced by
 * `forge content bundle` from already-validated exercises, so the job here is
 * to fail clearly on a stale, truncated or foreign file rather than to
 * re-litigate content rules the authoring pipeline already enforced.
 */
export function parseBundle(raw: string | JsonValue): ContentBundle {
  let parsed: JsonValue;
  if (typeof raw === 'string') {
    try {
      parsed = parseJson(raw);
    } catch (caught) {
      throw new BundleError(`Content bundle is not valid JSON: ${toError(caught).message}`);
    }
  } else {
    parsed = raw;
  }

  if (!isJsonObject(parsed)) {
    throw new BundleError('Content bundle is not an object.');
  }

  const format = readString(parsed, 'format');
  if (format !== BUNDLE_FORMAT) {
    throw new BundleError(`Not a Forge content bundle (format: ${String(format)}).`);
  }

  const version = readNumber(parsed, 'version');
  if (version !== BUNDLE_VERSION) {
    throw new BundleError(
      `Content bundle is version ${String(version)}; this build reads version ${BUNDLE_VERSION}. ` +
        'Rebuild the bundle.',
    );
  }

  const exercises = parsed.exercises;
  const skills = parsed.skills;
  if (!Array.isArray(exercises) || !Array.isArray(skills)) {
    throw new BundleError('Content bundle is missing its exercises or skills.');
  }

  try {
    return {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      generatedAt: readString(parsed, 'generatedAt') ?? '',
      skills: skills.map(toSkill),
      exercises: exercises.map(toExercise),
    };
  } catch (caught) {
    throw new BundleError(toError(caught).message);
  }
}

export function catalogFromBundle(bundle: ContentBundle): ExerciseCatalog {
  // A bundled exercise differs from a loaded one only in where `source`
  // points, so it satisfies the catalogue's contract as it stands.
  return new ExerciseCatalog(bundle.exercises);
}

/** Transfer size, so the build can report what it asks visitors to download. */
export function bundleSizeBytes(bundle: ContentBundle): number {
  // TextEncoder rather than Buffer: this module is bundled for the browser too.
  return new TextEncoder().encode(JSON.stringify(bundle)).byteLength;
}
