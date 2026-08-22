import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LanguageRuntime, SkillGraph } from '@code-retrainer/core';
import { LanguageRegistry, SkillGraph as SkillGraphClass } from '@code-retrainer/core';
import type { ExerciseCatalog } from '@code-retrainer/exercises';
import { ExerciseCatalog as Catalog } from '@code-retrainer/exercises';
import {
  JavaScriptRuntime,
  javascriptSkills,
  exercisesDir as javascriptExercisesDir,
  curriculumDir as javascriptCurriculumDir,
} from '@code-retrainer/javascript';
import {
  PythonRuntime,
  pythonCurriculumDir,
  pythonExercisesDir,
  pythonSkills,
} from '@code-retrainer/python';

/** Repository root, resolved from this file rather than from the cwd. */
export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

/**
 * The one place where concrete language implementations are named. Everything
 * downstream goes through the registry, which is what keeps the rest of the
 * platform language-agnostic (spec §15).
 */
export function buildRegistry(): LanguageRegistry {
  return new LanguageRegistry().register(new PythonRuntime()).register(new JavaScriptRuntime());
}

/**
 * One graph across every language.
 *
 * Skill ids are namespaced by language, so the union is still a DAG and a
 * cross-language prerequisite is expressible if it ever turns out to be true.
 */
export function buildSkillGraph(): SkillGraph {
  return SkillGraphClass.from([...pythonSkills, ...javascriptSkills]);
}

export function exerciseRoots(): string[] {
  return [pythonExercisesDir, javascriptExercisesDir];
}

/** Curricula that are designed but have no runtime yet. */
export const plannedRoot = path.join(repositoryRoot, 'curricula');

/** Where each language keeps its planned course, by language id. */
export function curriculumRoots(): Readonly<Record<string, string>> {
  return { python: pythonCurriculumDir, javascript: javascriptCurriculumDir };
}

export interface CliContext {
  readonly registry: LanguageRegistry;
  readonly skillGraph: SkillGraph;
  readonly catalog: ExerciseCatalog;
  readonly loadFailures: readonly { directory: string; message: string }[];
  runtimeFor(language: string): LanguageRuntime;
}

export async function createContext(): Promise<CliContext> {
  const registry = buildRegistry();
  const report = await Catalog.load(exerciseRoots());
  return {
    registry,
    skillGraph: buildSkillGraph(),
    catalog: report.catalog,
    loadFailures: report.failures,
    runtimeFor: (language) => registry.get(language),
  };
}

/** Shorten an absolute path for display without losing which file it is. */
export function relativeToRepository(absolute: string): string {
  const relative = path.relative(repositoryRoot, absolute);
  return relative.startsWith('..') ? absolute : relative.split(path.sep).join('/');
}
