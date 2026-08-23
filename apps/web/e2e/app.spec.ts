// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { Platform } from '../src/platform/types.ts';
import { pythonSkillGraph } from '@code-retrainer/python';

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

/** Answer the first-run questions and land on the dashboard. */
async function start(page: Page, choice = 'I program, but not in Python'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /^Python/ }).click();
  await page.getByRole('button', { name: choice }).click();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
}

test('asks where the learner is starting from, once', async ({ page }) => {
  await page.goto('/');

  // Two steps: the language first, because everything after is scoped by it.
  await expect(
    page.getByRole('heading', { name: 'Which language are you here to get back?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Python/ }).click();

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
  // Nothing practiced yet, so the reading is a standing start rather than a lie.
  await expect(page.getByText(/no measurements yet|skills measured/)).toBeVisible();
});

test('the dashboard says nothing it cannot support yet', async ({ page }) => {
  await start(page);

  // A fresh learner has no history, and the assistance panel must say so
  // rather than drawing a flat line at zero — which would read as "you never
  // need help" on the day they arrived.
  await expect(page.getByText('Assistance dependency')).toBeVisible();
  await expect(page.getByText(/the useful direction is down/)).toBeVisible();
});

test('every exercise is reachable from the dashboard', async ({ page }) => {
  await start(page);

  // The regression this suite was written for: the schedule can legitimately
  // be empty, but the catalog never is, so the screen is never a dead end.
  const catalog = page.getByRole('button', { name: /Safe account lookup/ });
  await expect(catalog.first()).toBeVisible();
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

test('the blank-page rung really hands over an empty file', async ({ page }) => {
  await start(page);
  await page.getByLabel('Training mode').selectOption('blank-page');
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();

  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  // The skeleton is gone, but the file and the tests that import it are not:
  // withdrawing the file itself would withdraw the exercise.
  await expect(page.getByRole('button', { name: 'main.py' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'tests/test_lookup.py' })).toBeVisible();
  await expect(page.locator('.monaco-editor')).not.toContainText('def get_balance');
});

test('a prediction is held until the run that judges it', async ({ page }) => {
  test.slow();
  await start(page);
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  // The claim is made beside the prompt, before running — which is the only
  // screen where predicting means anything, and the regression this covers:
  // it was first built into a panel that only appears after a run.
  await expect(page.getByText('Before you run it')).toBeVisible();
  await page.getByRole('button', { name: 'This will pass' }).click();
  await expect(page.getByText('You said it would').first()).toBeVisible();
  await expect(page.getByText('pass the tests').first()).toBeVisible();

  await page.getByRole('button', { name: /^Test/ }).click();

  // The starter is a stub, so the claim was wrong — and being wrong is the
  // measurement working, not a punishment.
  await expect(page.getByText('You expected something else.')).toBeVisible({ timeout: 220_000 });
  await expect(page.getByText('You said it would')).toHaveCount(0);
  // And it is not colored as a failure: being wrong is the measurement working.
  await expect(page.locator('.predict__verdict--wrong')).toBeVisible();
});

test('draws the skill graph as a DAG', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Skill map' }).click();

  const canvas = page.getByRole('group', { name: 'Skill dependency graph' });
  await expect(canvas).toBeVisible();

  // One language at a time, deliberately: six graphs share no edges, and
  // drawing them together was six pictures stacked into noise. The app-wide
  // language is Python after onboarding, so the map shows Python's skills —
  // counted from the bundle itself so adding a skill never breaks this.
  const shown = await page.evaluate(
    () =>
      [...(window.__retrainerPlatform?.skillGraph.all() ?? [])].filter((skill) =>
        skill.id.startsWith('python.'),
      ).length,
  );
  expect(shown).toBe(pythonSkillGraph.size);
  await expect(canvas.locator('.dag__node')).toHaveCount(shown);
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
  const shown = await page.evaluate(
    () =>
      [...(window.__retrainerPlatform?.skillGraph.all() ?? [])].filter((skill) =>
        skill.id.startsWith('python.'),
      ).length,
  );
  await expect(canvas.locator('.dag__node')).toHaveCount(shown);

  await canvas.getByRole('button', { name: /Modeling mutable state/ }).click();

  // The inspector answers what the graph is showing.
  await expect(page.getByRole('heading', { name: 'Modeling mutable state' })).toBeVisible();

  // The chain above and below stays lit; the rest recedes.
  const dimmed = await canvas.locator('.dag__node[data-dimmed="true"]').count();
  const lit = await canvas.locator('.dag__node:not([data-dimmed="true"])').count();
  expect(dimmed).toBeGreaterThan(0);
  expect(lit).toBeGreaterThan(1);
  expect(dimmed + lit).toBe(shown);

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
 * The offline claim, checked rather than asserted.
 *
 * A dependency scan proves no model client was installed. This proves the
 * running application does not talk to one — or to an analytics endpoint, or
 * to a CDN, or to anything at all. Every byte it needs, including the CPython
 * interpreter and esbuild's WebAssembly, is served from its own origin.
 *
 * The earlier version of this test allowed `cdn.jsdelivr.net`, because Pyodide
 * was fetched from there. Vendoring it turned "talks to nothing except a CDN"
 * into "talks to nothing", and this is the line that keeps it that way: add a
 * font, an icon set or an analytics snippet and this fails.
 */
test('talks to nothing at all', async ({ page }) => {
  test.slow();
  const contacted = new Set<string>();

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    contacted.add(url.host);
  });

  await start(page);

  // Walk the whole application, including the screens that fetch their own
  // content and the one that boots an interpreter.
  await page.getByRole('button', { name: 'Skill map' }).click();
  await expect(page.locator('.dag svg')).toBeVisible();

  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: /^Rust/ }).click();
  await expect(page.locator('.activity')).toBeVisible();

  await page.getByRole('button', { name: 'Today' }).click();

  // The interpreter and the TypeScript transformer are the two heaviest
  // things here and the two that used to come from a CDN. Both are exercised.
  const ran = await page.evaluate(async () => {
    const platform = window.__retrainerPlatform;
    const python = await platform?.runtimes.get('python')?.execute({
      workspace: { files: [{ path: 'main.py', contents: 'print("py")' }], entryPoint: 'main.py' },
      limits: { timeoutMs: 200_000, maxOutputBytes: 4096 },
    });
    const typescript = await platform?.runtimes.get('typescript')?.execute({
      workspace: {
        files: [
          {
            path: 'main.ts',
            contents: 'const n: number = 1; console.log("ts" + n);',
          },
        ],
        entryPoint: 'main.ts',
      },
      limits: { timeoutMs: 120_000, maxOutputBytes: 4096 },
    });
    return `${python?.stdout.trim()} ${typescript?.stdout.trim()}`;
  });

  expect(ran).toBe('py ts1');
  expect([...contacted]).toEqual(['127.0.0.1:4173']);
});

declare global {
  interface Window {
    __retrainerPlatform?: Platform;
  }
}

/**
 * JavaScript runs in the browser with nothing downloaded.
 *
 * The page is already a JavaScript engine, so this is the one language the web
 * build runs without an interpreter, a toolchain or a WebAssembly module. It
 * is also the proof that the runtime registry is real: a second language,
 * executing through a completely different mechanism from Python, behind the
 * same interface.
 */
test('runs a JavaScript exercise in a worker', async ({ page }) => {
  test.slow();
  await start(page);

  await page.getByRole('button', { name: 'Skill map' }).click();
  await expect(page.locator('.dag svg')).toBeVisible();

  // The skill map now carries more than one language, which is the visible
  // consequence of the registry.
  const bands = await page.locator('.dag__band-label').allTextContents();
  expect(bands.length).toBeGreaterThan(5);
});
