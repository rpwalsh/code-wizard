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

test('the walkthrough buttons that only exist in Learn mode work', async ({ page }) => {
  test.slow();
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));

  await start(page);

  // Learn mode is the only one that offers the reference solution, so the
  // step below does not exist in the mode the other test runs in.
  await page.locator('.mode-select').selectOption('learn');
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();

  const panel = page.getByRole('region', { name: 'Guided walkthrough' });
  if ((await panel.count()) === 0) {
    await page.getByRole('button', { name: 'Walk me through it' }).click();
  }
  await expect(panel).toBeVisible();

  // Step two: "Open the tests" has to actually change which file is open.
  await panel.getByRole('button', { name: 'Next →' }).click();
  await panel.getByRole('button', { name: 'Open the tests' }).click();
  const open = page.locator('[aria-current="true"]').first();
  await expect(open).toHaveText(/^tests\//);

  // Page forward until the solution step appears, revealing each rung on the
  // way so the ladder is spent the way a learner would spend it.
  let reveal = panel.getByRole('button', { name: 'Show the solution' });
  for (let step = 0; step < 10; step += 1) {
    if (await reveal.count()) break;
    const next = panel.getByRole('button', { name: 'Next →' });
    if ((await next.count()) === 0) break;
    await next.click();
    reveal = panel.getByRole('button', { name: 'Show the solution' });
  }

  expect(await reveal.count(), 'Learn mode never offered the solution').toBeGreaterThan(0);
  await reveal.click();

  // The reference solution and the reason it is written that way, both.
  const code = panel.locator('.walkthrough__code').first();
  await expect(code).toBeVisible({ timeout: 15_000 });
  expect((await code.innerText()).length).toBeGreaterThan(40);
  await expect(panel).toContainText('Why it is written this way');
  await expect(reveal).toHaveCount(0);

  // Last step: running the tests from here closes the panel and runs them.
  const finish = panel.getByRole('button', { name: 'Run the tests now' });
  for (let step = 0; step < 4; step += 1) {
    if (await finish.count()) break;
    const next = panel.getByRole('button', { name: 'Next →' });
    if ((await next.count()) === 0) break;
    await next.click();
  }
  expect(await finish.count(), 'the walkthrough never offered to run the tests').toBeGreaterThan(
    0,
  );
  await finish.click();

  await expect(panel).toHaveCount(0);
  await expect(page.locator('.results__summary')).toBeVisible({ timeout: 240_000 });

  expect(problems, `console errors: ${problems.join(' | ')}`).toEqual([]);
});
