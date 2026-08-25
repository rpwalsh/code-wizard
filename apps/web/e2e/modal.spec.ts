// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The dialog surfaces every overlay in the app is built on.
 *
 * They declare aria-modal, which tells a screen reader that the rest of the
 * page is unavailable. That claim has to hold for the keyboard too, or the
 * two disagree: the reader says there is nothing behind the dialog while Tab
 * walks straight into it.
 *
 * Containment is checked by tabbing off each edge rather than by pressing Tab
 * a fixed number of times — a dialog with a long list of links absorbs any
 * number of presses and would pass without containing anything.
 */
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

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

/** Put focus on the first or last focusable thing inside `selector`. */
async function focusEdge(page: Page, selector: string, edge: 'first' | 'last'): Promise<number> {
  return page.evaluate(
    ([sel, which, focusable]) => {
      const surface = document.querySelector(sel as string);
      if (!surface) return 0;
      const items = surface.querySelectorAll(focusable as string);
      const target = which === 'first' ? items[0] : items[items.length - 1];
      if (target instanceof HTMLElement) target.focus();
      return items.length;
    },
    [selector, edge, FOCUSABLE] as const,
  );
}

async function focusIsInside(page: Page, selector: string): Promise<boolean> {
  return page.evaluate(
    (sel) => document.activeElement?.closest(sel) !== null,
    selector,
  );
}

test('tab cannot walk out of the handbook', async ({ page }) => {
  test.slow();
  await start(page);

  await page.getByRole('button', { name: 'Open the handbook' }).click();
  await expect(page.getByRole('dialog', { name: 'Handbook' })).toBeVisible();

  const count = await focusEdge(page, '.modal__surface', 'last');
  expect(count, 'the dialog has nothing focusable in it').toBeGreaterThan(0);

  await page.keyboard.press('Tab');
  expect(await focusIsInside(page, '.modal__surface'), 'Tab left the dialog at the end').toBe(
    true,
  );

  await focusEdge(page, '.modal__surface', 'first');
  await page.keyboard.press('Shift+Tab');
  expect(
    await focusIsInside(page, '.modal__surface'),
    'Shift+Tab left the dialog at the start',
  ).toBe(true);
});

test('closing a dialog gives focus back to what opened it', async ({ page }) => {
  test.slow();
  await start(page);

  const opener = page.getByRole('button', { name: 'Open the handbook' });
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'Handbook' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Handbook' })).toHaveCount(0);

  // Otherwise a keyboard user is dropped at the top of the document and has
  // to tab back to where they were every time they read something.
  await expect(opener).toBeFocused();
});

test('tab cannot walk out of the command palette', async ({ page }) => {
  test.slow();
  await start(page);

  // The palette declares aria-modal on a surface of its own rather than going
  // through Modal, so it is a second implementation and needs its own check.
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog', { name: 'Commands' })).toBeVisible();

  await focusEdge(page, '.palette', 'first');
  await page.keyboard.press('Shift+Tab');
  expect(
    await focusIsInside(page, '.palette'),
    'Shift+Tab left the palette at the start',
  ).toBe(true);

  await focusEdge(page, '.palette', 'last');
  await page.keyboard.press('Tab');
  expect(await focusIsInside(page, '.palette'), 'Tab left the palette at the end').toBe(true);
});
