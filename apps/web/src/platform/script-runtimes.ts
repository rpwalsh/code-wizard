// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { LanguageMetadata, WorkspaceFile } from '@code-wizard/core';
import { EXPECT_JS, RUN_JS, TEST_JS } from '@code-wizard/javascript/sources';
import type { ScriptFile } from '@code-wizard/runtime-web';
import { ScriptWebRuntime } from '@code-wizard/runtime-web';

// Vite compiles this to a worker entry and hands back a constructor, which is
// what guarantees the module is in the build.
import ScriptWorker from '../worker/script-worker.ts?worker';

// Type-only: the implementation is behind the dynamic import below, so
// none of esbuild reaches the main bundle.
import type * as EsbuildModule from 'esbuild-wasm';

/**
 * The languages the browser can run on its own.
 *
 * Four of them, and none needs anything downloaded: the page is already a
 * JavaScript engine. TypeScript and React need their syntax turned into
 * JavaScript first, which is a transform rather than a runtime — and it is
 * loaded only when one of those exercises is actually opened, so a learner
 * doing the Python course never pays for it.
 */
const HARNESS: readonly WorkspaceFile[] = [
  { path: 'node_modules/retrainer/test.js', contents: TEST_JS },
  { path: 'node_modules/retrainer/expect.js', contents: EXPECT_JS },
  { path: 'node_modules/retrainer/run.js', contents: RUN_JS },
];

function harness(): Promise<readonly WorkspaceFile[]> {
  return Promise.resolve(HARNESS);
}

/**
 * TypeScript and JSX into JavaScript, in the page.
 *
 * esbuild's WebAssembly build, loaded on first use and then reused. It is the
 * same transform the desktop build runs through esbuild's native binary, which
 * is the property that matters: an exercise must not behave differently
 * depending on where it was opened.
 *
 * Roughly ten megabytes, which is why it is behind a dynamic import. A learner
 * on the Python or JavaScript course never fetches it.
 */
type Esbuild = typeof EsbuildModule;

let transformer: Promise<Esbuild> | null = null;

async function loadTransformer(): Promise<Esbuild> {
  transformer ??= (async () => {
    const esbuild = await import('esbuild-wasm');
    // Served from this origin, like every other asset here. The JavaScript
    // half is code-split by the bundler and the WebAssembly half is vendored
    // by `scripts/vendor-runtimes.mjs`, so neither reaches the network.
    await esbuild.initialize({
      wasmURL: new URL('runtime/esbuild/esbuild.wasm', document.baseURI).href,
    });
    return esbuild;
  })();
  return transformer;
}

async function transformSources(files: readonly ScriptFile[]): Promise<readonly ScriptFile[]> {
  const needsWork = files.filter(
    (file) => /\.[cm]?tsx?$/u.test(file.path) || file.path.endsWith('.jsx'),
  );
  if (needsWork.length === 0) return files;

  const esbuild = await loadTransformer();

  const transformed = await Promise.all(
    files.map(async (file) => {
      if (!needsWork.includes(file)) return file;

      const result = await esbuild.transform(file.contents, {
        loader: file.path.endsWith('x') ? 'tsx' : 'ts',
        format: 'esm',
        target: 'es2022',
        // The automatic runtime, so components need no React import — matching
        // the desktop build's flags exactly.
        jsx: 'automatic',
        sourcemap: 'inline',
        sourcefile: file.path,
      });

      return { path: file.path.replace(/\.[cm]?[jt]sx?$/u, '.js'), contents: result.code };
    }),
  );

  return transformed;
}

function metadata(
  id: string,
  displayName: string,
  editorLanguage: string,
  fileExtension: string,
): LanguageMetadata {
  return { id, displayName, editorLanguage, fileExtension, commentPrefix: '//', tracing: false };
}

/** Every language the browser runs without help. */
export function createScriptRuntimes(): readonly ScriptWebRuntime[] {
  const mapReportFile = (file: string): string => file;

  return [
    new ScriptWebRuntime({
      metadata: metadata('javascript', 'JavaScript', 'javascript', '.js'),
      createWorker: () => new ScriptWorker(),
      support: harness,
    }),
    new ScriptWebRuntime({
      metadata: metadata('typescript', 'TypeScript', 'typescript', '.ts'),
      createWorker: () => new ScriptWorker(),
      support: harness,
      transform: transformSources,
      mapReportFile: (file) => (file.endsWith('.js') ? file.replace(/\.js$/u, '.ts') : file),
    }),
    new ScriptWebRuntime({
      metadata: metadata('react', 'React', 'typescript', '.tsx'),
      createWorker: () => new ScriptWorker(),
      support: harness,
      transform: transformSources,
      mapReportFile: (file) => (file.endsWith('.js') ? file.replace(/\.js$/u, '.tsx') : file),
    }),
    new ScriptWebRuntime({
      metadata: metadata('angular', 'Angular', 'typescript', '.ts'),
      createWorker: () => new ScriptWorker(),
      support: harness,
      transform: transformSources,
      mapReportFile: (file) => (file.endsWith('.js') ? file.replace(/\.js$/u, '.ts') : file),
    }),
    new ScriptWebRuntime({
      metadata: metadata('node', 'Node', 'javascript', '.js'),
      createWorker: () => new ScriptWorker(),
      support: harness,
      mapReportFile,
    }),
  ];
}
