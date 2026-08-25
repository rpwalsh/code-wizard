// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The editor's file tabs, which reading the tests goes through.
 *
 * Reading the test file is something this product actively encourages, so
 * doing it must cost nothing. It used to cost the learner their work: Monaco
 * fires a change event when it swaps models on a path change, and the handler
 * wrote that content back under the previously active path — so visiting a
 * test tab overwrote main.py with the test file, and the next run failed to
 * collect instead of failing its tests.
 */
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function start(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /^Python/ }).click();
  await page
    .getByRole('button', { name: /I program, but not in|I have written|new to programming/i })
    .first()
    .click();
  const tour = page.getByRole('dialog', { name: 'Welcome' });
  await tour.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  if (await tour.count()) {
    await page.getByRole('button', { name: 'Skip' }).click();
    await tour.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  }
}

async function typePython(page: Page, lines: readonly string[]): Promise<void> {
  for (const [index, line] of lines.entries()) {
    if (index > 0) await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Home');
    await page.keyboard.press('Delete');
    if (line !== '') await page.keyboard.type(line);
  }
}

test('reading the tests does not cost the learner their work', async ({ page }) => {
  test.slow();
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  // Write a solution that passes, so the check at the end is unambiguous:
  // green means the file survived intact, character for character.
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await typePython(page, [
    'def get_balance(accounts, account_id, default=0):',
    '    return accounts.get(account_id, default)',
    '',
    'def total_balance(accounts, account_ids):',
    '    return sum(accounts.get(account_id, 0) for account_id in account_ids)',
  ]);

  // Go and read the tests, the way the walkthrough tells people to.
  await page.getByRole('button', { name: 'tests/test_lookup.py' }).click();
  await expect(page.locator('.filetab[aria-current="true"]')).toContainText('tests/test_lookup.py');
  await page.getByRole('button', { name: 'tests/test_edges.py' }).click();
  await page.getByRole('button', { name: 'main.py', exact: true }).click();
  await expect(page.locator('.filetab[aria-current="true"]')).toHaveText('main.py');

  await page.getByRole('button', { name: /^Test/ }).click();

  const aside = page.locator('.aside').first();
  await expect(aside).toContainText(/solved/i, { timeout: 240_000 });
});

test('the editor tells you which file you are in', async ({ page }) => {
  test.slow();
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  // The accessible name was set once on mount and never updated, so a screen
  // reader user switching tabs was told they were still in main.py.
  await expect(page.getByRole('textbox', { name: 'main.py editor' })).toBeVisible();

  await page.getByRole('button', { name: 'tests/test_lookup.py' }).click();
  await expect(
    page.getByRole('textbox', { name: 'tests/test_lookup.py editor' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'main.py', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'main.py editor' })).toBeVisible();
});
