// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The controls no other test had ever clicked.
 *
 * Written after a data-loss bug turned up in the file tabs, which the suite
 * had also never clicked. Nothing here is exotic: it is the ordinary chrome a
 * learner uses in the first five minutes, driven once, with console errors
 * treated as failures.
 */
import type { ConsoleMessage, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

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

test('the hint ladder opens one rung at a time and shows each one', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();

  // The diagnostics panel is closed while writing and opens on the first run,
  // which is where a learner meets the ladder.
  await page.getByRole('button', { name: /^Test/ }).click();
  await expect(page.locator('.results__summary')).toBeVisible({ timeout: 240_000 });

  const ladder = page.locator('.hints__ladder');
  await expect(ladder).toBeVisible();

  const rungs = ladder.locator('.rung');
  const total = await rungs.count();
  expect(total).toBeGreaterThan(0);

  // Only the next rung is offered. Everything below it is closed to keep the
  // ladder meaningful, since grading uses the deepest rung reached.
  await expect(rungs.nth(0)).toBeEnabled();
  if (total > 1) await expect(rungs.nth(1)).toBeDisabled();

  for (let index = 0; index < total; index += 1) {
    const rung = rungs.nth(index);
    await expect(rung, `rung ${index} was not offered in turn`).toBeEnabled();
    await rung.click();

    // Opening a rung has to produce the text. A rung that marks itself open
    // and shows nothing is the same dead control as the walkthrough's.
    await expect(rung, `rung ${index} did not mark itself open`).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const text = ladder.locator('.rung__text').nth(index);
    await expect(text, `rung ${index} opened with no hint in it`).toBeVisible();
    expect((await text.innerText()).trim().length).toBeGreaterThan(10);
  }

  await expect(page.locator('.hints__cost')).toBeVisible();
  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the appearance switch actually changes the page', async ({ page }) => {
  const problems = watchConsole(page);
  await start(page);

  const group = page.getByRole('group', { name: 'Appearance' });
  const root = page.locator('html');

  await group.getByRole('button', { name: 'Dark' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(group.getByRole('button', { name: 'Dark' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await group.getByRole('button', { name: 'Light' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');

  // The choice has to survive a reload, or it is a toggle rather than a
  // setting and every visit starts over.
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');

  await page.getByRole('group', { name: 'Appearance' }).getByRole('button', { name: 'Auto' }).click();
  await expect(root).not.toHaveAttribute('data-theme', 'light');

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('focus mode hides the panels and gives them back', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();

  const brief = page.getByRole('complementary', { name: 'Task' });
  await expect(brief).toBeVisible();

  await page.getByRole('button', { name: 'Focus', exact: true }).click();
  await expect(brief).toBeHidden();

  // Not merely out of sight: out of the accessibility tree and out of the tab
  // order too. A panel that is only visually gone is still there for anyone
  // not using their eyes to find it.
  await expect(page.getByRole('complementary', { name: 'Task' })).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Diagnostics' })).toHaveCount(0);

  // And back. A one-way door is worse than no door.
  await page.getByRole('button', { name: 'Show panels' }).click();
  await expect(brief).toBeVisible();

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the command palette runs the command it is asked for', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();

  // A command that changes something visible, chosen by typing rather than
  // by arrowing to it.
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog', { name: 'Commands' })).toBeVisible();
  // A command whose effect is visible from the writing view, since the hint
  // ladder lives in the diagnostics panel and that is closed while writing.
  await page.getByPlaceholder('Search commands').fill('Walk me through');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog', { name: 'Commands' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Guided walkthrough' })).toBeVisible({
    timeout: 10_000,
  });

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the continue card on the dashboard opens something', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  const card = page.locator('.continue__go');
  if ((await card.count()) === 0) {
    test.skip(true, 'no continue card on a fresh profile');
  }

  await card.click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the skill map inspector opens and clears', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  await page.getByRole('button', { name: 'Skill map' }).click();
  const graph = page.getByRole('group', { name: 'Skill dependency graph' });
  await expect(graph).toBeVisible();

  // By name, not by position. The canvas pans and zooms behind overflow:
  // hidden, so the first node in document order can be scrolled out of view —
  // clipped, while SVG geometry still reports it as visible.
  const node = graph.getByRole('button', { name: /Modeling mutable state/ });
  await node.click();

  await expect(page.getByRole('heading', { name: 'Modeling mutable state' })).toBeVisible();
  const clear = page.getByRole('button', { name: 'Clear selection' });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(clear).toHaveCount(0);

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});
