import type {
  LanguageMetadata,
  LanguageRuntime,
  TestRequest,
  TestResult,
  Workspace,
} from '@forge/core';
import { SkillGraph } from '@forge/core';
import { describe, expect, it } from 'vitest';

import { ExerciseCatalog } from './catalog.ts';
import type { Exercise } from './model.ts';
import { validateExercise } from './validator.ts';

const skillGraph = SkillGraph.from([
  { id: 'python.a', name: 'A', category: 'Test', prerequisites: [], language: 'python' },
  { id: 'python.b', name: 'B', category: 'Test', prerequisites: ['python.a'], language: 'python' },
]);

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'python.demo.one',
    version: 1,
    language: 'python',
    title: 'One',
    kind: 'micro-problem',
    difficulty: 2,
    estimatedSeconds: 120,
    skills: ['python.b'],
    prerequisites: ['python.a'],
    learningObjectives: ['Do it'],
    prompt: 'Do it',
    starter: { files: [{ path: 'main.py', contents: 'stub' }], entryPoint: 'main.py' },
    solution: { files: [{ path: 'main.py', contents: 'real' }], entryPoint: 'main.py' },
    tests: [{ path: 'tests/test_a.py', visibility: 'visible', contents: 'assert True' }],
    hints: [{ level: 'explicit', text: 'Here.' }],
    source: { directory: '/tmp/demo' },
    ...overrides,
  };
}

function checks(report: { issues: readonly { check: string }[] }): string[] {
  return report.issues.map((issue) => issue.check);
}

/**
 * A runtime that decides pass/fail purely from the contents of `main.py`, so
 * behavioural validation can be exercised without spawning an interpreter.
 */
function fakeRuntime(options: {
  solutionPasses: boolean;
  starterPasses: boolean;
  durationMs?: number;
  collectedFiles?: string[];
}): LanguageRuntime {
  const respond = (request: TestRequest): TestResult => {
    const main = request.workspace.files.find((file) => file.path === 'main.py');
    const passing = main?.contents === 'real' ? options.solutionPasses : options.starterPasses;
    const files = options.collectedFiles ?? filesOf(request.workspace);
    const cases = files.map((file, index) => ({
      id: `${file}::test_${index}`,
      name: `test_${index}`,
      status: (passing ? 'passed' : 'failed') as const,
      visibility: 'visible' as const,
      durationMs: 1,
    }));
    return {
      outcome: 'completed',
      cases,
      passed: passing ? cases.length : 0,
      failed: passing ? 0 : cases.length,
      errored: 0,
      skipped: 0,
      durationMs: options.durationMs ?? 10,
      stdout: '',
      stderr: '',
      truncated: false,
    };
  };

  return {
    metadata: (): LanguageMetadata => ({
      id: 'python',
      displayName: 'Python',
      editorLanguage: 'python',
      fileExtension: '.py',
      commentPrefix: '#',
    }),
    doctor: async () => ({ language: 'python', ready: true, checks: [] }),
    execute: async () => {
      throw new Error('not used');
    },
    test: async (request) => respond(request),
    format: async () => ({ formatted: [], available: false }),
    lint: async () => ({ diagnostics: [], available: false }),
    diagnose: async () => [],
  };
}

function filesOf(workspace: Workspace): string[] {
  return workspace.files.filter((file) => file.path.startsWith('tests/')).map((file) => file.path);
}

describe('structural validation', () => {
  it('accepts a well-formed exercise', async () => {
    const report = await validateExercise(exercise(), { skillGraph });
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it('rejects an exercise with no visible test', async () => {
    const report = await validateExercise(
      exercise({
        tests: [{ path: 'tests/test_a.py', visibility: 'hidden', contents: 'x' }],
      }),
      { skillGraph },
    );
    expect(checks(report)).toContain('visible-tests');
    expect(report.ok).toBe(false);
  });

  it('rejects a starter file the solution does not also provide', async () => {
    const report = await validateExercise(
      exercise({
        starter: {
          files: [
            { path: 'main.py', contents: 'stub' },
            { path: 'extra.py', contents: 'stub' },
          ],
        },
      }),
      { skillGraph },
    );
    expect(checks(report)).toContain('solution-shape');
  });

  it('rejects a test file that collides with a starter file', async () => {
    const report = await validateExercise(
      exercise({
        tests: [{ path: 'main.py', visibility: 'visible', contents: 'x' }],
      }),
      { skillGraph },
    );
    expect(checks(report)).toContain('test-collision');
  });

  it('warns when a hard exercise can be passed by hardcoding', async () => {
    const report = await validateExercise(exercise({ difficulty: 4 }), { skillGraph });
    expect(checks(report)).toContain('hardcode-guard');
    // A warning, not an error: it still ships.
    expect(report.ok).toBe(true);
  });

  it('warns when the hint ladder has no explicit exit', async () => {
    const report = await validateExercise(
      exercise({ hints: [{ level: 'conceptual', text: 'Think.' }] }),
      { skillGraph },
    );
    expect(checks(report)).toContain('hint-ladder');
  });

  it('warns when a syntax drill claims to take ten minutes', async () => {
    const report = await validateExercise(
      exercise({ kind: 'syntax-drill', estimatedSeconds: 600 }),
      { skillGraph },
    );
    expect(checks(report)).toContain('duration-metadata');
  });
});

describe('skill validation', () => {
  it('rejects an unknown skill', async () => {
    const report = await validateExercise(exercise({ skills: ['python.ghost'] }), { skillGraph });
    expect(checks(report)).toContain('skill-exists');
    expect(report.ok).toBe(false);
  });

  it('rejects an exercise that requires the skill it teaches', async () => {
    const report = await validateExercise(
      exercise({ skills: ['python.b'], prerequisites: ['python.b'] }),
      { skillGraph },
    );
    expect(checks(report)).toContain('skill-cycle');
  });

  it('rejects a dangling `continues` reference', async () => {
    const report = await validateExercise(exercise({ continues: 'python.demo.missing' }), {
      skillGraph,
      catalog: new ExerciseCatalog([exercise()]),
    });
    expect(checks(report)).toContain('continues');
  });
});

describe('behavioural validation', () => {
  it('passes when the solution is green and the starter is red', async () => {
    const report = await validateExercise(exercise(), {
      skillGraph,
      runtime: fakeRuntime({ solutionPasses: true, starterPasses: false }),
    });
    expect(report.issues).toEqual([]);
  });

  it('rejects a reference solution that fails its own tests', async () => {
    const report = await validateExercise(exercise(), {
      skillGraph,
      runtime: fakeRuntime({ solutionPasses: false, starterPasses: false }),
    });
    expect(checks(report)).toContain('solution-passes');
    expect(report.ok).toBe(false);
  });

  it('rejects a starter that already passes, since it asks for nothing', async () => {
    const report = await validateExercise(exercise(), {
      skillGraph,
      runtime: fakeRuntime({ solutionPasses: true, starterPasses: true }),
    });
    expect(checks(report)).toContain('starter-fails');
    expect(report.ok).toBe(false);
  });

  it('rejects a declared test file that produced no test cases', async () => {
    const report = await validateExercise(exercise(), {
      skillGraph,
      runtime: fakeRuntime({
        solutionPasses: true,
        starterPasses: false,
        collectedFiles: ['tests/test_renamed.py'],
      }),
    });
    expect(checks(report)).toContain('tests-collected');
  });

  it('warns when the reference solution uses most of the time budget', async () => {
    const report = await validateExercise(exercise({ timeoutMs: 1_000 }), {
      skillGraph,
      runtime: fakeRuntime({ solutionPasses: true, starterPasses: false, durationMs: 900 }),
    });
    expect(checks(report)).toContain('timeout-headroom');
  });

  it('refuses to validate an exercise with the wrong language runtime', async () => {
    const report = await validateExercise(exercise({ language: 'go' }), {
      runtime: fakeRuntime({ solutionPasses: true, starterPasses: false }),
    });
    expect(checks(report)).toContain('runtime-language');
  });
});
