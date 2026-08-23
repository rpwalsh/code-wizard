// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-retrainer/core';
import type {
  Command,
  CompileStep,
  RunContext,
  TestContext,
  ToolchainSpec,
} from '@code-retrainer/toolchain';
import { ToolchainRuntime } from '@code-retrainer/toolchain';

/**
 * React, rendered on the server and asserted on the output.
 *
 * No browser, no jsdom, no test renderer. A component is a function that
 * returns elements, and `react-dom/server` turns those into HTML with no DOM
 * anywhere — so an exercise renders a component to a string and asserts on
 * what came out. That is a real render: hooks run, state initialises, props
 * flow, lists key, conditionals branch.
 *
 * What it deliberately does not cover is anything after the first paint —
 * clicks, effects, timers — because effects do not run during server
 * rendering. Rather than pretend otherwise, the curriculum splits the two:
 * render-time behavior is tested here, and everything about effects and event
 * handlers is tested by calling the reducer, the handler or the custom hook's
 * logic *directly*, which is where that logic should live anyway. An exercise
 * that cannot be tested without a click is usually an exercise whose logic is
 * trapped inside a component.
 *
 * TypeScript throughout, because React without types in 2026 is a choice
 * nobody is making.
 *
 * One build step, and only one. Node strips *types* natively but does not
 * transform *JSX* — `<Hello />` is still a syntax error to it — so every run
 * transforms `.tsx` with esbuild first. That is a few milliseconds for a
 * handful of files, it is the same transform every React toolchain performs,
 * and it is the only place in this product where a bundler is involved.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** The JavaScript package's harness, reused verbatim. */
export const supportDir = path.resolve(here, '..', '..', 'javascript', 'runtime', 'retrainer');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const SUPPORT_FILES = ['package.json', 'expect.js', 'test.js', 'run.js', 'harness.mjs'] as const;
const HARNESS = 'node_modules/retrainer/harness.mjs';

/**
 * Where React actually lives on this machine.
 *
 * Resolved from the installed package rather than assumed, so the sandbox
 * links the same copy the rest of the toolkit was built against. A version
 * skew here would show up as a hook error inside a learner's component, which
 * is about the least debuggable failure this product could produce.
 */
function packageRoot(name: string): string {
  return path.dirname(require.resolve(`${name}/package.json`));
}

/**
 * esbuild's entry script, run through the Node already in hand.
 *
 * Not the platform binary directly. esbuild ships the real executable in a
 * per-platform package (`@esbuild/win32-x64` and friends) and puts a small
 * Node shim at `bin/esbuild` that finds the right one — so pointing at
 * `bin/esbuild.exe` finds nothing on Windows, and hard-coding the platform
 * package means a table of architectures to keep in step with a dependency.
 * Running the shim is what `npx esbuild` does, and it is correct everywhere.
 *
 * Resolved from the installed package rather than looked for on PATH: a
 * globally installed esbuild of a different version would emit a JSX transform
 * this React does not match, and that failure surfaces inside a learner's
 * component, which is about the least debuggable place it could appear.
 */
function esbuildEntry(): string {
  return path.join(packageRoot('esbuild'), 'bin', 'esbuild');
}

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.tsx',
      contents: [
        "import { renderToStaticMarkup } from 'react-dom/server';",
        '',
        'function Hello({ name }: { name: string }) {',
        '  return <p>ok {name}</p>;',
        '}',
        '',
        'console.log(renderToStaticMarkup(<Hello name="there" />));',
      ].join('\n'),
    },
  ],
  entryPoint: 'main.tsx',
};

export const reactSpec: ToolchainSpec = {
  metadata: {
    id: 'react',
    displayName: 'React',
    editorLanguage: 'typescript',
    fileExtension: '.tsx',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  tools: [
    {
      // Node has stripped TypeScript since 22.6 and has understood JSX in
      // `.tsx` since 22.7. Below that a learner would meet a syntax error in
      // their own file, which is the wrong thing to show them.
      candidates: [process.execPath],
      versionArgs: ['--version'],
      label: 'Node 22.7 or later',
      install:
        'Install Node 22.7 or later from https://nodejs.org — earlier versions cannot run .tsx directly.',
    },
  ],

  links: [
    { name: 'react', from: packageRoot('react') },
    { name: 'react-dom', from: packageRoot('react-dom') },
    { name: 'scheduler', from: packageRoot('scheduler') },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const harness = await Promise.all(
      SUPPORT_FILES.map(async (name) => ({
        path: `node_modules/retrainer/${name}`,
        contents: await fs.readFile(path.join(supportDir, name), 'utf8'),
      })),
    );

    return [
      ...harness,
      // Tells Node these are modules and points the automatic JSX transform at
      // React. Without the `jsx` setting every `.tsx` file would need an
      // explicit React import, which is the pre-2020 style nobody writes now.
      {
        path: 'package.json',
        contents:
          JSON.stringify({ name: 'exercise', private: true, type: 'module' }, null, 2) + '\n',
      },
      {
        path: 'tsconfig.json',
        contents:
          JSON.stringify(
            {
              compilerOptions: {
                target: 'es2023',
                module: 'preserve',
                moduleResolution: 'bundler',
                jsx: 'react-jsx',
                strict: true,
                noEmit: true,
                allowImportingTsExtensions: true,
                types: [],
              },
            },
            null,
            2,
          ) + '\n',
      },
    ];
  },

  compile(context: RunContext): Promise<CompileStep | null> {
    const sources = context.files.filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'));
    if (sources.length === 0) return Promise.resolve(null);

    return Promise.resolve({
      label: 'esbuild',
      command: process.execPath,
      args: [
        esbuildEntry(),
        ...sources,
        '--outdir=.',
        '--out-extension:.js=.js',
        '--format=esm',
        '--platform=node',
        '--target=node22',
        // The automatic runtime, so components need no React import — which is
        // how React has been written since 2020 and what the curriculum shows.
        '--jsx=automatic',
        '--sourcemap=inline',
        '--log-level=warning',
      ],
    });
  },

  run(context: RunContext): Command {
    return {
      command: process.execPath,
      args: [compiled(context.entryPoint), ...context.args],
    };
  },

  test(context: TestContext): Command {
    return {
      command: process.execPath,
      args: [HARNESS, '--report', context.reportFile, ...context.testFiles.map(compiled)],
    };
  },

  /**
   * esbuild wrote `tests/x.test.js`; the exercise declared `tests/x.test.tsx`.
   *
   * The harness reports what it actually imported, which is correct and not
   * what the engine is keyed on. Mapping back is what lets an exercise's
   * visibility rules reach the results — without it a hidden test file's
   * output would be shown in full.
   */
  mapReportFile(file: string): string {
    return file.endsWith('.js') ? file.replace(/\.js$/u, '.tsx') : file;
  },
};

/** Where esbuild put the transformed copy of a source file. */
function compiled(file: string): string {
  return file.replace(/\.tsx?$/u, '.js');
}

export function createReactRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(reactSpec, options);
}
