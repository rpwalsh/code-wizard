// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Saving a copy and loading it back.
 *
 * This is the only way anything leaves or enters the device, and the only
 * answer the product has to "what if I want this on another computer". Both
 * buttons had been checked for existence and neither had ever been used.
 */
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { JsonObject } from '@code-wizard/core';
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

test('progress survives a save, a wipe and a load', async ({ page }) => {
  test.slow();
  await start(page);

  // Earn something worth carrying: a solved attempt.
  await page.getByRole('button', { name: /Safe account lookup/ }).first().click();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
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
  await expect(page.locator('.aside').first()).toContainText(/solved/i, { timeout: 240_000 });
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  const solvedBefore = await page.locator('#main').innerText();

  // Save a copy.
  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save a copy' }).click();
  const download = await downloading;

  const directory = await mkdtemp(join(tmpdir(), 'code-wizard-'));
  const snapshot = join(directory, 'progress.json');
  await download.saveAs(snapshot);

  // It has to be a real snapshot, not an empty file with a nice name. Checked
  // against the keys the importer requires, so a file that saves but cannot be
  // loaded back fails here rather than three steps later.
  const raw = await readFile(snapshot, 'utf8');
  const written = JSON.parse(raw) as JsonObject;
  for (const key of ['format', 'schemaVersion', 'exportedAt', 'settings']) {
    expect(Object.keys(written), `the snapshot has no ${key}`).toContain(key);
  }
  expect(Array.isArray(written['attempts'])).toBe(true);

  // Wipe the device.
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await page.getByRole('button', { name: /Yes, delete it all/ }).click();
  await page.waitForTimeout(2000);

  // Load it back.
  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load a copy' }).click();
  const chooser = await choosing;
  await chooser.setFiles(snapshot);

  await expect(page.getByText('Progress loaded')).toBeVisible({ timeout: 30_000 });

  // The dashboard has to describe the same history it described before.
  await expect
    .poll(async () => (await page.locator('#main').innerText()) === solvedBefore, {
      timeout: 30_000,
    })
    .toBe(true);
});

test('a file that is not a snapshot is refused by name', async ({ page }) => {
  test.slow();
  await start(page);

  const directory = await mkdtemp(join(tmpdir(), 'code-wizard-'));
  const rubbish = join(directory, 'not-a-snapshot.json');
  await (await import('node:fs/promises')).writeFile(rubbish, 'this is not json at all', 'utf8');

  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load a copy' }).click();
  (await choosing).setFiles(rubbish);

  // Refused, and said so. Silently doing nothing would look like it worked.
  await expect(page.getByText(/not valid JSON/i)).toBeVisible({ timeout: 30_000 });
});
