// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { existsSync } from 'node:fs';
import path from 'node:path';

import { runProcess } from '@code-retrainer/execution';

/**
 * Finding the compiler, and saying something useful when it is not there.
 *
 * The thing that separates a product from a demo is what happens on a machine
 * that is not the author's. A learner who opens the Rust course on a laptop
 * with no Rust installed should be told, in one sentence, exactly what to
 * install and where from — not shown a spawn error, and not silently offered a
 * course that cannot run.
 *
 * So every toolchain-backed language declares its tools here, and the result
 * of looking for them is a first-class value that flows into `doctor()` and
 * into every execution path. A missing toolchain is a *reported state*, never
 * an exception.
 */
export interface ToolSpec {
  /** Candidate executables, in order of preference: `['clang', 'gcc', 'cc']`. */
  readonly candidates: readonly string[];
  /**
   * Directories to look in beyond PATH.
   *
   * Searching PATH alone was the first version of this and it was wrong in a
   * way that made the product look worse than it was: rustup installs to
   * `~/.cargo/bin` and only edits PATH for *new* shells, so a machine with a
   * perfectly good Rust toolchain reported "Rust is not installed" and offered
   * to install it again. The same is true of a Go installed to `~/go`, a
   * Homebrew tool on a Mac where the shell has not been restarted, and every
   * toolchain installed in the same session.
   *
   * `~` is expanded. Directories that do not exist are skipped silently, which
   * is the normal case for most of them.
   */
  readonly searchPaths?: readonly string[];
  /** Arguments that make the tool print its version and exit 0. */
  readonly versionArgs: readonly string[];
  /** Human name, for messages: "a C compiler". */
  readonly label: string;
  /** Where to get it. Shown verbatim when it is missing. */
  readonly install: string;
}

export interface FoundTool {
  readonly command: string;
  readonly version: string;
}

export type ToolLookup = FoundTool | { readonly command: null; readonly reason: string };

export function isFound(lookup: ToolLookup): lookup is FoundTool {
  return lookup.command !== null;
}

/**
 * Look for one tool, cached for the life of the process.
 *
 * Cached because `doctor`, `execute` and `test` all need the answer and
 * spawning a compiler three times to ask its version is a visible pause on a
 * cold start. Keyed on the spec's candidate list, so two languages sharing a
 * compiler share the lookup.
 */
const cache = new Map<string, Promise<ToolLookup>>();

export function findTool(spec: ToolSpec): Promise<ToolLookup> {
  const key = spec.candidates.join('|') + spec.versionArgs.join('|');
  const existing = cache.get(key);
  if (existing) return existing;

  const lookup = probe(spec);
  cache.set(key, lookup);
  return lookup;
}

/** Forget every cached lookup. For tests, and for a "re-check" button. */
export function forgetTools(): void {
  cache.clear();
}

async function probe(spec: ToolSpec): Promise<ToolLookup> {
  for (const candidate of expand(spec)) {
    const outcome = await runProcess({
      command: candidate,
      args: [...spec.versionArgs],
      cwd: process.cwd(),
      env: inheritedPath(),
      // Generous: a cold antivirus scan of a compiler on Windows is slow, and
      // reporting "not installed" for something that is installed is the worst
      // possible answer here.
      timeoutMs: 20_000,
      maxOutputBytes: 64 * 1024,
    });

    if (!outcome.spawnError && outcome.exitCode === 0) {
      const version = `${outcome.stdout}\n${outcome.stderr}`.trim().split('\n')[0] ?? candidate;
      return { command: candidate, version };
    }
  }

  return {
    command: null,
    reason: `${spec.label} was not found. Tried: ${spec.candidates.join(', ')}. ${spec.install}`,
  };
}

/**
 * Every path worth trying, PATH first.
 *
 * PATH first because a tool the user has deliberately put there is the one
 * they mean. The well-known locations come after, and an absolute path that
 * does not exist is dropped rather than spawned — spawning it would work, but
 * it costs a process launch per miss and there can be a dozen.
 */
function expand(spec: ToolSpec): readonly string[] {
  const attempts: string[] = [...spec.candidates];

  for (const directory of spec.searchPaths ?? []) {
    const resolved = resolveHome(directory);
    if (!existsSync(resolved)) continue;

    for (const candidate of spec.candidates) {
      for (const extension of process.platform === 'win32' ? ['.exe', '.cmd', ''] : ['']) {
        const full = path.join(resolved, candidate + extension);
        if (existsSync(full)) attempts.push(full);
      }
    }
  }

  return attempts;
}

function resolveHome(directory: string): string {
  if (!directory.startsWith('~')) return directory;
  const home = process.env['USERPROFILE'] ?? process.env['HOME'] ?? '';
  return path.join(home, directory.slice(1));
}

/**
 * The environment a *discovery* probe runs in.
 *
 * Deliberately not the locked-down sandbox environment: finding a compiler
 * requires PATH, and on Windows also the variables the loader needs to resolve
 * a DLL. The sandbox used for learner code is a separate, much narrower thing;
 * conflating the two would either break discovery or widen the sandbox, and
 * the second would be a security bug.
 */
export function inheritedPath(): Record<string, string> {
  const keep = [
    'PATH',
    'Path',
    'PATHEXT',
    'SYSTEMROOT',
    'SystemRoot',
    'WINDIR',
    'windir',
    'COMSPEC',
    'TEMP',
    'TMP',
    'HOME',
    'USERPROFILE',
    'LANG',
    'LC_ALL',
    // Toolchain managers put their shims here and nowhere else.
    'CARGO_HOME',
    'RUSTUP_HOME',
    'GOROOT',
    'GOPATH',
    'GOCACHE',
    'DOTNET_ROOT',
    'JAVA_HOME',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'ProgramData',
    'LOCALAPPDATA',
    'APPDATA',
  ];

  const environment: Record<string, string> = {};
  for (const key of keep) {
    const value = process.env[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}
