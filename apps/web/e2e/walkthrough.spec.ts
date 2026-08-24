// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function start(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /^Python/ }).click();
  await page.getByRole('button', { name: 'I program, but not in Python' }).click();
  const tour = page.getByRole('dialog', { name: 'Welcome' });
  await tour.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  if (await tour.count()) {
    await page.getByRole('button', { name: 'Skip' }).click();
    await tour.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  }
}

test('show me reveals a hint in the walkthrough', async ({ page }) => {
  test.slow();
  await start(page);

  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  const panel = page.locator('.walkthrough');
  if ((await panel.count()) === 0) {
    await page.getByRole('button', { name: /Walk me through it/i }).click();
  }
  await expect(panel).toBeVisible();

  // Step forward to the first hint rung.
  for (let step = 0; step < 2; step += 1) {
    await panel.getByRole('button', { name: /^Next/ }).click();
  }

  const show = panel.getByRole('button', { name: 'Show me' });
  await expect(show).toBeVisible();
  await show.click();

  // The hint has to appear. Nothing happening is the reported bug.
  await expect(panel.locator('.walkthrough__hint')).toBeVisible({ timeout: 5000 });
});
