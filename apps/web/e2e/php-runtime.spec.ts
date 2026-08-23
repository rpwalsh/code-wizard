// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { expect, test } from '@playwright/test';

import type { Platform } from '../src/platform/types.ts';

/**
 * PHP in the browser: a real PHP compiled to WebAssembly.
 *
 * The engine is nineteen megabytes and boots on first use, so these are slow
 * by design. What they establish is that it boots at all under the content
 * security policy, and that the desktop's own harness grades a learner's code
 * unchanged.
 */
test.describe('PHP in the browser', () => {
  test('boots and runs a program', async ({ page }) => {
    test.slow();

    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) violations.push(message.text());
    });

    await page.goto('/');

    const result = await page.evaluate(async () => {
      const runtime = window.__retrainerPlatform?.runtimes.get('php');
      if (!runtime) return { error: 'no php runtime registered' };
      const run = await runtime.execute({
        workspace: {
          files: [
            {
              path: 'main.php',
              contents: [
                '<?php',
                'declare(strict_types=1);',
                'function add(int $a, int $b): int { return $a + $b; }',
                'echo add(2, 3), " ", PHP_VERSION;',
              ].join('\n'),
            },
          ],
          entryPoint: 'main.php',
        },
        limits: { timeoutMs: 240_000, maxOutputBytes: 8192 },
      });
      return { outcome: run.outcome, stdout: run.stdout.trim(), stderr: run.stderr.trim() };
    });

    // Reported before the assertions, so a policy problem is legible rather
    // than showing up as a mysterious boot failure.
    expect(violations, 'the engine tripped the content security policy').toEqual([]);
    expect(result.outcome).toBe('completed');
    expect(result.stdout).toContain('5');
    expect(result.stdout).toContain('8.4');
  });

  test('grades a learner solution with the desktop harness', async ({ page }) => {
    test.slow();
    await page.goto('/');

    const files = (solution: string) => [
      { path: 'main.php', contents: solution },
      {
        path: 'tests/add.php',
        contents: [
          '<?php',
          'declare(strict_types=1);',
          "require_once __DIR__ . '/../main.php';",
          '',
          "retrainer_test('adds two numbers', function () {",
          '    assert_equal(5, add(2, 3));',
          "}, 'php.structure.functions');",
        ].join('\n'),
      },
    ];

    const outcome = await page.evaluate(
      async (workspaces) => {
        const runtime = window.__retrainerPlatform?.runtimes.get('php');
        if (!runtime) return { error: 'no php runtime registered' };

        const run = async (files: { path: string; contents: string }[]) => {
          const result = await runtime.test({
            workspace: { files, entryPoint: 'main.php' },
            limits: { timeoutMs: 240_000, maxOutputBytes: 65_536 },
          });
          return {
            outcome: result.outcome,
            passed: result.passed,
            failed: result.failed,
            names: result.cases.map((testCase) => testCase.name),
          };
        };

        return { right: await run(workspaces.right), wrong: await run(workspaces.wrong) };
      },
      {
        right: files(
          [
            '<?php',
            'declare(strict_types=1);',
            'function add(int $a, int $b): int { return $a + $b; }',
          ].join('\n'),
        ),
        // Subtracts. The harness has to notice.
        wrong: files(
          [
            '<?php',
            'declare(strict_types=1);',
            'function add(int $a, int $b): int { return $a - $b; }',
          ].join('\n'),
        ),
      },
    );

    expect(outcome.right?.outcome).toBe('completed');
    expect(outcome.right?.passed).toBe(1);
    expect(outcome.right?.names).toContain('adds two numbers');

    // A harness that passes everything is worse than no harness.
    expect(outcome.wrong?.passed).toBe(0);
    expect(outcome.wrong?.failed).toBe(1);
  });
});

declare global {
  interface Window {
    __retrainerPlatform?: Platform;
  }
}
