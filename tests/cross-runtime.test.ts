import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LanguageRuntime, TestCaseResult } from '@forge/core';
import type { Exercise } from '@forge/exercises';
import {
  attemptWorkspace,
  ExerciseCatalog,
  solutionWorkspace,
  testVisibility,
} from '@forge/exercises';
import { discoverPython, PythonRuntime, pythonExercisesDir } from '@forge/python';
import { nodeChannel, PyodideRuntime } from '@forge/runtime-web';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The claim the whole architecture rests on: the desktop and browser builds
 * are the *same product*.
 *
 * One spawns a real interpreter and one runs CPython compiled to WebAssembly.
 * If they ever disagree about whether a learner's code is correct, then a
 * learner who practises on the hosted site and one who installs the app are
 * being taught different things — and every mastery number computed from
 * either becomes meaningless.
 *
 * So: run the real curriculum through both, and require identical verdicts.
 */
const workerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'packages',
  'runtime-web',
  'dist',
  'worker.js',
);

const interpreter = await discoverPython().catch(() => null);
const canCompare = interpreter?.hasPytest === true;

const native: LanguageRuntime = new PythonRuntime();
const web = new PyodideRuntime({ createChannel: () => nodeChannel(workerPath) });

let exercises: Exercise[] = [];

beforeAll(async () => {
  const report = await ExerciseCatalog.load([pythonExercisesDir]);
  exercises = report.catalog.all();
  if (canCompare) await web.warmUp();
}, 180_000);

afterAll(async () => {
  await web.dispose();
});

/** Verdicts only: names, statuses and visibility, ordered for comparison. */
function verdicts(cases: readonly TestCaseResult[]): string[] {
  return cases.map((testCase) => `${testCase.id} ${testCase.status} ${testCase.visibility}`).sort();
}

async function compare(exercise: Exercise, which: 'solution' | 'starter') {
  const workspace = which === 'solution' ? solutionWorkspace(exercise) : attemptWorkspace(exercise);
  const request = {
    workspace,
    visibility: testVisibility(exercise),
    ...(exercise.timeoutMs ? { limits: { timeoutMs: exercise.timeoutMs } } : {}),
  };

  const [fromNative, fromWeb] = await Promise.all([native.test(request), web.test(request)]);
  return { fromNative, fromWeb };
}

describe.skipIf(!canCompare)('desktop and browser runtimes agree', () => {
  it('loads the curriculum', () => {
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('reaches the same verdict on every reference solution', async () => {
    for (const exercise of exercises) {
      const { fromNative, fromWeb } = await compare(exercise, 'solution');

      expect(fromWeb.outcome, `${exercise.id}: outcome`).toBe(fromNative.outcome);
      expect(verdicts(fromWeb.cases), `${exercise.id}: verdicts`).toEqual(
        verdicts(fromNative.cases),
      );
      expect(fromWeb.passed, `${exercise.id}: passed`).toBe(fromNative.passed);
      expect(fromWeb.failed, `${exercise.id}: failed`).toBe(0);
    }
  }, 600_000);

  it('reaches the same verdict on every starter', async () => {
    for (const exercise of exercises) {
      const { fromNative, fromWeb } = await compare(exercise, 'starter');

      expect(fromWeb.outcome, `${exercise.id}: outcome`).toBe(fromNative.outcome);
      expect(verdicts(fromWeb.cases), `${exercise.id}: verdicts`).toEqual(
        verdicts(fromNative.cases),
      );
      // The starter must be red in both, or the exercise is broken in one.
      expect(
        fromWeb.failed + fromWeb.errored,
        `${exercise.id}: starter should fail`,
      ).toBeGreaterThan(0);
    }
  }, 600_000);

  it('produces the same structured expectations for a failing assertion', async () => {
    const exercise = exercises.find((candidate) => candidate.id === 'python.control.loop-bug');
    expect(exercise, 'the bug-fix exercise should exist').toBeDefined();
    if (!exercise) return;

    const { fromNative, fromWeb } = await compare(exercise, 'starter');
    const pick = (cases: readonly TestCaseResult[]) =>
      cases
        .filter((testCase) => testCase.status === 'failed' && testCase.visibility !== 'hidden')
        .map((testCase) => ({
          id: testCase.id,
          expected: testCase.expected,
          received: testCase.received,
          concept: testCase.concept,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    // Not merely "both failed": the same expected/received pair and the same
    // concept tag, because that is what the learner actually reads.
    expect(pick(fromWeb.cases)).toEqual(pick(fromNative.cases));
    expect(pick(fromWeb.cases).length).toBeGreaterThan(0);
  }, 300_000);

  it('redacts hidden tests identically in both', async () => {
    const exercise = exercises.find((candidate) =>
      candidate.tests.some((test) => test.visibility === 'hidden'),
    );
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const { fromNative, fromWeb } = await compare(exercise, 'starter');
    const hidden = (cases: readonly TestCaseResult[]) =>
      cases.filter((testCase) => testCase.visibility === 'hidden');

    for (const source of [hidden(fromNative.cases), hidden(fromWeb.cases)]) {
      expect(source.length).toBeGreaterThan(0);
      for (const testCase of source) {
        expect(testCase.expected).toBeUndefined();
        expect(testCase.received).toBeUndefined();
        expect(testCase.location).toBeUndefined();
      }
    }
  }, 300_000);
});
