import fs from 'node:fs/promises';
import path from 'node:path';

import type { JsonValue, Workspace, WorkspaceFile } from '@forge/core';
import { toError } from '@forge/core';
import { parse as parseYaml } from 'yaml';
import type { ZodError } from 'zod';

import type { Exercise, ExerciseTestFile } from './model.ts';
import { exerciseManifestSchema } from './schema.ts';

export const MANIFEST_FILENAME = 'exercise.yaml';

export class ExerciseLoadError extends Error {
  constructor(
    readonly directory: string,
    message: string,
    options?: { cause?: Error },
  ) {
    super(`${directory}: ${message}`, options);
    this.name = 'ExerciseLoadError';
  }
}

/** Load one exercise from a directory containing `exercise.yaml`. */
export async function loadExercise(directory: string): Promise<Exercise> {
  const manifestPath = path.join(directory, MANIFEST_FILENAME);

  let raw: string;
  try {
    raw = await fs.readFile(manifestPath, 'utf8');
  } catch (caught) {
    throw new ExerciseLoadError(directory, `missing ${MANIFEST_FILENAME}`, {
      cause: toError(caught),
    });
  }

  // YAML produces the same closed set of shapes JSON does, so the result is
  // narrowable rather than opaque.
  let parsed: JsonValue;
  try {
    parsed = parseYaml(raw) as JsonValue;
  } catch (caught) {
    throw new ExerciseLoadError(directory, `${MANIFEST_FILENAME} is not valid YAML`, {
      cause: toError(caught),
    });
  }

  const result = exerciseManifestSchema.safeParse(parsed);
  if (!result.success) {
    throw new ExerciseLoadError(directory, formatZodError(result.error));
  }
  const manifest = result.data;

  const starter = await readWorkspaceDir(directory, manifest.starterDir, manifest.entryPoint);
  if (starter.files.length === 0) {
    throw new ExerciseLoadError(directory, `starter directory "${manifest.starterDir}" is empty`);
  }

  const solution = await readWorkspaceDir(directory, manifest.solutionDir, manifest.entryPoint);
  if (solution.files.length === 0) {
    throw new ExerciseLoadError(
      directory,
      `solution directory "${manifest.solutionDir}" is empty — every exercise needs a reference solution`,
    );
  }

  const tests: ExerciseTestFile[] = [];
  for (const entry of manifest.tests) {
    const filePath = path.join(directory, entry.path);
    let contents: string;
    try {
      contents = await fs.readFile(filePath, 'utf8');
    } catch (caught) {
      throw new ExerciseLoadError(directory, `test file "${entry.path}" not found`, {
        cause: toError(caught),
      });
    }
    tests.push({
      path: toPosix(entry.path),
      visibility: entry.visibility,
      ...(entry.concept ? { concept: entry.concept } : {}),
      contents,
    });
  }

  return {
    id: manifest.id,
    version: manifest.version,
    language: manifest.language,
    title: manifest.title,
    kind: manifest.kind,
    difficulty: manifest.difficulty,
    estimatedSeconds: manifest.estimatedSeconds,
    skills: manifest.skills,
    prerequisites: manifest.prerequisites,
    learningObjectives: manifest.learningObjectives,
    prompt: manifest.prompt.trim(),
    starter,
    solution,
    tests,
    hints: manifest.hints,
    ...(manifest.explanation ? { explanation: manifest.explanation.trim() } : {}),
    ...(manifest.timeoutMs ? { timeoutMs: manifest.timeoutMs } : {}),
    ...(manifest.continues ? { continues: manifest.continues } : {}),
    source: { directory: path.resolve(directory) },
  };
}

/** Recursively discover every exercise directory beneath `root`. */
export async function findExerciseDirectories(root: string): Promise<string[]> {
  const found: string[] = [];

  const walk = async (current: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((entry) => entry.isFile() && entry.name === MANIFEST_FILENAME)) {
      found.push(current);
      return; // Exercises do not nest.
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      await walk(path.join(current, entry.name));
    }
  };

  await walk(path.resolve(root));
  return found.sort();
}

async function readWorkspaceDir(
  exerciseDir: string,
  relativeDir: string,
  entryPoint: string | undefined,
): Promise<Workspace> {
  const base = path.join(exerciseDir, relativeDir);
  const files: WorkspaceFile[] = [];

  const walk = async (current: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__pycache__' || entry.name.startsWith('.')) continue;
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push({
        path: toPosix(path.relative(base, full)),
        contents: await fs.readFile(full, 'utf8'),
      });
    }
  };

  await walk(base);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const resolvedEntry = entryPoint ?? inferEntryPoint(files);
  return { files, ...(resolvedEntry ? { entryPoint: resolvedEntry } : {}) };
}

function inferEntryPoint(files: readonly WorkspaceFile[]): string | undefined {
  if (files.length === 1) return files[0]?.path;
  return files.find((file) => /^main\.[^/]+$/.test(file.path))?.path;
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `  ${location}: ${issue.message}`;
    })
    .join('\n');
}
