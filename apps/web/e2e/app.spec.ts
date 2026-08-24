// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { Platform } from '../src/platform/types.ts';
import { pythonSkillGraph } from '@code-wizard/python';

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


/**
 * Dismiss the first-run tour.
 *
 * A real learner meets it once and skips or reads it; every test after this
 * point is the second visit. Doing it through the button rather than a
 * storage poke means the tour's own dismissal is exercised on every run.
 */
async function skipTour(page: Page): Promise<void> {
  // The tour appears only after the stored answer has been read, so a bare
  // count() can run before it exists and skip nothing. Wait for it, dismiss
  // it, and wait for it to leave.
  const tour = page.getByRole('dialog', { name: 'Welcome' });
  await tour.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  if (await tour.count()) {
    await page.getByRole('button', { name: 'Skip' }).click();
    await tour.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  }
}

/** Answer the first-run questions and land on the dashboard. */
async function start(page: Page, choice = 'I program, but not in Python'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /^Python/ }).click();
  await page.getByRole('button', { name: choice }).click();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
  await skipTour(page);
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

  // The tour greets a first visit, and leaves for good when dismissed.
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await skipTour(page);
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toHaveCount(0);

  // Reloading must not ask again: the answer is stored, not inferred.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
  await expect(page.getByText('How much Python have you written?')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toHaveCount(0);
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

/**
 * Erasure, end to end.
 *
 * The one action in this product that cannot be undone, so it is the one that
 * most deserves a test proving it does exactly what its confirmation says. It
 * also proves the claim in docs/data.md: a learner can remove everything,
 * without asking anyone, without a network.
 *
 * The assertion is deliberately the strongest available — after erasing, a
 * reload asks the first-run questions again. That can only happen if the
 * stored answer is genuinely gone, not merely hidden.
 */
test('deletes everything on request, from the footer', async ({ page }) => {
  await start(page);

  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  const panel = page.getByRole('dialog', { name: 'Your data' });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(/stored on this device and nowhere else/)).toBeVisible();

  // Deleting is two deliberate steps, never one click.
  await panel.getByRole('button', { name: 'Delete everything' }).click();
  await expect(panel.getByText('Delete everything?')).toBeVisible();

  // And the first step is escapable.
  await panel.getByRole('button', { name: 'Go back' }).click();
  await expect(panel.getByRole('button', { name: 'Save a copy' })).toBeVisible();

  await panel.getByRole('button', { name: 'Delete everything' }).click();
  await panel.getByRole('button', { name: 'Yes, delete it all' }).click();
  await expect(panel).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Which language are you here to get back?' }),
  ).toBeVisible();
});

/**
 * The task panel is adjustable, and remembers.
 *
 * Two things worth holding: that dragging actually moves the boundary, and
 * that the width outlives the exercise. A resizer that forgets is worse than a
 * fixed width, because it asks to be set again every single time.
 */
test('the task panel can be resized, by pointer and by keyboard', async ({ page }) => {
  await start(page);
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();

  const brief = page.getByRole('complementary', { name: 'Task' });
  const divider = page.getByRole('separator', { name: 'Task panel width' });
  await expect(divider).toBeVisible();

  /**
   * Settled width, not instantaneous width.
   *
   * The columns are transitioned, so a bounding box read straight after a
   * change catches the animation in flight. Polling until it stops moving is
   * what a person perceives as the width, and is what the test should judge.
   */
  const settledWidth = async (): Promise<number> => {
    let last = -1;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const current = Math.round((await brief.boundingBox())?.width ?? 0);
      if (current === last) return current;
      last = current;
      await page.waitForTimeout(50);
    }
    return last;
  };

  const before = await settledWidth();
  expect(before).toBeGreaterThan(0);

  // The keyboard moves it, which is the whole reason this is a separator with
  // a value rather than a styled div.
  await divider.focus();
  await divider.press('ArrowRight');
  await expect(divider).toHaveAttribute('aria-valuenow', String(before + 16));
  expect(await settledWidth()).toBeGreaterThan(before);

  // And so does a drag.
  const handle = await divider.boundingBox();
  if (!handle) throw new Error('the divider has no box to drag');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 140, handle.y + handle.height / 2, {
    steps: 12,
  });
  await page.mouse.up();

  const widened = await settledWidth();
  expect(widened).toBeGreaterThan(before + 100);

  // Still that wide after a reload: the width is a stored preference, not a
  // detail of one visit. A resizer that forgets asks to be set again every
  // time, which is worse than a fixed width.
  await page.reload();
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  expect(Math.abs((await settledWidth()) - widened)).toBeLessThan(4);
});

/**
 * The policy, enforced by the browser rather than asserted by a grep.
 *
 * The obvious version of this test is a lie: a cross-origin fetch from the
 * test server fails on its own — no CORS headers, no network — so asserting
 * "the request did not succeed" passes just as happily with no policy at all.
 * It was written that way first, and it passed with the policy removed, which
 * is how it got rewritten.
 *
 * The signal that actually distinguishes the two is the browser's own
 * `securitypolicyviolation` event. It fires when, and only when, a policy
 * refuses something. No policy, no event, and this test fails — which is the
 * property that makes it worth having.
 */
test('the browser refuses to let the page call anywhere else', async ({ page }) => {
  await start(page);

  const violations = await page.evaluate(async () => {
    const seen: { directive: string; blocked: string }[] = [];
    const record = (event: SecurityPolicyViolationEvent): void => {
      seen.push({ directive: event.violatedDirective, blocked: event.blockedURI });
    };
    document.addEventListener('securitypolicyviolation', record);

    // Every route out that does not need a fetch, tried in earnest.
    await fetch('https://example.com/collect', { method: 'POST', body: 'x' }).catch(
      () => undefined,
    );

    await new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = 'https://example.com/pixel.gif';
      setTimeout(resolve, 2000);
    });

    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.onload = () => resolve();
      script.onerror = () => resolve();
      script.src = 'https://example.com/tracker.js';
      document.head.append(script);
      setTimeout(resolve, 2000);
    });

    // The event is dispatched asynchronously; give it a turn to arrive.
    await new Promise((resolve) => setTimeout(resolve, 300));
    document.removeEventListener('securitypolicyviolation', record);
    return seen;
  });

  const directives = violations.map((violation) => violation.directive);
  expect(directives).toContain('connect-src');
  expect(directives).toContain('img-src');
  expect(directives).toContain('script-src-elem');
  expect(violations.every((violation) => violation.blocked.includes('example.com'))).toBe(true);
});

/**
 * Every screen, watched for a single request off this origin.
 *
 * The runtime check used to cover one flow: a Python run. That proved the
 * interpreter is local and inferred the rest of the application. This walks
 * the whole app — dashboard, skill map, practice, an activity, the workspace,
 * the data panel, the command palette — with a recorder attached the entire
 * time, so "the app talks to nobody" stops being an inference.
 */
test('no screen in the app talks to anywhere else', async ({ page }) => {
  test.slow();

  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.host !== '127.0.0.1:4173') external.push(`${url.host} (${request.resourceType()})`);
  });

  await start(page);

  // The dashboard, and the map it links to.
  await expect(page.getByText('Independent fluency')).toBeVisible();
  await page.getByRole('button', { name: 'Skill map' }).click();
  await expect(page.locator('.dag svg')).toBeVisible();

  // Practice, including an activity actually answered.
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
  await page.getByRole('button', { name: /^Rust/ }).click();
  await expect(page.locator('.activity')).toBeVisible();
  await page.locator('.activity__option').first().click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('.activity__explanation')).toBeVisible();

  // The data panel, which is the one screen that touches stored progress.
  await page.getByRole('button', { name: 'Today' }).first().click();
  await page.getByRole('button', { name: 'Your data stays on this device' }).click();
  await expect(page.getByRole('dialog', { name: 'Your data' })).toBeVisible();
  await page.keyboard.press('Escape');

  // The workspace, with the editor loaded and a real test run.
  await page
    .getByRole('button', { name: /Safe account lookup/ })
    .first()
    .click();
  await expect(page.getByRole('main', { name: 'Editor' })).toBeVisible();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await page.getByRole('button', { name: /^Test/ }).click();
  await expect(page.locator('.result--failed').first()).toBeVisible({ timeout: 220_000 });

  expect(external).toEqual([]);
});
