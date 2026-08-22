import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against the real production build.
 *
 * Not the dev server: the deployed artefact is what visitors get, and the two
 * differ in exactly the places most likely to break — worker bundling, asset
 * URLs and code splitting. Testing the build is what makes "it runs in a
 * browser" a fact rather than a hope.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  // Booting CPython in WebAssembly is genuinely slow the first time.
  timeout: 240_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    video: 'off',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
