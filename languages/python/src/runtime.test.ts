// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Workspace } from '@code-retrainer/core';
import { describe, expect, it } from 'vitest';

import { discoverPython } from './discovery.ts';
import { parseReport, ReportParseError, toTestCases } from './report.ts';
import { PythonRuntime } from './runtime.ts';

const runtime = new PythonRuntime();

/** Skips the integration suite gracefully rather than failing on a bare machine. */
const interpreter = await discoverPython().catch(() => null);
const describeIfPython = interpreter ? describe : describe.skip;
const describeIfPytest = interpreter?.hasPytest ? describe : describe.skip;

function workspace(files: Record<string, string>, entryPoint = 'main.py'): Workspace {
  return {
    files: Object.entries(files).map(([path, contents]) => ({ path, contents })),
    entryPoint,
  };
}

describe('report parsing', () => {
  it('rejects a report from an unknown schema version', () => {
    expect(() => parseReport('{"schema": 99, "cases": []}')).toThrow(ReportParseError);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseReport('not json')).toThrow(/not valid JSON/);
  });

  it('drops entries that do not describe a test case', () => {
    const document = parseReport(
      JSON.stringify({
        schema: 1,
        exitStatus: 1,
        collectionErrors: [],
        cases: [
          { id: 'a::t', name: 't', status: 'passed', durationMs: 1 },
          { id: 'b::t', name: 't', status: 'exploded', durationMs: 1 },
          null,
        ],
      }),
    );
    expect(document.cases).toHaveLength(1);
  });

  it('labels cases with the visibility the exercise declared', () => {
    const document = parseReport(
      JSON.stringify({
        schema: 1,
        exitStatus: 1,
        collectionErrors: [],
        cases: [
          {
            id: 'tests/test_h.py::test_x',
            file: 'tests/test_h.py',
            name: 'test_x',
            status: 'failed',
            durationMs: 2,
          },
          {
            id: 'tests/test_v.py::test_y',
            file: 'tests/test_v.py',
            name: 'test_y',
            status: 'passed',
            durationMs: 2,
          },
        ],
      }),
    );
    const cases = toTestCases(document, { 'tests/test_h.py': 'hidden' });
    expect(cases[0]?.visibility).toBe('hidden');
    // Anything undeclared is visible, never accidentally hidden.
    expect(cases[1]?.visibility).toBe('visible');
  });

  it('renders test names as readable prose', () => {
    const document = parseReport(
      JSON.stringify({
        schema: 1,
        exitStatus: 0,
        collectionErrors: [],
        cases: [
          {
            id: 'a.py::test_transfer_unknown_account',
            file: 'a.py',
            name: 'test_transfer_unknown_account',
            status: 'passed',
            durationMs: 1,
          },
          {
            id: 'a.py::test_case[3-4]',
            file: 'a.py',
            name: 'test_case[3-4]',
            status: 'passed',
            durationMs: 1,
          },
        ],
      }),
    );
    const cases = toTestCases(document);
    expect(cases[0]?.name).toBe('transfer unknown account');
    expect(cases[1]?.name).toBe('case [3-4]');
  });
});

describeIfPython('PythonRuntime.execute', () => {
  it('runs a program and captures stdout', async () => {
    const result = await runtime.execute({ workspace: workspace({ 'main.py': 'print("hi")' }) });
    expect(result.outcome).toBe('completed');
    expect(result.stdout.trim()).toBe('hi');
    expect(result.exitCode).toBe(0);
  });

  it('imports a sibling module from the workspace root', async () => {
    const result = await runtime.execute({
      workspace: workspace({
        'main.py': 'from helper import VALUE\nprint(VALUE)',
        'helper.py': 'VALUE = 42',
      }),
    });
    expect(result.stdout.trim()).toBe('42');
  });

  it('reports a non-zero exit and the traceback', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'raise ValueError("nope")' }),
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('ValueError');
  });

  it('passes stdin through', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'print(input().upper())' }),
      stdin: 'abc\n',
    });
    expect(result.stdout.trim()).toBe('ABC');
  });

  it('reports a timeout rather than hanging', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'import time\nwhile True: time.sleep(0.05)' }),
      limits: { timeoutMs: 1_000 },
    });
    expect(result.outcome).toBe('timeout');
  });

  it('truncates flooded output', async () => {
    const result = await runtime.execute({
      workspace: workspace({ 'main.py': 'for _ in range(500000): print("z" * 400)' }),
      limits: { timeoutMs: 20_000, maxOutputBytes: 16 * 1024 },
    });
    expect(result.truncated).toBe(true);
    expect(result.stdout.length).toBeLessThan(64 * 1024);
  });

  it('refuses to run a workspace with no entry point', async () => {
    const result = await runtime.execute({
      workspace: { files: [{ path: 'a.py', contents: 'x = 1' }] },
    });
    expect(result.outcome).toBe('internal-error');
    expect(result.stderr).toMatch(/entry point/);
  });

  it('does not let one execution see the previous one', async () => {
    await runtime.execute({
      workspace: workspace({ 'main.py': 'open("leaked.txt", "w").write("x")' }),
    });
    const result = await runtime.execute({
      workspace: workspace({
        'main.py': 'import os; print(os.path.exists("leaked.txt"))',
      }),
    });
    expect(result.stdout.trim()).toBe('False');
  });

  it('does not expose the host environment to learner code', async () => {
    process.env.RETRAINER_RUNTIME_SECRET = 'leaked';
    try {
      const result = await runtime.execute({
        workspace: workspace({
          'main.py': 'import os; print(os.environ.get("RETRAINER_RUNTIME_SECRET", "absent"))',
        }),
      });
      expect(result.stdout.trim()).toBe('absent');
    } finally {
      delete process.env.RETRAINER_RUNTIME_SECRET;
    }
  });
});

describeIfPython('PythonRuntime.diagnose', () => {
  it('locates a syntax error', async () => {
    const diagnostics = await runtime.diagnose({
      workspace: workspace({ 'main.py': 'def broken(:\n    pass\n' }),
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.location?.path).toBe('main.py');
    expect(diagnostics[0]?.location?.line).toBe(1);
  });

  it('says nothing about valid code', async () => {
    const diagnostics = await runtime.diagnose({
      workspace: workspace({ 'main.py': 'def fine():\n    return 1\n' }),
    });
    expect(diagnostics).toEqual([]);
  });
});

describeIfPytest('PythonRuntime.test', () => {
  const solution = 'def add(a, b):\n    return a + b\n';
  const stub = 'def add(a, b):\n    raise NotImplementedError\n';
  const visible = 'from main import add\n\n\ndef test_adds():\n    assert add(1, 2) == 3\n';
  const hidden = 'from main import add\n\n\ndef test_negatives():\n    assert add(-1, -2) == -3\n';

  const visibility = {
    'tests/test_visible.py': 'visible',
    'tests/test_hidden.py': 'hidden',
  } as const;

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
  });

  it('reports failures for a stub, with the exception type', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': stub,
        'tests/test_visible.py': visible,
      }),
      visibility: { 'tests/test_visible.py': 'visible' },
    });

    expect(result.failed).toBe(1);
    expect(result.cases[0]?.message).toContain('NotImplementedError');
  });

  it('surfaces structured expectations from the retrainer.expect helpers', async () => {
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
  });

  it('redacts the detail of a failing hidden test', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': stub,
        'tests/test_hidden.py': hidden,
      }),
      visibility: { 'tests/test_hidden.py': 'hidden' },
    });

    const [testCase] = result.cases;
    expect(testCase?.visibility).toBe('hidden');
    expect(testCase?.status).toBe('failed');
    expect(testCase?.message).not.toContain('NotImplementedError');
    expect(testCase?.received).toBeUndefined();
  });

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
  });

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
  });

  it('terminates a test that loops forever', async () => {
    const result = await runtime.test({
      workspace: workspace({
        'main.py': solution,
        'tests/test_visible.py':
          'import time\n\n\ndef test_hangs():\n    while True:\n        time.sleep(0.05)\n',
      }),
      visibility: { 'tests/test_visible.py': 'visible' },
      limits: { timeoutMs: 3_000 },
    });

    expect(result.outcome).toBe('timeout');
  });
});
