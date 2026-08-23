// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import { CONTENT_SECURITY_POLICY } from './security-policy.ts';

/**
 * Stamp the policy into the built HTML.
 *
 * Build only. The dev server needs an inline script and a websocket for hot
 * reloading, and a policy that forbids them would make development a fight
 * with a protection that is not what is being developed. What ships is what
 * is tested: the production build is what every browser test loads, and the
 * desktop app packages the same output.
 */
/**
 * Let the PHP engine's own loader see its binary as a URL.
 *
 * The Emscripten glue does `import filename from './php_8_4.wasm'` and expects
 * a *path*, which is how its own build pipeline resolves it. Vite's default is
 * the WebAssembly ESM proposal, which tries to instantiate the module and then
 * fails on Emscripten's `env` imports — a real incompatibility rather than a
 * configuration miss.
 *
 * Rewriting those imports to Vite's `?url` form gives the glue the string it
 * expects, and emits the binary as an ordinary hashed asset beside the page.
 * Scoped to the engine's own package so nothing else changes meaning.
 */
function phpWasmAsUrl(): Plugin {
  return {
    name: 'php-wasm-as-url',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer?.includes('@php-wasm') || !source.endsWith('.wasm')) return null;
      const resolved = await this.resolve(`${source}?url`, importer, { skipSelf: true });
      return resolved?.id ?? null;
    },
  };
}

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: CONTENT_SECURITY_POLICY,
            },
            // After the charset declaration, which browsers want early.
            injectTo: 'head',
          },
        ],
      };
    },
  };
}

export default defineConfig({
  // Relative asset URLs, so the same build works at a domain root, under a
  // GitHub Pages project path (/code-retrainer/), and from Electron's file:// loader.
  base: './',
  // `wasm` teaches the bundler the WebAssembly ESM import that the PHP engine
  // uses; `topLevelAwait` covers the await that its loader performs at module
  // scope. Both emit the binary as an ordinary local asset, which is what
  // keeps the engine same-origin and inside the content security policy.
  plugins: [react(), phpWasmAsUrl(), wasm(), contentSecurityPolicy()],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Monaco's editor core is ~850 kB gzipped and is the price of a real
    // editor rather than a textarea. It is one immutable, cacheable chunk,
    // and it is split out so the shell renders before it arrives.
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco is by far the largest dependency; splitting it lets the
          // shell render while the editor is still arriving.
          monaco: ['monaco-editor/esm/vs/editor/edcore.main.js', '@monaco-editor/react'],
        },
      },
    },
  },
  optimizeDeps: {
    // Pyodide loads its own wasm assets at runtime and must not be pre-bundled.
    exclude: ['pyodide'],
  },
  server: { port: 5173 },
});
