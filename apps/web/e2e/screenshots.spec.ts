// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * The screenshots in the README, captured from the real build.
 *
 * A documentation image that was made by hand drifts from the product the
 * first time anything moves, and nobody notices because nobody re-renders a
 * picture. These come out of the same production bundle the browser tests run
 * against, so a screenshot that is wrong means a test run that failed.
 *
 * Run with: npm run screenshots
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const shots = path.resolve(here, '..', '..', '..', 'docs', 'images');

test.use({ viewport: { width: 1440, height: 900 } });

async function start(page: Page, theme: 'light' | 'dark'): Promise<void> {
  // Emulating thepreference rather than stamping the root attribute: it is
  // the path most people will actually be on, and an init script runs before
  // documentElement exists, so the attribute never landed.
  await page.emulateMedia({ colorScheme: theme });
  await page.goto('/');
  await page.getByRole('button', { name: /^Python/ }).click();
  await page.getByRole('button', { name: 'I have written Python, a while ago' }).click();

  // The screenshots document the app, not its welcome mat.
  const tour = page.getByRole('dialog', { name: 'Welcome' });
  await tour.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  if (await tour.count()) {
    await page.getByRole('button', { name: 'Skip' }).click();
    await tour.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  }

  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ['light', 'dark'] as const) {
  test(`dashboard, ${theme}`, async ({ page }) => {
    await start(page, theme);
    await expect(page.getByText('Independent fluency')).toBeVisible();
    await page.screenshot({ path: path.join(shots, `dashboard-${theme}.png`) });
  });

  test(`skill map, ${theme}`, async ({ page }) => {
    await start(page, theme);
    await page.getByRole('button', { name: 'Skill map' }).click();
    await expect(page.locator('.dag svg')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shots, `skill-map-${theme}.png`) });
  });

  test(`skill map tracing, ${theme}`, async ({ page }) => {
    // The map at rest shows shape; pointing at a skill is what answers "what
    // is this connected to". A screenshot of only the resting state would
    // document half the screen.
    await start(page, theme);
    await page.getByRole('button', { name: 'Skill map' }).click();
    await expect(page.locator('.dag svg')).toBeVisible();
    await page.waitForTimeout(400);
    // `.first()`: the map carries six languages now, and more than one of them
    // may name a skill this way.
    await page
      .getByRole('button', { name: /^Breadth-first and depth/ })
      .first()
      .click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shots, `skill-map-tracing-${theme}.png`) });
  });

  test(`practice, ${theme}`, async ({ page }) => {
    await start(page, theme);
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(shots, `practice-${theme}.png`) });
  });

  test(`activity, ${theme}`, async ({ page }) => {
    await start(page, theme);
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.getByRole('button', { name: /^Rust/ }).click();
    await expect(page.locator('.activity')).toBeVisible();
    await page.waitForTimeout(300);
    // Answer, so the shot shows the part that teaches: the explanation and
    // why each wrong option was tempting.
    await page.locator('.activity__option').nth(1).click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.activity__explanation')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, `activity-${theme}.png`) });
  });

  test(`workspace, ${theme}`, async ({ page }) => {
    test.slow();
    await start(page, theme);
    await page
      .getByRole('button', { name: /Safe account lookup/ })
      .first()
      .click();
    await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(shots, `workspace-${theme}.png`) });
  });

  test(`test results, ${theme}`, async ({ page }) => {
    test.slow();
    await start(page, theme);
    await page
      .getByRole('button', { name: /Safe account lookup/ })
      .first()
      .click();
    await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
    await page.getByRole('button', { name: /^Test/ }).click();

    // Real Python, in the browser. The first run boots the interpreter.
    await expect(page.locator('.result--failed').first()).toBeVisible({ timeout: 220_000 });
    await page.locator('.result--failed').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, `results-${theme}.png`) });
  });
}
