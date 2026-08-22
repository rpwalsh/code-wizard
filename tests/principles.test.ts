import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { JsonObject } from '@forge/core';
import { isJsonObject, parseJson } from '@forge/core';
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
    const offences: string[] = [];

    for (const manifest of MANIFESTS) {
      for (const name of declaredNames(await readJson(manifest))) {
        if (LLM_CLIENTS.includes(name)) offences.push(`${manifest} → ${name}`);
      }
    }

    expect(offences).toEqual([]);
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
    const offences: string[] = [];

    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      if (endpoints.test(contents)) offences.push(file);
    }

    expect(offences).toEqual([]);
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

  it('requires no account to use', async () => {
    const { globby } = await import('globby');
    const files = await globby(['apps/web/src/**/*.{ts,tsx}'], { cwd: root, gitignore: true });

    const authish = /\b(signIn|signUp|logIn|oauth|accessToken|refreshToken)\b/i;
    const offences: string[] = [];

    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      if (authish.test(contents)) offences.push(file);
    }

    expect(offences).toEqual([]);
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

    const offences: string[] = [];
    for (const file of files) {
      const contents = await readFile(path.join(root, file), 'utf8');
      // Comments and doc examples may name Python; code must not branch on it.
      const code = contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/['"`]python['"`]/i.test(code)) offences.push(file);
    }

    expect(offences).toEqual([]);
  });
});
