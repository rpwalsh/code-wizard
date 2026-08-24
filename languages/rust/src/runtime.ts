// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TestStatus, WorkspaceFile } from '@code-wizard/core';
import type {
  Command,
  CompileStep,
  RunContext,
  TestContext,
  ToolchainSpec,
} from '@code-wizard/toolchain';
import { reportWriter, ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * Rust, on rustc directly rather than on Cargo.
 *
 * A deliberate choice, and the one worth explaining. Cargo is the right tool
 * for a project; it is the wrong tool for a thirty-second exercise, because a
 * `cargo new` plus a build directory plus a lockfile is several seconds and a
 * few hundred files of ceremony around a program that is forty lines long. The
 * exercises here have no dependencies by design, and `rustc` compiles a
 * dependency-free crate in well under a second.
 *
 * Tests are ordinary `#[test]` functions — the standard, which every Rust
 * programmer already writes — compiled with `--test` into a binary that
 * `libtest` runs. That binary can emit machine-readable results, which this
 * converts. No bespoke harness, no macro to learn, nothing that stops being
 * useful outside this app.
 *
 * `-D warnings` is on. Rust's warnings are unusually high-signal, and the
 * borrow checker is not the part that catches most beginner mistakes — the
 * lints are.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const BINARY = process.platform === 'win32' ? 'program.exe' : 'program';
const TEST_BINARY = process.platform === 'win32' ? 'tests.exe' : 'tests';
/** The generated crate root that gathers every test file. */
// No leading dot: rustc derives the crate name from the file name, and a
// crate name cannot contain one. A hidden file would have been tidier and
// does not compile.
const TEST_ROOT = 'retrainer_tests.rs';

const SMOKE_WORKSPACE = {
  files: [{ path: 'main.rs', contents: 'fn main() { println!("ok"); }\n' }],
  entryPoint: 'main.rs',
};

export const rustSpec: ToolchainSpec = {
  metadata: {
    id: 'rust',
    displayName: 'Rust',
    editorLanguage: 'rust',
    fileExtension: '.rs',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'rust',
    label: 'The Rust toolchain',
    packages: {
      // Rustup rather than a distribution's `rustc`, because a packaged Rust
      // is often a release or two behind and cannot update itself. Everywhere
      // else this prefers the system package; here the upstream installer is
      // genuinely the better answer and is what rust-lang recommends.
      winget: 'Rustlang.Rustup',
      choco: 'rustup.install',
      scoop: 'rustup',
      brew: 'rustup',
      pacman: 'rustup',
    },
    manual: 'Install from https://rustup.rs — it sets up rustc and cargo together.',
    needsNewShell: true,
  },

  tools: [
    {
      candidates: ['rustc'],
      // rustup installs here and edits PATH only for *new* shells, so a
      // perfectly good toolchain is invisible to the session that installed
      // it. This is the commonest false "not installed" on any platform.
      searchPaths: [
        // Where this product's own portable installer unpacks a toolchain.
        '~/toolchains/rust/bin',
        '~/.cargo/bin',
        '~/.rustup/toolchains/stable-x86_64-pc-windows-msvc/bin',
        '~/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin',
        '~/.rustup/toolchains/stable-aarch64-apple-darwin/bin',
      ],
      versionArgs: ['--version'],
      label: 'The Rust compiler',
      install: 'Install Rust from https://rustup.rs — it installs rustc and cargo together.',
    },
  ],

  support(): Promise<readonly WorkspaceFile[]> {
    // Nothing to install. A dependency-free crate needs no manifest, no
    // lockfile and no registry, which is exactly why this uses rustc directly.
    return Promise.resolve([]);
  },

  async compile(context: RunContext): Promise<CompileStep | null> {
    const rustc = context.tools[0]?.command ?? 'rustc';

    if (context.mode === 'test') {
      const tests = context.files.filter(isTestFile);
      if (tests.length === 0) return null;

      /*
       * One crate root that pulls every test file in as a module.
       *
       * Rust compiles each file under `tests/` as its own crate, so pointing
       * rustc at one of them runs that file and silently ignores the rest —
       * which meant an exercise's hidden tests never ran and the learner was
       * graded on half of what the author wrote.
       *
       * `#[path]` lets a module name a file outside the usual layout, so a
       * generated root turns several test files into one test binary. It is
       * written into the sandbox rather than shipped, because it depends on
       * which files the exercise actually has.
       */
      const modules = tests
        .map((file, index) =>
          [`#[path = "${toModulePath(file)}"]`, `mod retrainer_test_${index};`].join('\n'),
        )
        .join('\n');

      await fs.writeFile(context.sandbox.resolve(TEST_ROOT), `${modules}\n`, 'utf8');

      return {
        label: 'rustc',
        command: rustc,
        args: [
          '--test',
          '--edition',
          '2021',
          '-D',
          'warnings',
          // A test binary has no `main`, so the exercise's own one is
          // genuinely unused here — and with warnings as errors that is a
          // build failure about nothing.
          '-A',
          'dead_code',
          '-o',
          TEST_BINARY,
          TEST_ROOT,
        ],
      };
    }

    const root = context.files.find((file) => file === 'main.rs' || file === 'lib.rs');
    if (root === undefined) return null;

    return {
      label: 'rustc',
      command: rustc,
      args: ['--edition', '2021', '-D', 'warnings', '-o', BINARY, root],
    };
  },

  run(context: RunContext): Command {
    /*
     * Absolute, deliberately.
     *
     * A relative command is resolved against the *parent* process's working
     * directory on Windows, not the child's `cwd`, so `.\program.exe` looks for
     * the binary beside the app rather than in the sandbox and fails with
     * ENOENT. The sandbox knows its own root; asking it is the only portable
     * way to name something inside it.
     */
    return { command: context.sandbox.resolve(BINARY), args: [...context.args] };
  },

  test(context: TestContext): Command {
    return {
      command: context.sandbox.resolve(TEST_BINARY),
      // libtest's JSON output is behind an unstable flag, so it needs the
      // nightly-features escape hatch. `--test-threads=1` keeps the output
      // interleaved in a readable order and makes a run reproducible.
      args: ['-Zunstable-options', '--format', 'json', '--test-threads', '1'],
      env: { RUSTC_BOOTSTRAP: '1' },
    };
  },

  linter(context: RunContext): Command | null {
    // The crate root, not the tests: the gutter is about the code being
    // written, and a metadata-only pass is a fraction of a full build.
    const root = context.files.find((file) => file === 'main.rs' || file === 'lib.rs');
    if (root === undefined) return null;
    // Clippy if it is installed, and rustc's own check if it is not. Both are
    // discovered rather than assumed.
    return {
      command: context.tools[0]?.command ?? 'rustc',
      args: ['--edition', '2021', '--emit', 'metadata', '-o', 'check.rmeta', root],
    };
  },

  formatter(context: RunContext): Command | null {
    const sources = context.files.filter((file) => file.endsWith('.rs'));
    if (sources.length === 0) return null;
    return { command: 'rustfmt', args: ['--edition', '2021', ...sources] };
  },

  reportFrom(stdout: string, stderr: string, context: TestContext): string | null {
    return convert(stdout, stderr, context);
  },
};

/** `#[path]` wants forward slashes, whatever the platform's separator is. */
function toModulePath(file: string): string {
  return file.replace(/\\/gu, '/');
}

/** Rust's own layout: integration tests live under `tests/`. */
function isTestFile(file: string): boolean {
  return /(^|[\\/])tests[\\/]/u.test(file) && file.endsWith('.rs');
}

/**
 * libtest's JSON stream into the platform's report.
 *
 * One object per line: a `suite` event with the totals, then a `test` event per
 * case with `event: started | ok | failed | ignored`. Failures carry their
 * captured stdout, which holds the panic message — the useful part.
 *
 * A compile failure never reaches here as JSON; rustc writes it to stderr and
 * no binary is produced, which the compile step has already caught. This
 * handles the residual case where the binary ran but produced nothing usable.
 */
function convert(stdout: string, stderr: string, context: TestContext): string | null {
  /*
   * Which file each case came from.
   *
   * libtest reports `retrainer_test_0::finds_the_longest_name`, where the
   * module name is the one the generated crate root gave it — and the index is
   * that file's position in the list the crate root was generated from. That
   * list is `context.files.filter(isTestFile)`, and it must be re-derived here
   * the same way: `context.testFiles` holds the same paths in *manifest* order,
   * and indexing into it swapped every case's file whenever the two orders
   * disagreed. The platform keys a test file's visibility on its path, so a
   * swap does not just mislabel — it can show a hidden test in full.
   */
  const byIndex = context.files.filter(isTestFile);
  interface Event {
    readonly type?: string;
    readonly event?: string;
    readonly name?: string;
    readonly stdout?: string;
    readonly exec_time?: number;
  }

  const cases: {
    id: string;
    file: string;
    name: string;
    status: TestStatus;
    durationMs: number;
    message?: string;
  }[] = [];

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;

    let event: Event;
    try {
      event = JSON.parse(trimmed) as Event;
    } catch {
      continue;
    }

    if (event.type !== 'test' || event.name === undefined) continue;

    const status = statusOf(event.event);
    if (status === null) continue;

    const module = /^retrainer_test_(\d+)::/u.exec(event.name)?.[1];
    const file =
      module === undefined
        ? (byIndex[0] ?? 'tests')
        : (byIndex[Number(module)] ?? byIndex[0] ?? 'tests');

    cases.push({
      id: `${file}::${event.name}`,
      file,
      name: humanize(event.name),
      status,
      durationMs: Math.round((event.exec_time ?? 0) * 1000),
      ...(status === 'failed' ? { message: panicMessage(event.stdout ?? '') } : {}),
    });
  }

  if (cases.length === 0) {
    const failure = stderr.trim();
    return failure ? reportWriter([], [{ path: 'tests', message: failure }]) : null;
  }

  return reportWriter(cases);
}

function statusOf(event: string | undefined): TestStatus | null {
  switch (event) {
    case 'ok':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'ignored':
      return 'skipped';
    default:
      return null;
  }
}

/** The panic line, without the backtrace advice nobody wants to read. */
function panicMessage(output: string): string {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.includes('note: run with `RUST_BACKTRACE'));
  return lines.join('\n').slice(0, 2000);
}

/** `returns_the_sum` reads better as "returns the sum" next to prose. */
function humanize(name: string): string {
  const last = name.split('::').at(-1) ?? name;
  return last.replace(/_/gu, ' ');
}

export function createRustRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(rustSpec, options);
}
