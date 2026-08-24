// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { JsonObject, JsonValue, Skill, TestVisibility, Workspace } from '@code-wizard/core';
import { isJsonObject, readBoolean, readNumber, readString } from '@code-wizard/core';

import type { Exercise, ExerciseKind, ExerciseTestFile, Hint, HintLevel } from './model.ts';
import { hintLevels } from './model.ts';

/**
 * Narrowing a content bundle back into real objects.
 *
 * A published bundle is data fetched over a network, and asserting a shape
 * onto it would mean a truncated or stale file produced a catalog that looks
 * fine and behaves strangely. Every field is checked, and a bundle that fails
 * says which exercise and which field.
 */
export class BundleFieldError extends Error {
  constructor(where: string, detail: string) {
    super(`Content bundle is malformed at ${where}: ${detail}`);
    this.name = 'BundleFieldError';
  }
}

function requireObject(value: JsonValue | undefined, where: string): JsonObject {
  if (!isJsonObject(value)) throw new BundleFieldError(where, 'expected an object');
  return value;
}

function requireString(source: JsonObject, key: string, where: string): string {
  const value = readString(source, key);
  if (value === null) throw new BundleFieldError(`${where}.${key}`, 'expected a string');
  return value;
}

function requireNumber(source: JsonObject, key: string, where: string): number {
  const value = readNumber(source, key);
  if (value === null) throw new BundleFieldError(`${where}.${key}`, 'expected a number');
  return value;
}

function requireStringArray(source: JsonObject, key: string, where: string): string[] {
  const value = source[key];
  if (!Array.isArray(value)) throw new BundleFieldError(`${where}.${key}`, 'expected an array');
  return value.map((entry, index) => {
    if (typeof entry !== 'string') {
      throw new BundleFieldError(`${where}.${key}[${index}]`, 'expected a string');
    }
    return entry;
  });
}

function requireArray(source: JsonObject, key: string, where: string): JsonValue[] {
  const value = source[key];
  if (!Array.isArray(value)) throw new BundleFieldError(`${where}.${key}`, 'expected an array');
  return value;
}

function optionalString(source: JsonObject, key: string): string | undefined {
  return readString(source, key) ?? undefined;
}

const EXERCISE_KINDS: readonly ExerciseKind[] = [
  'syntax-drill',
  'completion',
  'translation',
  'bug-fix',
  'micro-problem',
  'focused-problem',
  'stateful-problem',
  'progressive-stage',
  'project',
];

const VISIBILITIES: readonly TestVisibility[] = [
  'visible',
  'hidden',
  'edge',
  'performance',
  'regression',
];

function requireMember<T extends string>(
  candidates: readonly T[],
  value: string,
  where: string,
): T {
  const found = candidates.find((candidate) => candidate === value);
  if (!found) {
    throw new BundleFieldError(where, `"${value}" is not one of: ${candidates.join(', ')}`);
  }
  return found;
}

export function toSkill(value: JsonValue, index: number): Skill {
  const where = `skills[${index}]`;
  const source = requireObject(value, where);
  const language = source.language;

  return {
    id: requireString(source, 'id', where),
    name: requireString(source, 'name', where),
    category: requireString(source, 'category', where),
    prerequisites: requireStringArray(source, 'prerequisites', where),
    language: typeof language === 'string' ? language : null,
    ...(optionalString(source, 'description') === undefined
      ? {}
      : { description: requireString(source, 'description', where) }),
  };
}

function toWorkspace(value: JsonValue | undefined, where: string): Workspace {
  const source = requireObject(value, where);
  const files = requireArray(source, 'files', where).map((entry, index) => {
    const fileWhere = `${where}.files[${index}]`;
    const file = requireObject(entry, fileWhere);
    const readOnly = readBoolean(file, 'readOnly');
    const hidden = readBoolean(file, 'hidden');
    return {
      path: requireString(file, 'path', fileWhere),
      contents: requireString(file, 'contents', fileWhere),
      ...(readOnly === null ? {} : { readOnly }),
      ...(hidden === null ? {} : { hidden }),
    };
  });

  const entryPoint = optionalString(source, 'entryPoint');
  return { files, ...(entryPoint === undefined ? {} : { entryPoint }) };
}

function toTest(value: JsonValue, where: string): ExerciseTestFile {
  const source = requireObject(value, where);
  const concept = optionalString(source, 'concept');
  return {
    path: requireString(source, 'path', where),
    contents: requireString(source, 'contents', where),
    visibility: requireMember(
      VISIBILITIES,
      requireString(source, 'visibility', where),
      `${where}.visibility`,
    ),
    ...(concept === undefined ? {} : { concept }),
  };
}

function toHint(value: JsonValue, where: string): Hint {
  const source = requireObject(value, where);
  return {
    level: requireMember<HintLevel>(
      hintLevels,
      requireString(source, 'level', where),
      `${where}.level`,
    ),
    text: requireString(source, 'text', where),
  };
}

export function toExercise(value: JsonValue, index: number): Exercise {
  const source = requireObject(value, `exercises[${index}]`);
  const id = readString(source, 'id') ?? `exercises[${index}]`;
  const where = `exercise "${id}"`;

  const explanation = optionalString(source, 'explanation');
  const continues = optionalString(source, 'continues');
  const timeoutMs = readNumber(source, 'timeoutMs');

  return {
    id: requireString(source, 'id', where),
    version: requireNumber(source, 'version', where),
    language: requireString(source, 'language', where),
    title: requireString(source, 'title', where),
    kind: requireMember(EXERCISE_KINDS, requireString(source, 'kind', where), `${where}.kind`),
    difficulty: requireNumber(source, 'difficulty', where),
    estimatedSeconds: requireNumber(source, 'estimatedSeconds', where),
    skills: requireStringArray(source, 'skills', where),
    prerequisites: requireStringArray(source, 'prerequisites', where),
    learningObjectives: requireStringArray(source, 'learningObjectives', where),
    prompt: requireString(source, 'prompt', where),
    starter: toWorkspace(source.starter, `${where}.starter`),
    solution: toWorkspace(source.solution, `${where}.solution`),
    tests: requireArray(source, 'tests', where).map((entry, testIndex) =>
      toTest(entry, `${where}.tests[${testIndex}]`),
    ),
    hints: requireArray(source, 'hints', where).map((entry, hintIndex) =>
      toHint(entry, `${where}.hints[${hintIndex}]`),
    ),
    source: {
      directory: readString(requireObject(source.source, `${where}.source`), 'directory') ?? '',
    },
    ...(explanation === undefined ? {} : { explanation }),
    ...(continues === undefined ? {} : { continues }),
    ...(timeoutMs === null ? {} : { timeoutMs }),
  };
}
