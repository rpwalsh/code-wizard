// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { JsonObject } from '@code-retrainer/core';
import { isJsonObject, parseJson } from '@code-retrainer/core';
import { describe, expect, it } from 'vitest';

/**
 * The principles, as tests.
 *
 * A stated principle is a marketing sentence. These are the ones that can be
 * mechanically checked, so that "no AI in the learner experience" is a fact
 * about the build rather than a claim in a README — and so that adding one
 * later requires deleting a test, which is a conversation rather than an
 * afternoon.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relative: string): Promise<JsonObject> {
  const parsed = parseJson(await readFile(path.join(root, relative), 'utf8'));
  if (!isJsonObject(parsed)) throw new Error(`${relative} is not a JSON object`);
  return parsed;
}

/** Every dependency name a manifest declares, across all three fields. */
function declaredNames(manifest: JsonObject): string[] {
  const names: string[] = [];
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const declared = manifest[field];
    if (isJsonObject(declared)) names.push(...Object.keys(declared));
  }
  return names;
}

/** Packages that would put a model in the loop. */
const LLM_CLIENTS = [
  'openai',
  '@anthropic-ai/sdk',
  '@anthropic-ai/claude-agent-sdk',
  '@google/generative-ai',
  '@google/genai',
  '@mistralai/mistralai',
  'cohere-ai',
  'replicate',
  'langchain',
  '@langchain/core',
  'llamaindex',
  'ollama',
  'ai',
  '@ai-sdk/openai',
  'openai-edge',
  'gpt-3-encoder',
  'js-tiktoken',
];

const MANIFESTS = [
  'package.json',
  'apps/web/package.json',
  'apps/desktop/package.json',
  'packages/core/package.json',
  'packages/curriculum/package.json',
  'packages/execution/package.json',
  'packages/exercises/package.json',
  'packages/learning/package.json',
  'packages/runtime-web/package.json',
  'packages/session/package.json',
  'packages/storage/package.json',
  'packages/cli/package.json',
  'languages/python/package.json',
];

describe('no AI in the learner experience', () => {
  it('declares no LLM client in any manifest', async () => {
    const offenses: string[] = [];

    for (const manifest of MANIFESTS) {
      for (const name of declaredNames(await readJson(manifest))) {
        if (LLM_CLIENTS.includes(name)) offenses.push(`${manifest} → ${name}`);
      }
    }

    expect(offenses).toEqual([]);
  });

  it('resolves no LLM client anywhere in the installed tree', async () => {
    // Catches a transitive dependency pulling one in, which a manifest scan
    // would miss entirely.
    const lock = await readFile(path.join(root, 'package-lock.json'), 'utf8');
    const installed: string[] = [];

    for (const client of LLM_CLIENTS) {
      // Match a package path, not a substring: "ai" must not match "aria".
      if (
        new RegExp(`"node_modules/${client.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}"`).test(lock)
      ) {
        installed.push(client);
      }
    }

    expect(installed).toEqual([]);
  });

  it('mentions no model endpoint in shipped source', async () => {
    const { globby } = await import('globby');
    const files = await globby(
      ['packages/**/src/**/*.ts', 'apps/*/src/**/*.{ts,tsx}', 'languages/**/src/**/*.ts'],
      { cwd: root, gitignore: true },
    );

    const endpoints = /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/;
    const offenses: string[] = [];

    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      if (endpoints.test(contents)) offenses.push(file);
    }

    expect(offenses).toEqual([]);
  });
});

describe('free forever, as an architectural constraint', () => {
  it('ships no payment or analytics dependency', async () => {
    const forbidden = [
      'stripe',
      '@stripe/stripe-js',
      'paddle-sdk',
      '@paddle/paddle-js',
      'posthog-js',
      'mixpanel-browser',
      '@amplitude/analytics-browser',
      'react-ga4',
      '@segment/analytics-next',
      '@sentry/browser',
    ];

    // The web build is what a visitor downloads. Anything that bills them or
    // watches them would have to arrive here first.
    const declared = declaredNames(await readJson('apps/web/package.json'));
    expect(declared.filter((name) => forbidden.includes(name))).toEqual([]);
  });

  /**
   * The property the whole privacy posture rests on.
   *
   * A browser build that names no external host cannot send anything to one.
   * The end-to-end suite proves this at runtime by failing the test if the
   * page makes a single request off-origin; this proves it at build time,
   * where it is cheap enough to run on every commit and specific enough to
   * name the file that broke it.
   *
   * If a font, an icon set or an error reporter is ever wanted, this test is
   * the conversation that has to happen first — which is the point.
   */
  it('names no external host in the browser build', async () => {
    const { globby } = await import('globby');
    const files = await globby(['apps/web/src/**/*.{ts,tsx,css}', 'apps/web/index.html'], {
      cwd: root,
      gitignore: true,
    });

    /**
     * Two ways to name somewhere else, and both have to be caught.
     *
     * The obvious one carries a scheme. The other omits it: `//example.com`
     * is a complete absolute URL that inherits whichever scheme the page was
     * served over, and it is the form a person writes by accident when
     * copying a snippet. A pattern that only knows about `https://` waves it
     * straight through.
     *
     * The protocol-relative pattern requires an opening quote, bracket or
     * equals sign before the slashes and something domain-shaped after, so
     * ordinary `// comment` text and the `//` inside a path do not match.
     */
    const patterns: readonly RegExp[] = [
      /https?:\/\/(?!localhost|127\.0\.0\.1)/i,
      /["'`(=]\s*\/\/[a-z0-9-]+(\.[a-z0-9-]+)+/i,
    ];
    const offenses: string[] = [];

    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      for (const [index, line] of contents.split(/\r?\n/u).entries()) {
        // A URL in a comment ships to nobody: it is prose about a standard
        // or a spec, and banning those would only teach people to write them
        // without the scheme. Only whole-line comments are exempt, because
        // stripping a line at its first `//` would also strip the one inside
        // `https://` — which is the single thing this test exists to find.
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        if (patterns.some((pattern) => pattern.test(line))) {
          offenses.push(`${file}:${index + 1}`);
        }
      }
    }

    expect(offenses).toEqual([]);
  });

  /**
   * The policy that makes the source-level check into a real guarantee.
   *
   * Scanning `apps/web/src` proves only that *this repository* names nowhere
   * else. It can say nothing about the several megabytes of dependencies
   * compiled in beside it, and two of those do carry a CDN address. What
   * settles the question is the Content Security Policy: with no host in any
   * directive, the browser refuses an off-origin request before it is made,
   * whoever wrote the code that asked.
   *
   * So this asserts the policy ships, and that it names nobody.
   */
  it('ships a content security policy that names no host', async () => {
    const html = await readFile(path.join(root, 'apps/web/dist/index.html'), 'utf8');

    const meta = /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/i.exec(html);
    expect(meta, 'the built page carries no content security policy').not.toBeNull();

    // The attribute is HTML-escaped in the built page, and `&#39;` carries a
    // semicolon of its own — which is also the directive separator. Decoding
    // before parsing, or every directive splits in the middle of a quote.
    const content = (/content=["']([^"']+)["']/i.exec(meta?.[0] ?? '')?.[1] ?? '')
      .replaceAll('&#39;', "'")
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&');
    expect(content).toContain('default-src');

    // Every directive value must be a keyword or a bare scheme. A hostname
    // anywhere in the policy is a hole in it.
    const offenders: string[] = [];
    for (const directive of content.split(';')) {
      const [name, ...values] = directive.trim().split(/\s+/u);
      if (!name) continue;
      for (const value of values) {
        const keyword = value.startsWith("'");
        const scheme = /^[a-z-]+:$/i.test(value);
        if (!keyword && !scheme) offenders.push(`${name}: ${value}`);
      }
    }
    expect(offenders).toEqual([]);

    // The directive that governs fetch, XHR, WebSocket, EventSource and
    // sendBeacon. If any one of these regressed the rest would not matter.
    for (const required of ['connect-src', 'script-src', 'img-src', 'default-src']) {
      expect(content).toContain(required);
    }
  });

  /**
   * What the dependencies bring with them.
   *
   * Two of these are live code paths that are switched off by configuration
   * rather than absent — the editor's loader and the Python runtime both
   * default to a CDN and are both pointed at bundled copies instead. The rest
   * are documentation links in error messages and the XML namespace that every
   * SVG element declares.
   *
   * None of them are reachable, because the policy above forbids it. This test
   * exists so that a *new* one cannot arrive unnoticed: the day a dependency
   * adds a telemetry endpoint, this fails and somebody reads the diff.
   */
  it('adds no new external host to the shipped bundle', async () => {
    const known = new Set([
      // Monaco's loader default and Pyodide's package fallback. Both overridden.
      'cdn.jsdelivr.net',
      // Documentation links printed inside error messages.
      'code.visualstudio.com',
      'github.com',
      'microsoft.com',
      'react.dev',
      // The SVG namespace. A constant string, never fetched by anything.
      'www.w3.org',
    ]);

    const { globby } = await import('globby');
    const files = await globby(['apps/web/dist/**/*.{js,css,html}'], { cwd: root });
    expect(files.length, 'nothing was built to inspect').toBeGreaterThan(0);

    const found = new Map<string, string>();
    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      for (const match of contents.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) {
        const host = match[1] ?? '';
        if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
          if (!found.has(host)) found.set(host, file);
        }
      }
    }

    const arrivals = [...found].filter(([host]) => !known.has(host));
    expect(arrivals.map(([host, file]) => `${host} (${file})`)).toEqual([]);
  });

  it('requires no account to use', async () => {
    const { globby } = await import('globby');
    const files = await globby(['apps/web/src/**/*.{ts,tsx}'], { cwd: root, gitignore: true });

    const authish = /\b(signIn|signUp|logIn|oauth|accessToken|refreshToken)\b/i;
    const offenses: string[] = [];

    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      if (authish.test(contents)) offenses.push(file);
    }

    expect(offenses).toEqual([]);
  });
});

describe('the terms are stated, not implied', () => {
  it('ships both licenses and the notice that there is no support', async () => {
    // An unlicensed repository means all rights reserved, which would quietly
    // contradict every sentence in PRINCIPLES.md about what a learner may do.
    for (const file of ['LICENSE.md', 'CONTENT-LICENSE.md', 'CONTRIBUTING.md']) {
      const contents = await readFile(path.join(root, file), 'utf8');
      expect(contents.trim().length, `${file} is empty`).toBeGreaterThan(200);
    }
  });

  it('points every manifest at the license rather than leaving it blank', async () => {
    const unlicensed: string[] = [];

    for (const manifest of MANIFESTS) {
      const declared = (await readJson(manifest))['license'];
      if (typeof declared !== 'string' || !declared.includes('LICENSE.md')) {
        unlicensed.push(manifest);
      }
    }

    expect(unlicensed).toEqual([]);
  });

  it('keeps the curriculum terms separate from the software terms', async () => {
    // The split is the whole point: the software is permissive for
    // noncommercial use and the curriculum is not. A single license file
    // covering both would erase the distinction the content license exists for.
    const software = await readFile(path.join(root, 'LICENSE.md'), 'utf8');
    expect(software).toMatch(/CONTENT-LICENSE\.md/);
    expect(software).toMatch(/PolyForm Noncommercial License 1\.0\.0/);

    const content = await readFile(path.join(root, 'CONTENT-LICENSE.md'), 'utf8');
    expect(content).toMatch(/languages\/\*\/exercises/);
  });
});

describe('the language is a plugin', () => {
  it('keeps every language name out of the engines', async () => {
    const { globby } = await import('globby');
    const files = await globby(
      [
        'packages/core/src/**/*.ts',
        'packages/learning/src/**/*.ts',
        'packages/curriculum/src/**/*.ts',
        'packages/exercises/src/**/*.ts',
      ],
      { cwd: root, gitignore: true, ignore: ['**/*.test.ts'] },
    );

    const offenses: string[] = [];
    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      // Comments and doc examples may name Python; code must not branch on it.
      const code = contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/['"`]python['"`]/i.test(code)) offenses.push(file);
    }

    expect(offenses).toEqual([]);
  });
});
