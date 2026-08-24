// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LanguageRuntime, SkillGraph } from '@code-wizard/core';
import type { InstallablePackage, ToolchainSpec } from '@code-wizard/toolchain';
import { LanguageRegistry, SkillGraph as SkillGraphClass } from '@code-wizard/core';
import type { ExerciseCatalog } from '@code-wizard/exercises';
import { ExerciseCatalog as Catalog } from '@code-wizard/exercises';
import {
  JavaScriptRuntime,
  javascriptSkills,
  exercisesDir as javascriptExercisesDir,
  curriculumDir as javascriptCurriculumDir,
} from '@code-wizard/javascript';
import {
  PythonRuntime,
  pythonCurriculumDir,
  pythonExercisesDir,
  pythonSkills,
} from '@code-wizard/python';
import {
  createTypeScriptRuntime,
  curriculumDir as typescriptCurriculumDir,
  exercisesDir as typescriptExercisesDir,
  typescriptSkills,
} from '@code-wizard/lang-typescript';
import {
  createNodeRuntime,
  curriculumDir as nodeCurriculumDir,
  exercisesDir as nodeExercisesDir,
  nodeSkills,
} from '@code-wizard/lang-node';
import {
  createReactRuntime,
  curriculumDir as reactCurriculumDir,
  exercisesDir as reactExercisesDir,
  reactSkills,
} from '@code-wizard/lang-react';
import {
  createAngularRuntime,
  curriculumDir as angularCurriculumDir,
  exercisesDir as angularExercisesDir,
  angularSkills,
} from '@code-wizard/lang-angular';
import {
  createSqlRuntime,
  curriculumDir as sqlCurriculumDir,
  exercisesDir as sqlExercisesDir,
  sqlSkills,
} from '@code-wizard/lang-sql';
import {
  createCSharpRuntime,
  curriculumDir as csharpCurriculumDir,
  exercisesDir as csharpExercisesDir,
  csharpSkills,
  csharpSpec,
} from '@code-wizard/lang-csharp';
import {
  createAspNetRuntime,
  curriculumDir as aspnetCurriculumDir,
  exercisesDir as aspnetExercisesDir,
  aspnetSkills,
  aspnetSpec,
} from '@code-wizard/lang-aspnet';
import {
  createCRuntime,
  curriculumDir as cCurriculumDir,
  exercisesDir as cExercisesDir,
  cSkills,
  cSpec,
} from '@code-wizard/lang-c';
import {
  createCppRuntime,
  curriculumDir as cppCurriculumDir,
  exercisesDir as cppExercisesDir,
  cppSkills,
  cppSpec,
} from '@code-wizard/lang-cpp';
import {
  createGoRuntime,
  curriculumDir as goCurriculumDir,
  exercisesDir as goExercisesDir,
  goSkills,
  goSpec,
} from '@code-wizard/lang-go';
import {
  createRustRuntime,
  curriculumDir as rustCurriculumDir,
  exercisesDir as rustExercisesDir,
  rustSkills,
  rustSpec,
} from '@code-wizard/lang-rust';
import {
  createPhpRuntime,
  curriculumDir as phpCurriculumDir,
  exercisesDir as phpExercisesDir,
  phpSkills,
  phpSpec,
} from '@code-wizard/lang-php';

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
 *
 * Registering a language does not claim it is usable on this machine. Ten of
 * these need a toolchain the learner may not have installed, and the honest
 * place to find that out is `runtime doctor`, which asks each one and prints
 * exactly what is missing and where to get it. A registry that hid the
 * unavailable ones would be a menu that changes depending on what you have
 * already installed, which is a worse answer than a list with five items
 * grayed out and a reason beside each.
 */
export function buildRegistry(): LanguageRegistry {
  return new LanguageRegistry()
    .register(new PythonRuntime())
    .register(new JavaScriptRuntime())
    .register(createTypeScriptRuntime())
    .register(createNodeRuntime())
    .register(createReactRuntime())
    .register(createAngularRuntime())
    .register(createSqlRuntime())
    .register(createCSharpRuntime())
    .register(createAspNetRuntime())
    .register(createCRuntime())
    .register(createCppRuntime())
    .register(createGoRuntime())
    .register(createRustRuntime())
    .register(createPhpRuntime());
}

/**
 * One graph across every language.
 *
 * Skill ids are namespaced by language, so the union is still a DAG and a
 * cross-language prerequisite is expressible if it ever turns out to be true.
 */
export function buildSkillGraph(): SkillGraph {
  return SkillGraphClass.from([
    ...pythonSkills,
    ...javascriptSkills,
    ...typescriptSkills,
    ...nodeSkills,
    ...reactSkills,
    ...angularSkills,
    ...sqlSkills,
    ...csharpSkills,
    ...aspnetSkills,
    ...cSkills,
    ...cppSkills,
    ...goSkills,
    ...rustSkills,
    ...phpSkills,
  ]);
}

export function exerciseRoots(): string[] {
  return [
    pythonExercisesDir,
    javascriptExercisesDir,
    typescriptExercisesDir,
    nodeExercisesDir,
    reactExercisesDir,
    angularExercisesDir,
    sqlExercisesDir,
    csharpExercisesDir,
    aspnetExercisesDir,
    cExercisesDir,
    cppExercisesDir,
    goExercisesDir,
    rustExercisesDir,
    phpExercisesDir,
  ];
}

/**
 * Curricula with no runtime behind them.
 *
 * Four now, and none of them a language: frontend, backend, middleware and
 * architecture are cross-cutting disciplines practiced *in* the twelve
 * languages rather than alongside them, so what they need is exercise
 * fixtures rather than a compiler.
 */
export const plannedRoot = path.join(repositoryRoot, 'curricula');

/** Where each language keeps its course, by language id. */
export function curriculumRoots(): Readonly<Record<string, string>> {
  return {
    python: pythonCurriculumDir,
    javascript: javascriptCurriculumDir,
    typescript: typescriptCurriculumDir,
    node: nodeCurriculumDir,
    react: reactCurriculumDir,
    angular: angularCurriculumDir,
    sql: sqlCurriculumDir,
    csharp: csharpCurriculumDir,
    aspnet: aspnetCurriculumDir,
    c: cCurriculumDir,
    cpp: cppCurriculumDir,
    go: goCurriculumDir,
    rust: rustCurriculumDir,
    php: phpCurriculumDir,
  };
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

/**
 * Every language whose toolchain this can install, by id.
 *
 * Built from the specs themselves rather than kept as a second list here,
 * because a table of package names that lives away from the runtime it
 * describes is a table that goes stale the first time a language is added.
 */
export function installableLanguages(): ReadonlyMap<string, InstallablePackage> {
  const specs: readonly ToolchainSpec[] = [
    cSpec,
    cppSpec,
    goSpec,
    rustSpec,
    phpSpec,
    csharpSpec,
    aspnetSpec,
  ];

  const installable = new Map<string, InstallablePackage>();
  for (const spec of specs) {
    if (spec.installable) installable.set(spec.metadata.id, spec.installable);
  }
  return installable;
}
