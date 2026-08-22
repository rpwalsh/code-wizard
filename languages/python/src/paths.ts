import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The directory holding the Python-side support scripts (`retrainer/report.py`,
 * `retrainer/expect.py`, `retrainer/diagnose.py`). It sits next to `dist/`, so this
 * resolves identically whether the package is run from source or built output.
 */
export const pythonSupportDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'runtime',
);

export const pythonExercisesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'exercises',
);

export const pythonDocumentationDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'documentation',
);
