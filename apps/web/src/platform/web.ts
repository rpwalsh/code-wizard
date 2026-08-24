// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { LanguageRuntime } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';
import { catalogFromBundle, parseBundle } from '@code-wizard/exercises';
import { browserChannel, PyodideRuntime } from '@code-wizard/runtime-web';

import { createScriptRuntimes } from './script-runtimes.ts';
import { PhpWebRuntime } from './php-runtime.ts';
import { SqlWebRuntime } from './sql-runtime.ts';

// Vite's `?worker` suffix compiles the module as a worker entry and hands back
// a constructor, which guarantees it is in the build.
import PyodideWorker from '../worker/pyodide-worker.ts?worker';
import { IndexedDbProgressStore } from '@code-wizard/storage/indexeddb';

import type { Platform, PlatformProgress } from './types.ts';

/**
 * Pyodide's own assets — the WASM interpreter and the standard library.
 *
 * Served from this site, not from a CDN. That is a deliberate reversal of the
 * usual advice and it costs about twelve megabytes in the deploy.
 *
 * What it buys is the product's central claim, made true rather than nearly
 * true: this talks to nothing. Not "nothing except a CDN" — nothing. It works
 * on a train, on a laptop with the network off, behind a corporate proxy that
 * blocks jsDelivr, and in five years when somebody else's infrastructure has
 * moved on. A browser test asserts that no request leaves the origin, so the
 * claim is checked rather than promised.
 *
 * `scripts/vendor-runtimes.mjs` copies these out of the installed package at
 * build time, so the version can never drift from the one in package-lock.
 */
const PYODIDE_INDEX_URL = new URL('runtime/pyodide/', document.baseURI).href;

/** Where `code-wizard content bundle` writes the curriculum. */
const CATALOG_URL = 'content/catalog.json';

export async function createWebPlatform(
  report: (progress: PlatformProgress) => void = () => {},
): Promise<Platform> {
  report({ stage: 'catalog', message: 'Loading exercises…' });

  const response = await fetch(new URL(CATALOG_URL, document.baseURI));
  if (!response.ok) {
    throw new Error(
      `Could not load the exercise catalog (${response.status}). ` +
        'The site may have been deployed without running `code-wizard content bundle`.',
    );
  }
  const bundle = parseBundle(await response.text());
  const catalog = catalogFromBundle(bundle);
  const skillGraph = SkillGraph.from(bundle.skills);

  report({ stage: 'storage', message: 'Opening your progress…' });
  const storage = await IndexedDbProgressStore.openOrFallBack();

  const runtime = new PyodideRuntime({
    createChannel: () => browserChannel(new PyodideWorker()),
    indexUrl: PYODIDE_INDEX_URL,
    onProgress: (message) => report({ stage: 'runtime', message }),
    // The first load downloads an interpreter over a connection we do not
    // control, so it gets far longer than a normal call.
    bootTimeoutMs: 180_000,
  });

  // Python is the one that needs an interpreter downloaded; the rest are the
  // browser itself. Both kinds are the same interface from here on.
  const runtimes = new Map<string, LanguageRuntime>([[runtime.metadata().id, runtime]]);

  // SQL rides on the same interpreter: CPython bundles SQLite, so the engine
  // is already in the page and the harness is the desktop's own file. No
  // second WebAssembly build, and no second dialect to keep in step.
  const sql = new SqlWebRuntime(runtime);
  runtimes.set(sql.metadata().id, sql);

  // PHP is a real PHP compiled to WebAssembly, and it is nineteen megabytes.
  // It boots on first use rather than at page load, so the download is paid
  // by the people who open PHP and by nobody else.
  const php = new PhpWebRuntime({
    onProgress: (message) => report({ stage: 'runtime', message }),
  });
  runtimes.set(php.metadata().id, php);
  for (const script of createScriptRuntimes()) {
    runtimes.set(script.metadata().id, script);
  }

  return {
    kind: 'web',
    runtimes,
    store: storage.store,
    catalog,
    skillGraph,
    persistent: storage.persistent,
    ...(storage.reason ? { storageNote: storage.reason } : {}),
    warmUp: async () => {
      report({ stage: 'runtime', message: 'Starting Python…' });
      await runtime.warmUp();
      report({ stage: 'ready', message: 'Ready.' });
    },
  };
}
