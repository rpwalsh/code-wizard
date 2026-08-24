// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { expect, test } from '@playwright/test';

import type { Platform } from '../src/platform/types.ts';

/**
 * SQL in the browser, on the interpreter that was already there.
 *
 * CPython has bundled SQLite since 2006, and the page carries a complete
 * CPython for the Python exercises — so SQL needed no second WebAssembly
 * build, no extra megabyte of download, and no second dialect to keep in step
 * with the desktop. These tests hold that claim up.
 */
test.describe('SQL in the browser', () => {
  test('runs a query and returns its rows', async ({ page }) => {
    test.slow();
    await page.goto('/');
    // The platform is published on boot, and boot loads the whole
    // catalog. Evaluating before it exists reads undefined and reports
    // it as a runtime failure, which is a race rather than a defect.
    await page.waitForFunction(() => window.__retrainerPlatform !== undefined, null, {
      timeout: 60_000,
    });

    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('sql');
      if (!runtime) return { error: 'no sql runtime registered' };
      const run = await runtime.execute({
        workspace: {
          files: [
            {
              path: 'schema.sql',
              contents: [
                'CREATE TABLE orders (customer TEXT, total INTEGER);',
                "INSERT INTO orders VALUES ('ana', 30), ('ben', 5), ('ana', 12);",
              ].join('\n'),
            },
            {
              path: 'main.sql',
              contents:
                'SELECT customer, SUM(total) FROM orders GROUP BY customer ORDER BY customer;',
            },
          ],
          entryPoint: 'main.sql',
        },
        limits: { timeoutMs: 200_000, maxOutputBytes: 8192 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim(), stderr: run.stderr.trim() };
    });

    expect(result.outcome).toBe('completed');
    expect(result.stdout).toContain('ana');
    expect(result.stdout).toContain('42');
    expect(result.stdout).toContain('ben');
  });

  test('grades a query against expectations, right and wrong', async ({ page }) => {
    test.slow();
    await page.goto('/');
    // The platform is published on boot, and boot loads the whole
    // catalog. Evaluating before it exists reads undefined and reports
    // it as a runtime failure, which is a race rather than a defect.
    await page.waitForFunction(() => window.__retrainerPlatform !== undefined, null, {
      timeout: 60_000,
    });

    const files = (query: string) => [
      {
        path: 'schema.sql',
        contents: [
          'CREATE TABLE orders (customer TEXT, total INTEGER);',
          "INSERT INTO orders VALUES ('ana', 30), ('ben', 5), ('ana', 12);",
        ].join('\n'),
      },
      { path: 'main.sql', contents: query },
      {
        path: 'tests/totals.sql',
        contents: [
          // `uses: main.sql` is what puts the learner's own query under
          // test. Without it a case runs the query written beneath it,
          // which grades the test file rather than the learner -- the
          // mistake this test made on its first run, and passed while
          // making.
          '-- test: one row per customer, highest first',
          '-- concept: sql.sets.aggregates',
          '-- uses: main.sql',
          '-- expect:',
          '-- ana|42',
          '-- ben|5',
        ].join('\n'),
      },
    ];

    const outcome = await page.evaluate(async (workspaceFiles) => {
      const runtime = window.__retrainerPlatform?.runtimes.get('sql');
      if (!runtime) return { error: 'no sql runtime registered' };

      const run = async (files: { path: string; contents: string }[]) => {
        const result = await runtime.test({
          workspace: { files, entryPoint: 'main.sql' },
          limits: { timeoutMs: 200_000, maxOutputBytes: 32_768 },
        });
        return {
          outcome: result.outcome,
          passed: result.passed,
          failed: result.failed,
          names: result.cases.map((testCase) => testCase.name),
        };
      };

      return { right: await run(workspaceFiles.right), wrong: await run(workspaceFiles.wrong) };
    }, {
      right: files(
        'SELECT customer, SUM(total) AS total FROM orders GROUP BY customer ORDER BY total DESC;',
      ),
      // Sums nothing: every row comes back separately, so the expectation fails.
      wrong: files('SELECT customer, total FROM orders;'),
    });

    // The report has to survive the round trip and produce real named cases.
    expect(outcome.right?.outcome).toBe('completed');
    expect(outcome.right?.passed).toBe(1);
    expect(outcome.right?.failed).toBe(0);
    expect(outcome.right?.names).toContain('one row per customer, highest first');

    // And a wrong query has to actually fail. A harness that passes everything
    // is worse than no harness, because it is trusted.
    expect(outcome.wrong?.passed).toBe(0);
    expect(outcome.wrong?.failed).toBe(1);
  });
});

declare global {
  interface Window {
    __retrainerPlatform?: Platform;
  }
}
