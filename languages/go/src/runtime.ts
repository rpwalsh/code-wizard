// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TestStatus, WorkspaceFile } from '@code-wizard/core';
import type { Command, RunContext, TestContext, ToolchainSpec } from '@code-wizard/toolchain';
import { goPortable, reportWriter, ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * Go, on the Go toolchain.
 *
 * The one language here with no harness of its own, and deliberately so. Go
 * ships a test runner in the standard library, every Go programmer already
 * knows `func TestX(t *testing.T)`, and `go test -json` emits a structured
 * stream designed to be read by a machine. Writing a bespoke harness would
 * mean teaching a learner a testing style they will never use again, in the
 * one language where the standard answer is genuinely good.
 *
 * So the exercises are ordinary Go tests, and this converts `go test -json`
 * into the platform's report. The conversion is the whole language plugin.
 *
 * `GOFLAGS=-mod=mod` and a generated `go.mod` with no requirements keep every
 * build offline: a module with no dependencies never contacts a proxy, so the
 * first run works on a train.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.go',
      contents: 'package main\n\nimport "fmt"\n\nfunc main() { fmt.Println("ok") }\n',
    },
  ],
  entryPoint: 'main.go',
};

export const goSpec: ToolchainSpec = {
  metadata: {
    id: 'go',
    displayName: 'Go',
    editorLanguage: 'go',
    fileExtension: '.go',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'go',
    label: 'The Go toolchain',
    packages: {
      winget: 'GoLang.Go',
      choco: 'golang',
      scoop: 'go',
      brew: 'go',
      apt: 'golang-go',
      dnf: 'golang',
      pacman: 'go',
    },
    manual: 'Download it from https://go.dev/dl/.',
    needsNewShell: true,
    // No admin rights needed: a published archive, checksum-verified,
    // unpacked into the learner's own home directory.
    portable: goPortable,
  },

  tools: [
    {
      candidates: ['go'],
      // The official installer's default on each platform, plus the location
      // a per-user install uses.
      searchPaths: [
        // Where this product's own portable installer unpacks a toolchain.
        '~/toolchains/go/bin',
        'C:/Program Files/Go/bin',
        'C:/Go/bin',
        '~/go/bin',
        '~/sdk/go/bin',
        '/usr/local/go/bin',
        '/opt/go/bin',
        '/opt/homebrew/bin',
        '/usr/lib/go/bin',
      ],
      versionArgs: ['version'],
      label: 'The Go toolchain',
      install: 'Install Go 1.21 or later from https://go.dev/dl/.',
    },
  ],

  support(): Promise<readonly WorkspaceFile[]> {
    // A module with no requirements. `GOFLAGS=-mod=mod` plus an empty
    // requirement list means nothing is ever fetched, so a build works with no
    // network and no module proxy configured.
    return Promise.resolve([{ path: 'go.mod', contents: 'module exercise\n\ngo 1.21\n' }]);
  },

  run(context: RunContext): Command {
    const go = context.tools[0]?.command ?? 'go';
    return { command: go, args: ['run', '.', ...context.args], env: goEnvironment() };
  },

  test(context: TestContext): Command {
    const go = context.tools[0]?.command ?? 'go';
    // `./...` rather than a file list: Go tests belong to a package, and
    // naming files individually breaks the moment an exercise has two.
    return { command: go, args: ['test', '-json', '-count=1', './...'], env: goEnvironment() };
  },

  formatter(context: RunContext): Command | null {
    const go = context.tools[0]?.command ?? 'go';
    return { command: go, args: ['fmt', './...'], env: goEnvironment() };
  },

  linter(context: RunContext): Command | null {
    const go = context.tools[0]?.command ?? 'go';
    // `go vet` is the standard static check and needs nothing installed.
    return { command: go, args: ['vet', './...'], env: goEnvironment() };
  },

  isTestFile(file: string): boolean {
    // Go's own rule. A test must be in the same package as the code it tests,
    // so `tests/x_test.go` is a different package and cannot see it.
    return file.endsWith('_test.go');
  },

  reportFrom(stdout: string, stderr: string, context: TestContext): string | null {
    return convert(stdout, stderr, context);
  },
};

function goEnvironment(): Record<string, string> {
  return {
    // No proxy, no sumdb, no network. The module has no requirements, so
    // there is nothing legitimate to fetch and a hang here would present as a
    // mysterious timeout.
    GOFLAGS: '-mod=mod',
    GOPROXY: 'off',
    GONOSUMDB: '*',
    GOSUMDB: 'off',
    CGO_ENABLED: '0',
  };
}

/**
 * `go test -json` into the platform's report.
 *
 * The stream is one JSON object per line, with `Action` describing what
 * happened: `run`, `output`, `pass`, `fail`, `skip`. Output lines arrive
 * before the verdict, so the text is accumulated per test and attached when
 * the verdict lands.
 *
 * A line that is not JSON is not an error. `go test` prints build failures as
 * plain text on stderr before the stream starts, and those become a collection
 * error — which is the correct answer, because a package that does not compile
 * has not been tested.
 */
function convert(stdout: string, stderr: string, context: TestContext): string | null {
  /*
   * Which file each test came from.
   *
   * `go test -json` reports the package and the test name and never the file,
   * but the platform keys a test file's visibility on its path — so an
   * unmapped case would be treated as visible and a hidden test would show its
   * output. The test sources are right here, and `func TestName(` appears in
   * exactly one of them.
   */
  const owner = new Map<string, string>();
  for (const file of context.testFiles) {
    const source = context.sources?.get(file) ?? '';
    for (const match of source.matchAll(/^func\s+(Test\w+)\s*\(/gmu)) {
      const name = match[1];
      if (name !== undefined) owner.set(name, file);
    }
  }

  interface Event {
    readonly Action?: string;
    readonly Test?: string;
    readonly Package?: string;
    readonly Output?: string;
    readonly Elapsed?: number;
  }

  const output = new Map<string, string[]>();
  const cases: {
    id: string;
    file: string;
    name: string;
    status: TestStatus;
    durationMs: number;
    message?: string;
  }[] = [];
  const collectionErrors: { path: string; message: string }[] = [];

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;

    let event: Event;
    try {
      event = JSON.parse(trimmed) as Event;
    } catch {
      continue;
    }

    // Package-level events carry no test name and are summaries, not cases.
    if (event.Test === undefined) continue;
    const key = `${event.Package ?? ''}::${event.Test}`;

    if (event.Action === 'output' && event.Output !== undefined) {
      const lines = output.get(key) ?? [];
      lines.push(event.Output);
      output.set(key, lines);
      continue;
    }

    const status = statusOf(event.Action);
    if (status === null) continue;

    const detail = (output.get(key) ?? []).join('').trim();
    const file = owner.get(event.Test) ?? context.testFiles[0] ?? 'exercise';
    cases.push({
      id: `${file}::${event.Test}`,
      file,
      name: humanize(event.Test),
      status,
      durationMs: Math.round((event.Elapsed ?? 0) * 1000),
      ...(status === 'passed' ? {} : { message: firstFailure(detail) }),
    });
  }

  const buildFailure = stderr.trim();
  if (cases.length === 0 && buildFailure) {
    collectionErrors.push({ path: 'exercise', message: buildFailure });
  }
  if (cases.length === 0 && collectionErrors.length === 0) return null;

  return reportWriter(cases, collectionErrors);
}

function statusOf(action: string | undefined): TestStatus | null {
  switch (action) {
    case 'pass':
      return 'passed';
    case 'fail':
      return 'failed';
    case 'skip':
      return 'skipped';
    default:
      return null;
  }
}

/**
 * `TestReturnsTheSum` reads as "returns the sum".
 *
 * Go's naming convention is fixed and the platform shows these to a learner
 * next to prose, where `TestReturnsTheSum` looks like a symbol rather than a
 * description of what failed.
 */
function humanize(name: string): string {
  const withoutPrefix = name.replace(/^Test/u, '');
  const spaced = withoutPrefix
    .replace(/_/gu, ' ')
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .trim()
    .toLowerCase();
  return spaced.length > 0 ? spaced : name;
}

/**
 * The first real line of a Go test failure.
 *
 * `go test` output includes the `=== RUN` and `--- FAIL` framing, which is
 * noise once the status is already known. What matters is the line the test
 * itself printed.
 */
function firstFailure(detail: string): string {
  const meaningful = detail
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('=== ') && !line.startsWith('--- '));
  return meaningful.join('\n').slice(0, 2000);
}

export function createGoRuntime(options: { readonly sandboxRoot?: string } = {}): ToolchainRuntime {
  return new ToolchainRuntime(goSpec, options);
}
