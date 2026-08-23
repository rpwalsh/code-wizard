// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('apps/web/dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.zip': 'application/zip', '.whl': 'application/octet-stream' };
const server = createServer(async (req, res) => {
  let file = path.join(dist, decodeURIComponent(new globalThis.URL(req.url, 'http://x').pathname));
  try {
    let data;
    try { data = await readFile(file); } catch { file = path.join(dist, 'index.html'); data = await readFile(file); }
    res.setHeader('content-type', types[path.extname(file)] ?? 'application/octet-stream');
    res.end(data);
  } catch (e) { res.statusCode = 500; res.end(String(e)); }
});
await new Promise((r) => server.listen(4174, r));

const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4174/');
await page.waitForTimeout(3000);
await page.locator('.onboarding__choice', { hasText: 'JavaScript' }).first().click();
await page.waitForTimeout(300);
await page.locator('.onboarding__choice').nth(3).click(); // new to programming
await page.waitForTimeout(1500);

// Switch the mode dropdown to Learn, then open an exercise.
await page.locator('.mode-select').selectOption('learn');
await page.locator('.catalog__row').first().click();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}/20-walkthrough-open.png` });

// Walk forward: goal -> tests -> first hint reveal.
await page.getByRole('button', { name: 'Next →' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Next →' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Show me' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/21-walkthrough-hint.png` });

// Jump to the solution step.
for (let i = 0; i < 5; i++) {
  const next = page.getByRole('button', { name: 'Next →' });
  if (await next.count()) await next.click();
  await page.waitForTimeout(200);
}
const show = page.getByRole('button', { name: 'Show the solution' });
if (await show.count()) {
  await show.click();
  await page.waitForTimeout(500);
}
await page.screenshot({ path: `${out}/22-walkthrough-solution.png` });

await browser.close();
server.close();
console.log('done');
