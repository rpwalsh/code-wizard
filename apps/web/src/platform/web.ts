import { SkillGraph } from '@forge/core';
import { catalogFromBundle, parseBundle } from '@forge/exercises';
import { browserChannel, PyodideRuntime } from '@forge/runtime-web';

// Vite's `?worker` suffix compiles the module as a worker entry and hands back
// a constructor, which guarantees it is in the build.
import PyodideWorker from '../worker/pyodide-worker.ts?worker';
import { IndexedDbProgressStore } from '@forge/storage/indexeddb';

import type { Platform, PlatformProgress } from './types.ts';

/**
 * Pyodide's own assets — the WASM interpreter and the standard library.
 *
 * Served from jsDelivr rather than bundled, deliberately. Vendoring them would
 * add ~30 MB to the repository and the deploy, for a file set that is already
 * on a CDN, immutable per version, and shared with every other Pyodide site a
 * visitor has loaded. The version is pinned, so it cannot change under us.
 */
const PYODIDE_VERSION = '314.0.5';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Where `forge content bundle` writes the curriculum. */
const CATALOG_URL = 'content/catalog.json';

export async function createWebPlatform(
  report: (progress: PlatformProgress) => void = () => {},
): Promise<Platform> {
  report({ stage: 'catalog', message: 'Loading exercises…' });

  const response = await fetch(new URL(CATALOG_URL, document.baseURI));
  if (!response.ok) {
    throw new Error(
      `Could not load the exercise catalogue (${response.status}). ` +
        'The site may have been deployed without running `forge content bundle`.',
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

  return {
    kind: 'web',
    runtime,
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
