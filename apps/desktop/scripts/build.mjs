#!/usr/bin/env node
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Bundle the Electron main and preload scripts.
 *
 * They are bundled rather than compiled file-by-file so the packaged app does
 * not need node_modules laid out beside it, and so the preload can be emitted
 * as CommonJS: a sandboxed preload cannot be an ES module, while the main
 * process is happiest as one.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repositoryRoot = path.resolve(root, '..', '..');

await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  // Electron and node builtins are provided by the runtime, and node:sqlite is
  // a builtin too — bundling any of them would break at load.
  external: ['electron', 'node:*'],
  logLevel: 'info',
};

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, 'src', 'main.ts')],
  outfile: path.join(root, 'dist', 'main.js'),
  format: 'esm',
  // esbuild emits ESM that may reference these; define them for the bundle.
  banner: {
    js: [
      "import { createRequire as __retrainerCreateRequire } from 'node:module';",
      'const require = __retrainerCreateRequire(import.meta.url);',
    ].join('\n'),
  },
});

await esbuild.build({
  ...shared,
  entryPoints: [path.join(root, 'src', 'preload.ts')],
  outfile: path.join(root, 'dist', 'preload.cjs'),
  format: 'cjs',
});

// The renderer is the web build, verbatim.
const renderer = path.join(repositoryRoot, 'apps', 'web', 'dist');
await cp(renderer, path.join(root, 'renderer'), { recursive: true });

// And the curriculum bundle, for a packaged app with no source tree.
await cp(
  path.join(repositoryRoot, 'apps', 'web', 'public', 'content'),
  path.join(root, 'content'),
  { recursive: true },
);

console.log('desktop build complete');
