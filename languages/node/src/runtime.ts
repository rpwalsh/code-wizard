// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-retrainer/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-retrainer/toolchain';
import { ToolchainRuntime } from '@code-retrainer/toolchain';

/**
 * Node: JavaScript with a machine underneath it.
 *
 * The same language as the `javascript` course and deliberately a separate
 * one here, because the thing being trained is different. `javascript` is
 * values, closures, `this` and asynchrony — what the language does. This is
 * streams, back pressure, the event loop's actual phase order, file
 * descriptors, signals and shutdown — what the *runtime* does, none of which
 * is visible from a browser and all of which is where server-side JavaScript
 * actually costs people time.
 *
 * Concretely, the difference that matters is the sandbox: this one permits the
 * Node built-ins an exercise needs to be about I/O at all, and its exercises
 * are written against a real filesystem inside the sandbox rather than against
 * a fake.
 */
const here = path.dirname(fileURLToPath(import.meta.url));

/** The JavaScript package's harness, reused verbatim. One harness, one report. */
export const supportDir = path.resolve(here, '..', '..', 'javascript', 'runtime', 'retrainer');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const SUPPORT_FILES = ['package.json', 'expect.js', 'test.js', 'run.js', 'harness.mjs'] as const;
const HARNESS = 'node_modules/retrainer/harness.mjs';

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.js',
      contents: "import { version } from 'node:process';\nconsole.log(`ok ${version}`);\n",
    },
  ],
  entryPoint: 'main.js',
};

export const nodeSpec: ToolchainSpec = {
  metadata: {
    id: 'node',
    displayName: 'Node',
    editorLanguage: 'javascript',
    fileExtension: '.js',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  tools: [
    {
      // Node is executing this code, so `process.execPath` is a working Node
      // by construction. Looking on PATH would be asking a question we already
      // know the answer to — and would find a *different* Node, which is worse.
      candidates: [process.execPath],
      versionArgs: ['--version'],
      label: 'Node',
      install: 'Install Node 22 or later from https://nodejs.org.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    return Promise.all(
      SUPPORT_FILES.map(async (name) => ({
        path: `node_modules/retrainer/${name}`,
        contents: await fs.readFile(path.join(supportDir, name), 'utf8'),
      })),
    );
  },

  run(context: RunContext): Command {
    return { command: process.execPath, args: [context.entryPoint, ...context.args] };
  },

  test(context: TestContext): Command {
    return {
      command: process.execPath,
      args: [HARNESS, '--report', context.reportFile, ...context.testFiles],
    };
  },
};

export function createNodeRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(nodeSpec, options);
}
