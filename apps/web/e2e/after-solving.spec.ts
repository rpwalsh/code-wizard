// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * What happens after green.
 *
 * The completion panel is the screen this product is built around — it is
 * where the measurement is reported — and its two buttons had never been
 * clicked by any test.
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

async function solve(page: Page): Promise<void> {
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
  await page.getByRole('button', { name: /^Test/ }).click();
}

test('trying it again really starts over', async ({ page }) => {
  test.slow();
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  await solve(page);
  const aside = page.locator('.aside').first();
  await expect(aside).toContainText(/solved/i, { timeout: 240_000 });

  await page.getByRole('button', { name: 'Try it again' }).click();

  // A fresh attempt means an empty-handed one. Carrying the solved code over
  // would make "repeat it from memory" a click on Test.
  await expect(page.locator('.monaco-editor').first()).not.toContainText(
    'accounts.get(account_id, default)',
    { timeout: 20_000 },
  );
  await expect(aside).not.toContainText(/independent completion/i);

  // And the fresh attempt really is red again.
  await page.getByRole('button', { name: /^Test/ }).click();
  await expect(page.locator('.results__summary')).toContainText(/failed/i, {
    timeout: 240_000,
  });
});

test('done goes back to the dashboard', async ({ page }) => {
  test.slow();
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  await solve(page);
  await expect(page.locator('.aside').first()).toContainText(/solved/i, { timeout: 240_000 });

  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('main', { name: 'Editor' })).toHaveCount(0);
  await expect(page.locator('.mode-select')).toBeEnabled();
});
