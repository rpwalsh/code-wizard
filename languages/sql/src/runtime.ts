// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-retrainer/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-retrainer/toolchain';
import { ToolchainRuntime } from '@code-retrainer/toolchain';

/**
 * SQL, on the SQLite that ships inside Python.
 *
 * The platform already requires Python, and Python has bundled a complete SQL
 * engine since 2006. Asking a learner to install and configure a database
 * server before they can write their first `SELECT` would add the largest
 * dependency in the product to buy something already on the machine.
 *
 * The cost is a real one and is named rather than hidden: SQLite's type
 * affinity is looser than Postgres's, its `RIGHT JOIN` is recent, and it has
 * no `FULL OUTER JOIN` before 3.39. So the curriculum stays inside the
 * portable subset, and the handful of lessons where the dialect genuinely
 * differs say which engines differ and how. A learner who finishes this course
 * can write standard SQL; they have not been taught SQLite trivia.
 *
 * Running SQL "as a program" means something slightly different from every
 * other language here. `execute` runs `main.sql` against the schema and prints
 * the rows, which is what a learner wants when they press Run — see the result
 * of the query they are writing. Tests compare result sets. Both are the same
 * operation underneath.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const HARNESS = '.retrainer-harness.py';
const RUNNER = '.retrainer-run.py';

const SMOKE_WORKSPACE = {
  files: [
    { path: 'schema.sql', contents: 'CREATE TABLE t (n INTEGER);\nINSERT INTO t VALUES (1);\n' },
    { path: 'main.sql', contents: 'SELECT n FROM t;\n' },
  ],
  entryPoint: 'main.sql',
};

export const sqlSpec: ToolchainSpec = {
  metadata: {
    id: 'sql',
    displayName: 'SQL',
    editorLanguage: 'sql',
    fileExtension: '.sql',
    commentPrefix: '--',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  tools: [
    {
      candidates: ['python3', 'python', 'py'],
      versionArgs: ['--version'],
      label: 'Python 3.9 or later',
      install:
        'Install Python 3 from https://python.org. The SQL engine is the sqlite3 module in ' +
        'its standard library, so nothing else is needed.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const [harness, runner] = await Promise.all([
      fs.readFile(path.join(supportDir, 'harness.py'), 'utf8'),
      fs.readFile(path.join(supportDir, 'run.py'), 'utf8'),
    ]);
    return [
      { path: HARNESS, contents: harness },
      { path: RUNNER, contents: runner },
    ];
  },

  run(context: RunContext): Command {
    const python = context.tools[0]?.command ?? 'python';
    const query = context.entryPoint.endsWith('.sql') ? context.entryPoint : 'main.sql';
    return { command: python, args: [RUNNER, query] };
  },

  test(context: TestContext): Command {
    const python = context.tools[0]?.command ?? 'python';
    return {
      command: python,
      args: [HARNESS, '--report', context.reportFile, ...context.testFiles],
    };
  },
};

export function createSqlRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(sqlSpec, options);
}
