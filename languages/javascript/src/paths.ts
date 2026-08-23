// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The harness and the `retrainer` support package the learner's tests import.
 *
 * Sits next to `dist/`, so this resolves identically whether the package runs
 * from source or from built output.
 */
export const supportDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'runtime',
);

/**
 * Where the harness lands *inside the sandbox*.
 *
 * Relative, and inside the package the tests import, so the harness and the
 * tests share one module registry.
 */
export const harnessEntry = 'node_modules/retrainer/harness.mjs';

/** The files copied into every sandbox. */
export const supportFiles = [
  'package.json',
  'expect.js',
  'test.js',
  'run.js',
  'harness.mjs',
] as const;

export const exercisesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'exercises',
);

/** The planned course: one YAML file per stage, numbered in course order. */
export const curriculumDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'curriculum',
);
