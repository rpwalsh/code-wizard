// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ExerciseCatalog } from './catalog.ts';
import { ExerciseLoadError, findExerciseDirectories, loadExercise } from './loader.ts';
import { attemptWorkspace, orderedHints, solutionWorkspace, testVisibility } from './model.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

const MANIFEST = `
id: python.demo.example
version: 2
language: python
title: Example
kind: micro-problem
difficulty: 2
estimatedSeconds: 120
skills: [python.collections.dict]
prerequisites: [python.syntax.variables]
learningObjectives: ["Do the thing"]
prompt: |
  Implement it.
entryPoint: main.py
tests:
  - path: tests/test_visible.py
    visibility: visible
    concept: python.collections.dict
  - path: tests/test_hidden.py
    visibility: hidden
hints:
  - level: explicit
    text: Just do it.
  - level: conceptual
    text: Think about it.
explanation: |
  Because.
`.trim();

async function writeExercise(
  files: Record<string, string> = {},
  manifest: string = MANIFEST,
): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'code-wizard-fixture-'));
  created.push(root);
  const directory = path.join(root, 'example');

  const all: Record<string, string> = {
    'exercise.yaml': manifest,
    'starter/main.py': 'def run():\n    raise NotImplementedError\n',
    'solution/main.py': 'def run():\n    return 1\n',
    'tests/test_visible.py': 'from main import run\n\n\ndef test_run():\n    assert run() == 1\n',
    'tests/test_hidden.py': 'from main import run\n\n\ndef test_again():\n    assert run() == 1\n',
    ...files,
  };

  for (const [relative, contents] of Object.entries(all)) {
    const target = path.join(directory, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents, 'utf8');
  }
  return directory;
}

describe('loadExercise', () => {
  it('assembles the manifest and the files beside it', async () => {
    const exercise = await loadExercise(await writeExercise());

    expect(exercise.id).toBe('python.demo.example');
    expect(exercise.version).toBe(2);
    expect(exercise.prompt).toBe('Implement it.');
    expect(exercise.starter.files.map((file) => file.path)).toEqual(['main.py']);
    expect(exercise.solution.files.map((file) => file.path)).toEqual(['main.py']);
    expect(exercise.tests).toHaveLength(2);
    expect(exercise.tests[0]?.concept).toBe('python.collections.dict');
  });

  it('loads nested starter files and keeps POSIX separators', async () => {
    const exercise = await loadExercise(
      await writeExercise({
        'starter/pkg/helper.py': 'X = 1\n',
        'solution/pkg/helper.py': 'X = 1\n',
      }),
    );
    expect(exercise.starter.files.map((file) => file.path)).toEqual(['main.py', 'pkg/helper.py']);
  });

  it('skips __pycache__ left behind by a local run', async () => {
    const exercise = await loadExercise(
      await writeExercise({ 'starter/__pycache__/main.cpython-313.pyc': 'binary' }),
    );
    expect(exercise.starter.files.map((file) => file.path)).toEqual(['main.py']);
  });

  it('sorts hints into reveal order regardless of how they were authored', async () => {
    const exercise = await loadExercise(await writeExercise());
    expect(orderedHints(exercise).map((hint) => hint.level)).toEqual(['conceptual', 'explicit']);
  });

  it('merges tests into the attempt and solution workspaces', async () => {
    const exercise = await loadExercise(await writeExercise());

    const attempt = attemptWorkspace(exercise);
    expect(attempt.files.map((file) => file.path)).toContain('tests/test_visible.py');
    expect(attempt.files.find((file) => file.path === 'main.py')?.contents).toContain(
      'NotImplementedError',
    );
    expect(attempt.files.find((file) => file.path === 'tests/test_hidden.py')?.hidden).toBe(true);
    expect(attempt.files.find((file) => file.path === 'tests/test_visible.py')?.readOnly).toBe(
      true,
    );

    const solution = solutionWorkspace(exercise);
    expect(solution.files.find((file) => file.path === 'main.py')?.contents).toContain('return 1');
  });

  it('exposes visibility keyed by test path', async () => {
    const exercise = await loadExercise(await writeExercise());
    expect(testVisibility(exercise)).toEqual({
      'tests/test_visible.py': 'visible',
      'tests/test_hidden.py': 'hidden',
    });
  });

  it('reports a missing manifest', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'code-wizard-fixture-'));
    created.push(root);
    await expect(loadExercise(root)).rejects.toThrow(/missing exercise.yaml/);
  });

  it('reports invalid YAML', async () => {
    await expect(loadExercise(await writeExercise({}, 'id: [unclosed'))).rejects.toThrow(
      /not valid YAML/,
    );
  });

  it('reports a schema violation with the offending field', async () => {
    const manifest = MANIFEST.replace('difficulty: 2', 'difficulty: 99');
    await expect(loadExercise(await writeExercise({}, manifest))).rejects.toThrow(/difficulty/);
  });

  it('rejects an id that is not namespaced under its language', async () => {
    const manifest = MANIFEST.replace('id: python.demo.example', 'id: demo.example');
    await expect(loadExercise(await writeExercise({}, manifest))).rejects.toThrow(/namespaced/);
  });

  it('rejects a test path that escapes the exercise directory', async () => {
    const manifest = MANIFEST.replace(
      '  - path: tests/test_hidden.py',
      '  - path: ../../../etc/passwd',
    );
    await expect(loadExercise(await writeExercise({}, manifest))).rejects.toThrow(
      /traverse upward/,
    );
  });

  it('rejects two hints at the same level', async () => {
    const manifest = MANIFEST.replace(
      '  - level: conceptual\n    text: Think about it.',
      '  - level: explicit\n    text: Again.',
    );
    await expect(loadExercise(await writeExercise({}, manifest))).rejects.toThrow(
      /duplicate hint level/,
    );
  });

  it('rejects an unknown manifest key rather than ignoring it', async () => {
    // A typo in a manifest key would otherwise silently disable a feature.
    const manifest = `${MANIFEST}\ndificulty: 3\n`;
    await expect(loadExercise(await writeExercise({}, manifest))).rejects.toThrow();
  });

  it('insists on a reference solution', async () => {
    const directory = await writeExercise();
    await fs.rm(path.join(directory, 'solution'), { recursive: true });
    await expect(loadExercise(directory)).rejects.toThrow(/reference solution/);
  });

  it('reports a declared test file that does not exist', async () => {
    const directory = await writeExercise();
    await fs.rm(path.join(directory, 'tests', 'test_hidden.py'));
    await expect(loadExercise(directory)).rejects.toThrow(ExerciseLoadError);
  });
});

describe('discovery and cataloguing', () => {
  it('finds exercise directories recursively', async () => {
    const directory = await writeExercise();
    const found = await findExerciseDirectories(path.dirname(directory));
    expect(found).toEqual([directory]);
  });

  it('indexes exercises by id and by skill', async () => {
    const exercise = await loadExercise(await writeExercise());
    const catalog = new ExerciseCatalog([exercise]);

    expect(catalog.size).toBe(1);
    expect(catalog.get('python.demo.example').title).toBe('Example');
    expect(catalog.forSkill('python.collections.dict')).toHaveLength(1);
    expect(catalog.forSkill('python.collections.set')).toHaveLength(0);
    expect(catalog.forLanguage('python')).toHaveLength(1);
    expect(catalog.forLanguage('go')).toHaveLength(0);
  });

  it('refuses to build a catalog with duplicate ids', async () => {
    const exercise = await loadExercise(await writeExercise());
    expect(() => new ExerciseCatalog([exercise, exercise])).toThrow(/Duplicate exercise id/);
  });

  it('surfaces a broken exercise as a load failure instead of dropping it', async () => {
    const directory = await writeExercise({}, 'id: [unclosed');
    const report = await ExerciseCatalog.load([path.dirname(directory)]);
    expect(report.catalog.size).toBe(0);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0]?.message).toMatch(/not valid YAML/);
  });
});
