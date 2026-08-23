// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('apps/web/dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.zip': 'application/zip', '.whl': 'application/octet-stream', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  let file = path.join(dist, decodeURIComponent(new globalThis.URL(req.url, 'http://x').pathname));
  try {
    let data;
    try { data = await readFile(file); } catch { file = path.join(dist, 'index.html'); data = await readFile(file); }
    res.setHeader('content-type', types[path.extname(file)] ?? 'application/octet-stream');
    res.end(data);
  } catch (e) { res.statusCode = 500; res.end(String(e)); }
});
await new Promise((r) => server.listen(4173, r));

const out = process.argv[2] ?? 'shots';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));
await page.goto('http://localhost:4173/');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}/10-onboard-language.png` });

// Step 1: choose JavaScript; step 2: rusty.
const jsChoice = page.locator('.onboarding__choice', { hasText: 'JavaScript' });
if (await jsChoice.count()) {
  await jsChoice.first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/11-onboard-level.png` });
  await page.locator('.onboarding__choice').nth(1).click();
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: `${out}/12-home-js.png` });

// Switch language from the dropdown.
await page.locator('.language-select').selectOption('python');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/13-home-python.png` });

// A practice-only language.
const options = await page.locator('.language-select option').allTextContents();
console.log('dropdown:', options.join(' | '));
const rust = await page.locator('.language-select option[value="rust"]').count();
if (rust) {
  await page.locator('.language-select').selectOption('rust');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/14-home-rust.png` });
}

await page.getByRole('button', { name: 'Skill map' }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/15-map.png` });

await page.getByRole('button', { name: 'Practice' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/16-practice.png` });

// Start a practice run.
const startRun = page.locator('button', { hasText: 'Start' }).first();
if (await startRun.count()) {
  await startRun.click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/17-activity.png` });
}

// Open a workspace from home.
await page.getByRole('button', { name: 'Today' }).click();
await page.waitForTimeout(600);
await page.locator('.language-select').selectOption('javascript');
await page.waitForTimeout(900);
const row = page.locator('.catalog__row').first();
if (await row.count()) {
  await row.click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/18-workspace.png` });
}

await browser.close();
server.close();
console.log('done');
