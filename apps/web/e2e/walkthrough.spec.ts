// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The guided walkthrough, driven the way a stuck learner drives it. */
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

test('every reveal in the walkthrough actually reveals something', async ({ page }) => {
  test.slow();
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));

  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();

  // Some modes open the walkthrough on arrival and some do not, so ask for
  // it only if it is not already there.
  const panel = page.getByRole('region', { name: 'Guided walkthrough' });
  if ((await panel.count()) === 0) {
    await page.getByRole('button', { name: 'Walk me through it' }).click();
  }
  await expect(panel).toBeVisible();

  // Skip ahead first, the way somebody who wanted to see what was there
  // does, and then ask for help. A hint ladder that only ever reveals rung
  // zero leaves the button sitting under a step that stays blank.
  await panel.getByRole('button', { name: 'Next →' }).click();
  await panel.getByRole('button', { name: 'Next →' }).click();
  await panel.getByRole('button', { name: 'Next →' }).click();
  await panel.getByRole('button', { name: 'Next →' }).click();
  // And it must say what it is about to spend, rather than quietly spending it.
  await expect(panel.getByRole('button', { name: 'Show me' })).toContainText(
    'the rest of the way here',
  );
  await expect(panel).toContainText('steps you paged past');
  await panel.getByRole('button', { name: 'Show me' }).click();
  await expect(
    panel.locator('.walkthrough__hint'),
    'skipping ahead and then asking for a hint showed nothing',
  ).toBeVisible({ timeout: 5_000 });

  // Then walk the whole ladder from the top. Every "Show me" must replace
  // itself with text.
  await page.getByRole('button', { name: 'Walk me through it' }).click();
  await page.getByRole('button', { name: 'Walk me through it' }).click();
  await expect(panel).toBeVisible();
  for (let step = 0; step < 12; step += 1) {
    const show = panel.getByRole('button', { name: 'Show me' });
    if (await show.count()) {
      await show.click();
      await expect(
        panel.locator('.walkthrough__hint'),
        `step ${step}: "Show me" left the panel unchanged`,
      ).toBeVisible({ timeout: 5_000 });
    }

    const next = panel.getByRole('button', { name: 'Next →' });
    if ((await next.count()) === 0) break;
    await next.click();
  }

  expect(problems, `console errors: ${problems.join(' | ')}`).toEqual([]);
});
