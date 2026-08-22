/**
 * A Monaco build containing only what Code Retrainer uses.
 *
 * Importing the `monaco-editor` barrel pulls in every language it ships with —
 * ABAP, Solidity, Razor and eighty more — which is over 3 MB of grammars for a
 * Python trainer. These curated imports keep the editor to its core plus the
 * one language the runtime actually reports.
 *
 * When a second language runtime lands, add its contribution here.
 */
import type * as MonacoTypes from 'monaco-editor';
import * as edcore from 'monaco-editor/esm/vs/editor/edcore.main.js';

import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';

// Implementation from the deep path, types from the barrel. The barrel import
// is erased at build time, so no grammars come with it.
export const monaco = edcore as typeof MonacoTypes;

/**
 * Monaco runs its language services on a worker. Without this it silently
 * falls back to the main thread and the editor stutters while typing.
 */
export function installMonacoEnvironment(): void {
  self.MonacoEnvironment ??= {
    getWorker: () =>
      new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
        type: 'module',
      }),
  };
}
