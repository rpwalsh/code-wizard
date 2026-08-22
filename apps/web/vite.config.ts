import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so the same build works at a domain root, under a
  // GitHub Pages project path (/code-retrainer/), and from Electron's file:// loader.
  base: './',
  plugins: [react()],
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
