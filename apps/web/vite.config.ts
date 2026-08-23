// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import react from '@vitejs/plugin-react';
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
  plugins: [react(), contentSecurityPolicy()],
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
