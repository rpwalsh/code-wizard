// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-wizard/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-wizard/toolchain';
import { phpPortable, ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * PHP, on the PHP CLI.
 *
 * No Composer and no PHPUnit. Both are the right answer for a real project and
 * the wrong one for a thirty-second exercise: they mean a vendor directory, an
 * autoloader and a network connection, none of which teaches anybody PHP. The
 * harness is one file (`runtime/harness.php`) and the exercises are ordinary
 * scripts.
 *
 * Every process runs with `error_reporting=E_ALL` and warnings promoted, and
 * the exercises declare `strict_types=1`. That is the same teaching decision
 * made for every language here: modern PHP with coercion left on and notices
 * suppressed is the previous language, and it is the one people remember badly.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const HARNESS = '.retrainer-harness.php';

const SMOKE_WORKSPACE = {
  files: [{ path: 'main.php', contents: '<?php\ndeclare(strict_types=1);\necho "ok\\n";\n' }],
  entryPoint: 'main.php',
};

/** Nothing suppressed, nothing coerced silently, no time limit of PHP's own. */
const STRICT: readonly string[] = [
  '-d',
  'error_reporting=E_ALL',
  '-d',
  'display_errors=stderr',
  '-d',
  'log_errors=0',
  '-d',
  'max_execution_time=0',
  '-d',
  'memory_limit=256M',
  // `assert.active` is deliberately absent: it was deprecated in 8.3, and
  // setting it prints a startup warning before every single run.
];

/**
 * The extensions the curriculum needs, named on the command line.
 *
 * A Windows PHP ships every extension as a DLL and enables none of them,
 * because it ships no `php.ini` at all — so `new PDO('sqlite::memory:')` fails
 * with "could not find driver" on a machine where the driver is sitting in
 * `ext/` beside the interpreter. Naming them per-invocation fixes that without
 * writing an ini file into somebody's PHP install.
 */
function extensions(php: string): readonly string[] {
  if (process.platform !== 'win32') return [];

  const directory = path.join(path.dirname(php), 'ext');
  if (!existsSync(directory)) return [];

  return [
    '-d',
    `extension_dir=${directory}`,
    '-d',
    'extension=pdo_sqlite',
    '-d',
    'extension=sqlite3',
  ];
}

export const phpSpec: ToolchainSpec = {
  metadata: {
    id: 'php',
    displayName: 'PHP',
    editorLanguage: 'php',
    fileExtension: '.php',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'php',
    label: 'The PHP CLI',
    packages: {
      winget: 'PHP.PHP.8.3',
      choco: 'php',
      scoop: 'php',
      brew: 'php',
      apt: 'php-cli',
      dnf: 'php-cli',
      pacman: 'php',
    },
    manual:
      'Download it from https://windows.php.net/download or install php-cli from your package manager.',
    needsNewShell: true,
    // No admin rights needed: a published archive, checksum-verified,
    // unpacked into the learner's own home directory.
    portable: phpPortable,
  },

  tools: [
    {
      candidates: ['php'],
      // Windows has no convention at all for PHP, so the common unpack
      // locations are checked; the Unix ones are for a Homebrew or MacPorts
      // install where the shell has not been restarted.
      searchPaths: [
        // Where this product's own portable installer unpacks a toolchain.
        '~/toolchains/php',
        'C:/php',
        'C:/tools/php',
        'C:/xampp/php',
        'C:/laragon/bin/php',
        '~/scoop/apps/php/current',
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/local/opt/php/bin',
      ],
      versionArgs: ['--version'],
      label: 'The PHP CLI',
      install:
        'Install PHP 8.1 or later: on macOS `brew install php`, on Debian/Ubuntu ' +
        '`apt install php-cli`, on Windows download it from https://windows.php.net/download.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const harness = await fs.readFile(path.join(supportDir, 'harness.php'), 'utf8');
    return [{ path: HARNESS, contents: harness }];
  },

  run(context: RunContext): Command {
    const php = context.tools[0]?.command ?? 'php';
    return {
      command: php,
      args: [...STRICT, ...extensions(php), context.entryPoint, ...context.args],
    };
  },

  test(context: TestContext): Command {
    const php = context.tools[0]?.command ?? 'php';
    return {
      command: php,
      args: [
        ...STRICT,
        ...extensions(php),
        HARNESS,
        '--report',
        context.reportFile,
        ...context.testFiles,
      ],
    };
  },

  linter(context: RunContext): Command | null {
    const php = context.tools[0]?.command ?? 'php';
    const sources = context.files.filter((file) => file.endsWith('.php') && !file.startsWith('.'));
    if (sources.length === 0) return null;
    // `-l` is a syntax check and nothing more, which is exactly what the
    // gutter wants: where the parse broke.
    return { command: php, args: ['-l', ...sources] };
  },
};

export function createPhpRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(phpSpec, options);
}
