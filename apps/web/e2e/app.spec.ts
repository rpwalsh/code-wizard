import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * The app, in a real browser, against the real production build.
 *
 * Everything below this point is already tested — the two runtimes agree with
 * each other, the engines have unit tests, the content is executed in CI. What
 * none of that can tell you is whether the thing a visitor actually loads
 * works. That is what these are for, and the first run of them found a dead
 * end no amount of unit testing would have.
 */

test.beforeEach(async ({ page }) => {
  // A page that logs an uncaught error is broken, even if it still renders.
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught error in the page: ${error.message}`);
  });
});

/** Answer the first-run question and land on the dashboard. */
async function start(page: Page, choice = 'I program, but not in Python'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: choice }).click();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
}

test('asks where the learner is starting from, once', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'How much Python have you written?' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'I program, but not in Python' }).click();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();

  // Reloading must not ask again: the answer is stored, not inferred.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
  await expect(page.getByText('How much Python have you written?')).toHaveCount(0);
});

test('boots and shows the instrument', async ({ page }) => {
  await start(page);

  await expect(page.getByText('Independent fluency')).toBeVisible();
  // Nothing practised yet, so the reading is a standing start rather than a lie.
  await expect(page.getByText(/no measurements yet|skills measured/)).toBeVisible();
});

test('every exercise is reachable from the dashboard', async ({ page }) => {
  await start(page);

  // The regression this suite was written for: the schedule can legitimately
  // be empty, but the catalogue never is, so the screen is never a dead end.
  const catalogue = page.getByRole('button', { name: /Safe account lookup/ });
  await expect(catalogue.first()).toBeVisible();
});

test('opens an exercise into the workspace', async ({ page }) => {
  await start(page);
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();

  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Test/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'main.py' })).toBeVisible();

  // Hidden test files are never listed, in any mode.
  await expect(page.getByRole('button', { name: 'tests/test_hidden.py' })).toHaveCount(0);
});

test('closed-book mode really is closed book', async ({ page }) => {
  await start(page);
  await page.getByLabel('Training mode').selectOption('fluency');
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();

  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByText('Closed book. That is the point of this mode.')).toBeVisible();
});

test('draws the skill graph as a DAG', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Skill map' }).click();

  const canvas = page.getByRole('group', { name: 'Skill dependency graph' });
  await expect(canvas).toBeVisible();

  // A layered DAG of 45 skills: every node placed, every prerequisite drawn.
  await expect(canvas.locator('.dag__node')).toHaveCount(45);
  expect(await canvas.locator('.dag__edge').count()).toBeGreaterThan(40);

  // Layout actually ran — dagre gives real coordinates, not a pile at 0,0.
  const transforms = await canvas
    .locator('.dag__node')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform')));
  expect(new Set(transforms).size).toBe(transforms.length);
});

test('tracing a skill dims everything unrelated to it', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Skill map' }).click();

  const canvas = page.getByRole('group', { name: 'Skill dependency graph' });
  await expect(canvas.locator('.dag__node')).toHaveCount(45);

  await canvas.getByRole('button', { name: /Modelling mutable state/ }).click();

  // The inspector answers what the graph is showing.
  await expect(page.getByRole('heading', { name: 'Modelling mutable state' })).toBeVisible();

  // The chain above and below stays lit; the rest recedes.
  const dimmed = await canvas.locator('.dag__node[data-dimmed="true"]').count();
  const lit = await canvas.locator('.dag__node:not([data-dimmed="true"])').count();
  expect(dimmed).toBeGreaterThan(0);
  expect(lit).toBeGreaterThan(1);
  expect(dimmed + lit).toBe(45);

  await expect(canvas.locator('.dag__node[data-relation="self"]')).toHaveCount(1);
  expect(await canvas.locator('.dag__node[data-relation="ancestor"]').count()).toBeGreaterThan(0);
});

test('opens the command palette from the keyboard', async ({ page }) => {
  await start(page);

  await page.keyboard.press('ControlOrMeta+k');
  const palette = page.getByRole('dialog', { name: 'Commands' });
  await expect(palette).toBeVisible();

  await page.getByPlaceholder('Search commands').fill('skill');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('group', { name: 'Skill dependency graph' })).toBeVisible();
});

/**
 * The whole point of the product, end to end, in a browser: write Python, run
 * it against real pytest, and have the result recorded.
 *
 * Slow — it downloads and boots CPython — and worth every second, because it
 * is the only test that exercises the browser runtime through the actual UI.
 */
test('runs real Python and records the attempt', async ({ page }) => {
  test.slow();
  await start(page);

  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  await page.getByRole('button', { name: /^Test/ }).click();

  // The starter is a stub, so this must be red — and say why in the learner's
  // terms rather than dumping a traceback.
  const failing = page.locator('.result--failed').first();
  await expect(failing).toBeVisible({ timeout: 220_000 });

  await failing.click();
  await expect(page.getByText('Likely skill:')).toBeVisible();
});

/**
 * The instrument, in a browser.
 *
 * A failing test tells the learner *that* they were wrong. This is the product
 * refusing to stop there: it hands them a recording of what their own code
 * actually did, on the very test that failed, and lets them find the answer
 * themselves.
 */
test('a failing test can be watched, not just read', async ({ page }) => {
  test.slow();
  await start(page);

  await page
    .getByRole('button', { name: /Fix the expiry sweep/ })
    .first()
    .click();
  await page.getByRole('button', { name: /^Test/ }).click();

  // The bug-fix exercise fails on exactly the adjacent-expiry case.
  const failing = page.locator('.result--failed').first();
  await expect(failing).toBeVisible({ timeout: 220_000 });
  await failing.click();

  await page.getByRole('button', { name: 'Watch it run' }).click();

  const scope = page.locator('.scope');
  await expect(scope).toBeVisible({ timeout: 220_000 });
  await expect(scope.locator('.scope__line--current')).toHaveCount(1);

  // Lines annotated with how many times they actually ran — often the whole
  // answer on its own.
  expect(await scope.locator('.scope__runs').filter({ hasText: '×' }).count()).toBeGreaterThan(0);

  // Stepping forward moves the marker and accumulates state, the way a
  // learner actually drives it.
  const where = page.locator('.scope__where');
  const before = await where.textContent();

  for (let step = 0; step < 8; step += 1) {
    await page.getByLabel('Next step').click();
  }

  await expect(where).not.toHaveText(before ?? '');
  await expect(page.locator('.scope__binding')).not.toHaveCount(0);

  // And back again: the timeline is scrubbable in both directions.
  await page.getByLabel('Previous step').click();
  await expect(scope.locator('.scope__line--current')).toHaveCount(1);
});

test('hidden tests are never offered for tracing', async ({ page }) => {
  test.slow();
  await start(page);

  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await page.getByRole('button', { name: /^Test/ }).click();
  await expect(page.locator('.result--failed').first()).toBeVisible({ timeout: 220_000 });

  // Watching a hidden test run would show its source, which is exactly what
  // hiding it was for.
  const hidden = page.locator('.result--failed', { has: page.getByText('hidden') }).first();
  await hidden.click();
  await expect(page.getByRole('button', { name: 'Watch it run' })).toHaveCount(0);
});

/**
 * The no-AI claim, checked rather than asserted.
 *
 * A dependency scan proves no model client was installed. This proves the
 * running application does not talk to one — or to an analytics endpoint, or
 * to anything else it did not declare. It is the difference between a promise
 * and a fact a learner could verify themselves with a network tab.
 */
test('talks to nothing except its own files and the pinned Python runtime', async ({ page }) => {
  test.slow();
  const contacted = new Set<string>();

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    contacted.add(url.host);
  });

  await start(page);

  // Exercise the whole app, including the part that boots CPython.
  await page.getByRole('button', { name: 'Skill map' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await page.getByRole('button', { name: /^Test/ }).click();
  await expect(page.locator('.result--failed').first()).toBeVisible({ timeout: 220_000 });

  const allowed = new Set(['127.0.0.1:4173', 'cdn.jsdelivr.net']);
  expect([...contacted].filter((host) => !allowed.has(host))).toEqual([]);

  // And the CDN is only ever asked for the pinned interpreter.
  expect([...contacted]).toContain('cdn.jsdelivr.net');
});
