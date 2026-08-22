import type { Skill } from '@forge/core';

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

/** An exercise with its authoring path replaced by a portable one. */
export type BundledExercise = Omit<Exercise, 'source'> & {
  readonly source: { readonly directory: string };
};

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
export function parseBundle(raw: string | unknown): ContentBundle {
  let parsed: unknown;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      throw new BundleError(`Content bundle is not valid JSON: ${String(cause)}`);
    }
  } else {
    parsed = raw;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new BundleError('Content bundle is not an object.');
  }

  const bundle = parsed as Partial<ContentBundle>;
  if (bundle.format !== BUNDLE_FORMAT) {
    throw new BundleError(`Not a Forge content bundle (format: ${String(bundle.format)}).`);
  }
  if (bundle.version !== BUNDLE_VERSION) {
    throw new BundleError(
      `Content bundle is version ${String(bundle.version)}; this build reads version ${BUNDLE_VERSION}. ` +
        'Rebuild the bundle.',
    );
  }
  if (!Array.isArray(bundle.exercises) || !Array.isArray(bundle.skills)) {
    throw new BundleError('Content bundle is missing its exercises or skills.');
  }

  for (const exercise of bundle.exercises) {
    if (typeof exercise?.id !== 'string' || !Array.isArray(exercise.tests)) {
      throw new BundleError('Content bundle contains a malformed exercise.');
    }
  }

  return bundle as ContentBundle;
}

export function catalogFromBundle(bundle: ContentBundle): ExerciseCatalog {
  return new ExerciseCatalog(bundle.exercises as unknown as Exercise[]);
}

/** Transfer size, so the build can report what it asks visitors to download. */
export function bundleSizeBytes(bundle: ContentBundle): number {
  // TextEncoder rather than Buffer: this module is bundled for the browser too.
  return new TextEncoder().encode(JSON.stringify(bundle)).byteLength;
}
