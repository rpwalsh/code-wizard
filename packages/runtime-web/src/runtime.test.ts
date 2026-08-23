// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Workspace } from '@code-retrainer/core';
import { afterAll, describe, expect, it } from 'vitest';

import { nodeChannel } from './channel.ts';
import { PyodideRuntime } from './runtime.ts';

/**
 * The browser runtime, exercised for real.
 *
 * Pyodide's npm package runs under Node, and `node:worker_threads` gives the
 * same terminate-the-thread semantics a browser `Worker` does — so the timeout
 * guarantee, which is the whole reason the worker exists, is actually tested
 * rather than asserted.
 */
const workerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
  'worker.js',
);

function createRuntime(): PyodideRuntime {
  return new PyodideRuntime({ createChannel: () => nodeChannel(workerPath) });
}

const runtime = createRuntime();

afterAll(async () => {
  await runtime.dispose();
});

function workspace(files: Record<string, string>, entryPoint = 'main.py'): Workspace {
  return {
    files: Object.entries(files).map(([filePath, contents]) => ({ path: filePath, contents })),
    entryPoint,
  };
}

const visibility = {
  'tests/test_visible.py': 'visible',
  'tests/test_hidden.py': 'hidden',
} as const;

describe('PyodideRuntime', () => {
  it('boots CPython with pytest available', async () => {
    const info = await runtime.warmUp();
    expect(info.pythonVersion).toMatch(/^3\.\d+\.\d+$/);
    expect(info.pytestVersion).toBeTruthy();
  }, 180_000);

  it('presents itself as the same language as the desktop runtime', () => {
    expect(runtime.metadata().id).toBe('python');
    expect(runtime.metadata().editorLanguage).toBe('python');
  });

  it('runs a program and captures stdout', async () => {
    const result = await runtime.execute({ workspace: workspace({ 'main.py': 'print("hi")' }) });
    expect(result.outcome).toBe('completed');
    expect(result.stdout.trim()).toBe('hi');
    expect(result.exitCode).toBe(0);
  }, 60_000);

  it('imports a sibling module from the workspace root', async () => {
    const result = await runtime.execute({
      workspace: workspace({
        'main.py': 'from helper import VALUE\nprint(VALUE)',
        'helper.py': 'VALUE = 42',
      }),
    });
    expect(result.stdout.trim()).toBe('42');
  }, 60_000);

  it('picks up edited code rather than a cached module', async () => {
    // Python caches modules by name, and in a browser the interpreter lives as
    // long as the tab. Without purging, a learner would edit, run, and see
    // their previous version.
    await runtime.execute({
      workspace: workspace({
        'main.py': 'from helper import VALUE\nprint(VALUE)',
        'helper.py': 'VALUE = 1',
      }),
    });
    const second = await runtime.execute({
      workspace: workspace({
        'main.py': 'from helper import VALUE\nprint(VALUE)',
        'helper.py': 'VALUE = 2',
      }),
    });
    expect(second.stdout.trim()).toBe('2');
  }, 60_000);

  it('reports a non-zero exit and the traceback', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'raise ValueError("nope")' }),
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('ValueError');
  }, 60_000);

  it('honors sys.exit', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'import sys\nsys.exit(3)' }),
    });
    expect(result.exitCode).toBe(3);
  }, 60_000);

  it('passes stdin through', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'print(input().upper())' }),
      stdin: 'abc\n',
    });
    expect(result.stdout.trim()).toBe('ABC');
  }, 60_000);

  it('refuses a workspace with no entry point', async () => {
    const result = await runtime.execute({
      workspace: { files: [{ path: 'a.py', contents: 'x = 1' }] },
    });
    expect(result.outcome).toBe('internal-error');
    expect(result.stderr).toMatch(/entry point/);
  });

  it('refuses a workspace path that escapes the sandbox', async () => {
    const result = await runtime.execute({
      workspace: {
        files: [{ path: '../escape.py', contents: 'x = 1' }],
        entryPoint: '../escape.py',
      },
    });
    // Reported, not thrown: the runtime contract is that it always answers.
    expect(result.outcome).toBe('internal-error');
    expect(result.stderr).toMatch(/Unsafe workspace path/);
  });

  it('does not let one execution see the previous one', async () => {
    await runtime.execute({
      workspace: workspace({ 'main.py': 'open("leaked.txt", "w").write("x")' }),
    });
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'import os; print(os.path.exists("leaked.txt"))' }),
    });
    expect(result.stdout.trim()).toBe('False');
  }, 60_000);

  it('truncates flooded output instead of buffering it all', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'for _ in range(200000):\n    print("z" * 400)\n' }),
      limits: { timeoutMs: 60_000, maxOutputBytes: 16 * 1024 },
    });
    expect(result.truncated).toBe(true);
    expect(result.stdout.length).toBeLessThan(64 * 1024);
  }, 90_000);

  it('locates a syntax error without executing the file', async () => {
    const diagnostics = await runtime.diagnose({
      workspace: workspace({ 'main.py': 'def broken(:\n    pass\n' }),
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.location?.path).toBe('main.py');
    expect(diagnostics[0]?.severity).toBe('error');
  }, 60_000);

  it('says nothing about valid code', async () => {
    const diagnostics = await runtime.diagnose({
      workspace: workspace({ 'main.py': 'def fine():\n    return 1\n' }),
    });
    expect(diagnostics).toEqual([]);
  }, 60_000);

  it('reports no formatter rather than pretending to have one', async () => {
    const result = await runtime.format({ workspace: workspace({ 'main.py': 'x=1' }) });
    expect(result.available).toBe(false);
    expect(result.formatted).toEqual([]);
  });

  it('never claims code is lint-clean when nothing linted it', async () => {
    const result = await runtime.lint({ workspace: workspace({ 'main.py': 'x = 1\n' }) });
    expect(result.available).toBe(false);
  }, 60_000);
});

describe('PyodideRuntime testing', () => {
  const solution = 'def add(a, b):\n    return a + b\n';
  const stub = 'def add(a, b):\n    raise NotImplementedError\n';
  const visible = 'from main import add\n\n\ndef test_adds():\n    assert add(1, 2) == 3\n';
  const hidden = 'from main import add\n\n\ndef test_negatives():\n    assert add(-1, -2) == -3\n';

  it('reports every case as passing for a correct solution', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': solution,
        'tests/test_visible.py': visible,
        'tests/test_hidden.py': hidden,
      }),
      visibility,
    });

    expect(result.outcome).toBe('completed');
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
  }, 90_000);

  it('reports failures for a stub, with the exception type', async () => {
    const result = await runtime.test({
      workspace: workspace({ 'main.py': stub, 'tests/test_visible.py': visible }),
      visibility: { 'tests/test_visible.py': 'visible' },
    });
    expect(result.failed).toBe(1);
    expect(result.cases[0]?.message).toContain('NotImplementedError');
  }, 90_000);

  it('surfaces structured expectations from retrainer.expect', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': 'def add(a, b):\n    return a * b\n',
        'tests/test_visible.py':
          'from retrainer.expect import expect_equal\nfrom main import add\n\n\n' +
          'def test_adds():\n    expect_equal(add(2, 3), 5, concept="python.syntax.expressions")\n',
      }),
      visibility: { 'tests/test_visible.py': 'visible' },
    });

    const [failure] = result.cases;
    expect(failure?.status).toBe('failed');
    expect(failure?.expected).toBe('5');
    expect(failure?.received).toBe('6');
    expect(failure?.concept).toBe('python.syntax.expressions');
  }, 90_000);

  it('redacts the detail of a failing hidden test', async () => {
    const result = await runtime.test({
      workspace: workspace({ 'main.py': stub, 'tests/test_hidden.py': hidden }),
      visibility: { 'tests/test_hidden.py': 'hidden' },
    });

    const [testCase] = result.cases;
    expect(testCase?.visibility).toBe('hidden');
    expect(testCase?.status).toBe('failed');
    expect(testCase?.message).not.toContain('NotImplementedError');
    expect(testCase?.received).toBeUndefined();
  }, 90_000);

  it('reports a collection error when the code does not import', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': 'def add(a, b)\n    return a + b\n',
        'tests/test_visible.py': visible,
      }),
      visibility: { 'tests/test_visible.py': 'visible' },
    });
    expect(result.outcome).toBe('collection-error');
    expect(result.cases).toEqual([]);
  }, 90_000);

  it('reads the concept marker off a test', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': solution,
        'tests/test_visible.py':
          'import pytest\nfrom main import add\n\n\n' +
          '@pytest.mark.concept("python.syntax.expressions")\n' +
          'def test_adds():\n    assert add(1, 2) == 3\n',
      }),
      visibility: { 'tests/test_visible.py': 'visible' },
    });
    expect(result.cases[0]?.concept).toBe('python.syntax.expressions');
  }, 90_000);
});

/**
 * Termination gets its own runtime instance: killing the worker is destructive
 * by design, and the recovery path deserves to be observed rather than
 * entangled with the tests above.
 */
describe('PyodideRuntime timeout enforcement', () => {
  it('terminates a program that loops forever, and recovers afterwards', async () => {
    const isolated = createRuntime();
    try {
      await isolated.warmUp();

      const runaway = await isolated.execute({
        workspace: workspace({ 'main.py': 'while True:\n    pass\n' }),
        limits: { timeoutMs: 2_000 },
      });
      expect(runaway.outcome).toBe('timeout');

      // The worker was destroyed. The next run must boot a fresh interpreter
      // rather than fail forever.
      const after = await isolated.execute({
        workspace: workspace({ 'main.py': 'print("still alive")' }),
      });
      expect(after.outcome).toBe('completed');
      expect(after.stdout.trim()).toBe('still alive');
    } finally {
      await isolated.dispose();
    }
  }, 240_000);

  it('terminates a test run that hangs', async () => {
    const isolated = createRuntime();
    try {
      const result = await isolated.test({
        workspace: workspace({
          'main.py': 'x = 1\n',
          'tests/test_visible.py': 'def test_hangs():\n    while True:\n        pass\n',
        }),
        visibility: { 'tests/test_visible.py': 'visible' },
        limits: { timeoutMs: 5_000 },
      });
      expect(result.outcome).toBe('timeout');
    } finally {
      await isolated.dispose();
    }
  }, 240_000);
});
