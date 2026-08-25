// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The training-mode selector, during an attempt.
 *
 * The Workspace is keyed on the mode, so changing it remounts the whole thing
 * and the session starts over. That is the right behavior — Learn and Fluency
 * grade differently and carrying revealed hints across would corrupt the
 * record — but it must not be reachable by a stray click while somebody is
 * halfway through writing a solution. The language picker was locked during an
 * attempt for exactly this reason; this one was not.
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

test('the training mode is locked while an attempt is open', async ({ page }) => {
  test.slow();
  await start(page);

  const mode = page.locator('.mode-select');
  await expect(mode).toBeEnabled();

  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  // Changing it here throws the attempt away, work and all.
  await expect(mode).toBeDisabled();

  await page.getByRole('button', { name: /Today/ }).first().click();
  await expect(mode).toBeEnabled();
});

test('work in progress survives a stray click on the chrome', async ({ page }) => {
  test.slow();
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('# a line the learner typed');

  // Everything in the top bar that stays live during an attempt, clicked in
  // turn. None of it may cost the learner their file.
  await page.getByRole('group', { name: 'Appearance' }).getByRole('button', { name: 'Dark' }).click();
  await page.getByRole('button', { name: 'Open the handbook' }).click();
  await page.keyboard.press('Escape');

  await expect(page.locator('.monaco-editor').first()).toContainText(
    'a line the learner typed',
  );
});
