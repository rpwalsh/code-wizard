// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A pass through the product as a person would use it.
 *
 * Not a unit test of anything. This opens the app, answers questions, writes
 * code, runs it, and reads what comes back — and fails on anything a visitor
 * would see and think less of us for: a console error, an empty screen, a
 * control that does nothing, a language that offers no work.
 */
import type { ConsoleMessage, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Console noise nobody should ever see in a shipped build. */
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

async function start(page: Page, language = 'Python'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`^${language}`) }).click();
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

/**
 * Type Python into Monaco, which indents for you after a colon.
 *
 * Written as explicit key presses rather than one `type` call because the
 * editor's own auto-indent means a pasted-looking block lands at the wrong
 * depth — and typing it the way a person does is the point of the test.
 */
async function typePython(page: Page, lines: readonly string[]): Promise<void> {
  for (const [index, line] of lines.entries()) {
    if (index > 0) await page.keyboard.press('Enter');
    // Undo whatever indent Monaco supplied, then supply our own.
    await page.keyboard.press('Shift+Home');
    await page.keyboard.press('Delete');
    if (line !== '') await page.keyboard.type(line);
  }
}

test('a learner can take an exercise from red to green', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();

  // The prompt has to be readable before anything else matters.
  const brief = page.getByRole('complementary', { name: 'Task' });
  await expect(brief).toBeVisible();
  expect((await brief.innerText()).length).toBeGreaterThan(80);

  // The starter must fail, and the failure must be legible.
  await page.getByRole('button', { name: /^Test/ }).click();
  const summary = page.locator('.results__summary');
  await expect(summary).toBeVisible({ timeout: 240_000 });
  expect(await summary.innerText()).toMatch(/failed/i);

  await page.locator('.result--failed').first().click();
  expect((await page.locator('.result--failed').first().innerText()).length).toBeGreaterThan(20);

  // Now write the real answer.
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

  // Green replaces the results with the completion panel, which is the
  // point of the product: not "12 passed" but how much help it took.
  const aside = page.locator('.aside').first();
  await expect(aside).toContainText(/solved/i, { timeout: 240_000 });
  await expect(aside).toContainText(/independent completion/i);
  await expect(aside).toContainText(/hints/i);

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('every language in the picker offers something to do', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  const picker = page.locator('.language-select');
  const values = await picker.locator('option').evaluateAll((options) =>
    options.map((option) => ({
      value: (option as HTMLOptionElement).value,
      label: (option as HTMLOptionElement).textContent ?? '',
    })),
  );

  expect(values.length).toBeGreaterThan(5);

  for (const { value, label } of values) {
    await picker.selectOption(value);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    // Every language must render a screen with a route forward on it.
    const body = await page.locator('#main').innerText();
    expect(body.trim().length, `${label} rendered an empty screen`).toBeGreaterThan(40);
  }

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('a practice run can be answered end to end', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();

  await page.locator('.practice__card').first().click();
  await expect(page.locator('.activity')).toBeVisible();

  for (let index = 0; index < 6; index += 1) {
    const card = page.locator('.activity');
    if ((await card.count()) === 0) break;

    const options = card.locator('.activity__option');
    const chips = card.locator('.chip');
    const selects = card.locator('.activity__select');
    const inputs = card.locator('.activity__input, .activity__textarea');

    if ((await options.count()) > 0) {
      await options.first().click();
    } else if ((await chips.count()) > 0) {
      // Sorting and tree building: click a chip, then a destination.
      await chips.first().click();
      const target = card.locator('[data-drop-id]').nth(1);
      if (await target.count()) await target.click();
    } else if ((await selects.count()) > 0) {
      const first = selects.first();
      const values = await first
        .locator('option')
        .evaluateAll((entries) =>
          entries
            .map((entry) => (entry as HTMLOptionElement).value)
            .filter((value) => value !== ''),
        );
      if (values[0]) await first.selectOption(values[0]);
    } else if ((await inputs.count()) > 0) {
      await inputs.first().fill('something');
    }

    const check = card.getByRole('button', { name: 'Check' });
    if (await check.count()) await check.click();

    // Whatever the verdict, an explanation has to follow. A wrong answer
    // with no reason attached is the thing this product exists not to be.
    await expect(card.locator('.activity__explanation')).toBeVisible({ timeout: 10_000 });

    const next = card.getByRole('button', { name: /^(Next|Finish|Done)/ });
    if (await next.count()) await next.click();
    else break;
  }

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the chrome behaves: handbook, data panel, palette', async ({ page }) => {
  test.slow();
  const problems = watchConsole(page);
  await start(page);

  await page.getByRole('button', { name: 'Open the handbook' }).click();
  const handbook = page.getByRole('dialog', { name: 'Handbook' });
  await expect(handbook).toBeVisible();

  // Opaque: a dialog you can read the page through is one you read twice.
  const background = await handbook.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const alpha = /rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/.exec(background);
  expect(alpha === null || Number(alpha[1]) === 1, `dialog background ${background}`).toBe(true);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  const data = page.getByRole('dialog', { name: 'Your data' });
  await expect(data.getByRole('button', { name: 'Save a copy' })).toBeVisible();
  await expect(data.getByRole('button', { name: 'Load a copy' })).toBeVisible();
  await expect(data.getByRole('button', { name: 'Delete everything' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press('Control+k');
  await expect(page.locator('.palette')).toBeVisible();
  await page.keyboard.press('Escape');

  expect(problems, `console problems: ${problems.join(' | ')}`).toEqual([]);
});

test('the language picker is locked while an attempt is open', async ({ page }) => {
  test.slow();
  await start(page);

  const picker = page.locator('.language-select');
  await expect(picker).toBeEnabled();

  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  // Switching under an open attempt would discard the work or leave the
  // screen showing one language while the header claimed another.
  await expect(picker).toBeDisabled();

  await page.getByRole('button', { name: /Today/ }).first().click();
  await expect(picker).toBeEnabled();
});
