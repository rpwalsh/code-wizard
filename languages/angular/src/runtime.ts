// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-retrainer/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-retrainer/toolchain';
import { ToolchainRuntime } from '@code-retrainer/toolchain';

/**
 * Angular, tested the way Angular is actually testable without a browser.
 *
 * The honest scope, stated plainly: this runs Angular *logic* — components as
 * classes, services, pipes, guards, resolvers, interceptors and RxJS streams —
 * on Node, with no DOM and no TestBed. It does not render templates, and no
 * exercise here pretends to.
 *
 * That is a smaller claim than "Angular runs" and it is the one worth making.
 * TestBed needs zone.js, a compiled template, a DOM implementation and the
 * Angular compiler in the loop, which is a browser-shaped dependency and a
 * multi-second start per test. Meanwhile the great majority of Angular bugs
 * people actually hit — a subscription that outlives its component, an OnPush
 * component fed a mutated object, a switchMap that should have been a
 * mergeMap, a provider at the wrong scope — are in the class, not the
 * template, and every one of them is reachable from here in milliseconds.
 *
 * A component under test is instantiated directly, its inputs are set as
 * properties, and its lifecycle hooks are called by hand. That is not a
 * workaround; it is what TestBed does underneath, minus the framework.
 */
const here = path.dirname(fileURLToPath(import.meta.url));

/** The JavaScript package's harness, reused verbatim. */
export const supportDir = path.resolve(here, '..', '..', 'javascript', 'runtime', 'retrainer');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const SUPPORT_FILES = ['package.json', 'expect.js', 'test.js', 'run.js', 'harness.mjs'] as const;
const HARNESS = 'node_modules/retrainer/harness.mjs';

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.ts',
      contents:
        'class Counter { count = 0; increment(): void { this.count += 1; } }\n' +
        'const c = new Counter();\nc.increment();\nconsole.log(`ok ${c.count}`);\n',
    },
  ],
  entryPoint: 'main.ts',
};

export const angularSpec: ToolchainSpec = {
  metadata: {
    id: 'angular',
    displayName: 'Angular',
    editorLanguage: 'typescript',
    fileExtension: '.ts',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  tools: [
    {
      candidates: [process.execPath],
      versionArgs: ['--version'],
      label: 'Node 22.6 or later',
      install: 'Install Node 22.6 or later from https://nodejs.org.',
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
};

function typeStrippingFlags(): readonly string[] {
  const [major = '0', minor = '0'] = process.versions.node.split('.');
  const majorNumber = Number.parseInt(major, 10);
  const minorNumber = Number.parseInt(minor, 10);
  if (majorNumber > 23 || (majorNumber === 23 && minorNumber >= 6)) return [];
  return ['--experimental-strip-types', '--no-warnings'];
}

export function createAngularRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(angularSpec, options);
}
