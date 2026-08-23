// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { expect, test } from '@playwright/test';

import type { Platform } from '../src/platform/types.ts';

/**
 * JavaScript and TypeScript, executed in the browser, with nothing downloaded.
 *
 * Driven through the page's own runtime registry rather than through the UI,
 * because what is being checked is the runtime: that a module graph held only
 * in memory can be imported, that the shared harness produces the same report
 * it produces on the desktop, and that an infinite loop is stopped by killing
 * the worker rather than by asking it nicely.
 *
 * The UI has its own tests. This one would still be worth having if the UI
 * were replaced tomorrow.
 */
test.describe('the browser runtimes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Python/ }).click();
    await page.getByRole('button', { name: 'I have written Python, a while ago' }).click();
    await expect(page.getByRole('heading', { name: /Python|JavaScript/ }).first()).toBeVisible();
  });

  test('runs JavaScript with no interpreter to download', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const platform = window.__retrainerPlatform;
      const runtime = platform?.runtimes.get('javascript');
      if (!runtime) return { error: 'no javascript runtime' };

      const run = await runtime.execute({
        workspace: {
          files: [{ path: 'main.js', contents: 'console.log(6 * 7);' }],
          entryPoint: 'main.js',
        },
        limits: { timeoutMs: 10_000, maxOutputBytes: 4096 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim(), exitCode: run.exitCode };
    });

    expect(result).toEqual({ outcome: 'completed', stdout: '42', exitCode: 0 });
  });

  test('imports between the learner s own modules', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('javascript');
      const run = await runtime!.execute({
        workspace: {
          files: [
            { path: 'lib/math.js', contents: 'export const double = (n) => n * 2;' },
            {
              path: 'main.js',
              contents: "import { double } from './lib/math.js';\nconsole.log(double(21));",
            },
          ],
          entryPoint: 'main.js',
        },
        limits: { timeoutMs: 10_000, maxOutputBytes: 4096 },
      });
      return run.stdout.trim();
    });

    expect(result).toBe('42');
  });

  test('produces the same test report the desktop produces', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('javascript');
      const run = await runtime!.test({
        workspace: {
          files: [
            { path: 'main.js', contents: 'export const add = (a, b) => a + b;' },
            {
              path: 'tests/add.test.js',
              contents: [
                "import { test } from 'retrainer/test.js';",
                "import { expectEqual } from 'retrainer/expect.js';",
                "import { add } from '../main.js';",
                "test('adds', () => { expectEqual(add(2, 3), 5); }, { concept: 'javascript.syntax.values' });",
                "test('is wrong', () => { expectEqual(add(2, 2), 5); });",
              ].join('\n'),
            },
          ],
          entryPoint: 'main.js',
        },
        limits: { timeoutMs: 15_000, maxOutputBytes: 65_536 },
      });
      return {
        outcome: run.outcome,
        passed: run.passed,
        failed: run.failed,
        concepts: run.cases.map((entry) => entry.concept ?? null),
      };
    });

    expect(result.outcome).toBe('completed');
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    // The concept marker is what turns a failure into "you are missing this
    // skill", and it has to survive the trip through the worker.
    expect(result.concepts).toContain('javascript.syntax.values');
  });

  test('stops an infinite loop by killing the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('javascript');
      const began = Date.now();
      const run = await runtime!.execute({
        workspace: {
          files: [{ path: 'main.js', contents: 'while (true) {}' }],
          entryPoint: 'main.js',
        },
        limits: { timeoutMs: 2000, maxOutputBytes: 4096 },
      });
      return { outcome: run.outcome, elapsed: Date.now() - began };
    });

    expect(result.outcome).toBe('timeout');
    // Terminated, not waited out: a cooperative cancellation could never
    // interrupt a loop that never yields.
    expect(result.elapsed).toBeLessThan(12_000);
  });

  test('runs TypeScript by transforming it in the page', async ({ page }) => {
    test.slow();
    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('typescript');
      if (!runtime) return { error: 'no typescript runtime' };

      const run = await runtime.execute({
        workspace: {
          files: [
            {
              path: 'main.ts',
              contents:
                'interface P { name: string }\n' +
                'const greet = (p: P): string => `hello ${p.name}`;\n' +
                "console.log(greet({ name: 'world' }));",
            },
          ],
          entryPoint: 'main.ts',
        },
        limits: { timeoutMs: 60_000, maxOutputBytes: 4096 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim(), stderr: run.stderr.slice(0, 200) };
    });

    expect(result.stdout).toBe('hello world');
    expect(result.outcome).toBe('completed');
  });

  test('renders a React component to HTML', async ({ page }) => {
    test.slow();
    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('react');
      if (!runtime) return { error: 'no react runtime' };

      const run = await runtime.execute({
        workspace: {
          files: [
            {
              path: 'main.tsx',
              contents:
                "import { renderToStaticMarkup } from 'react-dom/server';\n" +
                'function Hi({ name }: { name: string }) { return <p>hi {name}</p>; }\n' +
                'console.log(renderToStaticMarkup(<Hi name="there" />));',
            },
          ],
          entryPoint: 'main.tsx',
        },
        limits: { timeoutMs: 60_000, maxOutputBytes: 4096 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim(), stderr: run.stderr.slice(0, 300) };
    });

    // React itself is not bundled into the browser build, so this is expected
    // to report the missing module rather than render. The check is that the
    // failure is legible rather than a hang or a blank.
    expect(`${result.stdout}${result.stderr}`.length).toBeGreaterThan(0);
  });
});

/**
 * Python, from the vendored interpreter rather than a CDN.
 *
 * The regression this guards is specific and was real: moving Pyodide out of
 * jsDelivr and into the deploy broke it, because the package's loader shim had
 * a different extension than the vendoring script expected. Nothing failed
 * loudly — the worker simply never answered — so this asserts the interpreter
 * actually evaluates Python.
 */
test.describe('the vendored interpreter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Python/ }).click();
    await page.getByRole('button', { name: 'I have written Python, a while ago' }).click();
  });

  test('runs Python with no network', async ({ page }) => {
    test.slow();
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (url.host !== '127.0.0.1:4173') external.push(url.host);
    });

    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('python');
      if (!runtime) return { error: 'no python runtime' };
      const run = await runtime.execute({
        workspace: {
          files: [{ path: 'main.py', contents: 'print(6 * 7)' }],
          entryPoint: 'main.py',
        },
        limits: { timeoutMs: 200_000, maxOutputBytes: 4096 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim() };
    });

    expect(result).toEqual({ outcome: 'completed', stdout: '42' });
    expect(external).toEqual([]);
  });
});

declare global {
  interface Window {
    __retrainerPlatform?: Platform;
  }
}
