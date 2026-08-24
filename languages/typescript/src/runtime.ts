// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-wizard/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-wizard/toolchain';
import { ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * TypeScript, on the Node the platform is already running under.
 *
 * No compiler, no bundler, no build step. Node has stripped types natively
 * since 22.6 and does it without a flag from 23.6, so a `.ts` file is executed
 * the way a `.js` file is. That removes the entire class of setup problem that
 * usually stands between someone and their first TypeScript exercise — no
 * `tsconfig.json` to get wrong, nothing to install, nothing to keep in step
 * with a bundler.
 *
 * It also draws an honest line. Stripping types means the *types are not
 * checked at runtime*, which is exactly true of TypeScript in production and
 * is worth a learner internalising. Checking is a separate job, done by `tsc`
 * in `linter`, and its diagnostics arrive in the editor gutter where type
 * errors belong — not as a mysterious failure to run.
 *
 * The test harness is the JavaScript one, unchanged. A `.ts` test file imports
 * `retrainer/test.js` and Node resolves it like any other module, so there is
 * one harness to maintain and the report is identical by construction.
 */
const here = path.dirname(fileURLToPath(import.meta.url));

/** The JavaScript package's harness, reused verbatim. */
export const supportDir = path.resolve(here, '..', '..', 'javascript', 'runtime', 'retrainer');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const SUPPORT_FILES = ['package.json', 'expect.js', 'test.js', 'run.js', 'harness.mjs'] as const;

/** Where the harness lands inside the sandbox, so it shares one module registry. */
const HARNESS = 'node_modules/retrainer/harness.mjs';

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.ts',
      contents: 'const greet = (name: string): string => `ok ${name}`;\nconsole.log(greet("x"));\n',
    },
  ],
  entryPoint: 'main.ts',
};

export const typescriptSpec: ToolchainSpec = {
  metadata: {
    id: 'typescript',
    displayName: 'TypeScript',
    editorLanguage: 'typescript',
    fileExtension: '.ts',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  tools: [
    {
      // Node is running this code, so this lookup always succeeds. It is here
      // rather than assumed because the version matters: type stripping needs
      // 22.6 or later, and a learner on Node 20 should be told that in one
      // sentence rather than shown a syntax error in their own file.
      candidates: [process.execPath],
      versionArgs: ['--version'],
      label: 'Node 22.6 or later',
      install:
        'Install Node 22.6 or later from https://nodejs.org — earlier versions cannot run TypeScript directly.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const files = await Promise.all(
      SUPPORT_FILES.map(async (name) => ({
        path: `node_modules/retrainer/${name}`,
        contents: await fs.readFile(path.join(supportDir, name), 'utf8'),
      })),
    );
    return files;
  },

  run(context: RunContext): Command {
    return {
      command: process.execPath,
      args: [...typeStrippingFlags(), context.entryPoint, ...context.args],
    };
  },

  test(context: TestContext): Command {
    return {
      command: process.execPath,
      args: [
        ...typeStrippingFlags(),
        HARNESS,
        '--report',
        context.reportFile,
        ...context.testFiles,
      ],
    };
  },

  linter(context: RunContext): Command | null {
    const sources = context.files.filter((file) => file.endsWith('.ts') && !isVendored(file));
    if (sources.length === 0) return null;

    // The whole point of TypeScript, run as a separate step. `--noEmit`
    // because nothing here wants the output — only the diagnostics.
    return {
      command: 'tsc',
      args: [
        '--noEmit',
        '--strict',
        '--target',
        'es2023',
        '--module',
        'preserve',
        '--moduleResolution',
        'bundler',
        '--pretty',
        'false',
        ...sources,
      ],
    };
  },
};

/**
 * The flag Node needs to strip types, on the versions that need it.
 *
 * Stable and on by default from 23.6. Before that it exists behind a flag, and
 * passing an unknown flag is a hard error, so the version is checked rather
 * than the flag being passed unconditionally.
 */
function typeStrippingFlags(): readonly string[] {
  const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  const minor = Number.parseInt(process.versions.node.split('.')[1] ?? '0', 10);
  if (major > 23 || (major === 23 && minor >= 6)) return [];
  return ['--experimental-strip-types', '--no-warnings'];
}

function isVendored(file: string): boolean {
  return file.startsWith('node_modules/');
}

export function createTypeScriptRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(typescriptSpec, options);
}
