// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { SkillGraph } from '@code-retrainer/core';
import { ExerciseCatalog, validateExercise } from '@code-retrainer/exercises';
import {
  discoverPython,
  PythonRuntime,
  pythonExercisesDir,
  pythonSkills,
} from '@code-retrainer/python';
import { describe, expect, it } from 'vitest';

/**
 * The content gate (spec §38). Every shipped exercise is loaded, schema-checked,
 * cross-referenced against the skill graph, and then actually executed: the
 * reference solution must pass and the starter must not. A broken exercise is
 * worse than no exercise, so this runs in CI rather than only in an authoring
 * session.
 */
const skillGraph = SkillGraph.from([...pythonSkills]);
const runtime = new PythonRuntime();

const interpreter = await discoverPython().catch(() => null);
const canExecute = interpreter?.hasPytest === true;

// Loaded at module level rather than in a hook, because the runtime test
// derives its timeout from how many exercises there are, and a hook has not
// run by the time that argument is evaluated.
const { catalog, failures } = await ExerciseCatalog.load([pythonExercisesDir]);

describe('shipped curriculum', () => {
  it('loads every exercise directory without error', () => {
    expect(failures).toEqual([]);
  });

  it('ships at least one exercise', () => {
    expect(catalog.size).toBeGreaterThan(0);
  });

  it('references only skills that exist in the graph', () => {
    const unknown = catalog.referencedSkills().filter((skill) => !skillGraph.has(skill));
    expect(unknown).toEqual([]);
  });

  it('gives every exercise a unique id', () => {
    const ids = catalog.all().map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no dangling progressive-stage references', () => {
    const dangling = catalog
      .all()
      .filter((exercise) => exercise.continues && !catalog.has(exercise.continues))
      .map((exercise) => `${exercise.id} -> ${exercise.continues ?? ''}`);
    expect(dangling).toEqual([]);
  });
});

describe.skipIf(!canExecute)('exercise validation', () => {
  // Every exercise is executed twice against a real interpreter, so the time
  // this takes grows with the curriculum. Deriving the allowance from the
  // catalog size means adding content never silently turns a real failure
  // into a timeout that looks like one.
  it(
    'validates every exercise against the real runtime',
    async () => {
      const problems: string[] = [];

      for (const exercise of catalog.all()) {
        const report = await validateExercise(exercise, {
          skillGraph,
          catalog,
          runtime,
        });
        for (const issue of report.issues) {
          if (issue.severity !== 'error') continue;
          problems.push(`${issue.exerciseId} [${issue.check}] ${issue.message}`);
        }
      }

      expect(problems).toEqual([]);
    },
    30_000 + catalog.size * 8_000,
  );
});
