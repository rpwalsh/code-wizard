// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { runProcess } from '@code-retrainer/execution';

import { inheritedPath } from './discovery.ts';

/**
 * Finding the Microsoft toolchain's headers and libraries.
 *
 * On Windows, "is there a C compiler" and "can it build anything" are two
 * questions with different answers, and this is the gap between them. Both
 * clang and MSVC's own `cl.exe` compile against the Windows SDK, and neither
 * finds it on its own: the SDK's location is not on PATH, is not in the
 * registry in any convenient form, and is conventionally supplied by running
 * `vcvarsall.bat`, which exists to set two environment variables.
 *
 * The symptom when it is missing is exact and baffling:
 *
 *     main.c:1:10: fatal error: 'stdio.h' file not found
 *     lld-link: error: could not open 'libcmt.lib'
 *
 * — from a machine where a perfectly good compiler and a perfectly good SDK
 * are both installed. This is the single most common reason a Windows
 * developer concludes that C "doesn't work here".
 *
 * Rather than shell out to `vcvarsall.bat` and parse the environment it
 * prints — which needs a batch interpreter, produces a hundred variables, and
 * differs per Visual Studio version — this locates the two directory trees
 * directly and builds `INCLUDE` and `LIB` from them. `vswhere.exe` ships with
 * every Visual Studio installer since 2017 and is the supported way to ask
 * where Visual Studio is.
 */
export interface MsvcEnvironment {
  readonly INCLUDE: string;
  readonly LIB: string;
}

/** Cached: locating this means several filesystem walks and a subprocess. */
let cached: Promise<MsvcEnvironment | null> | null = null;

export function findMsvcEnvironment(): Promise<MsvcEnvironment | null> {
  if (process.platform !== 'win32') return Promise.resolve(null);
  cached ??= locate();
  return cached;
}

/** Forget the cached answer. For tests, and for a re-check after an install. */
export function forgetMsvc(): void {
  cached = null;
}

async function locate(): Promise<MsvcEnvironment | null> {
  const visualStudio = await findVisualStudio();
  const sdk = findWindowsSdk();
  if (!visualStudio && !sdk) return null;

  const includes: string[] = [];
  const libraries: string[] = [];

  if (visualStudio) {
    includes.push(path.join(visualStudio, 'include'));
    libraries.push(path.join(visualStudio, 'lib', architecture()));
  }

  if (sdk) {
    // `ucrt` is the C runtime, `um` the Win32 API, `shared` the headers both
    // use. All three are needed for anything that includes <stdio.h>.
    for (const part of ['ucrt', 'shared', 'um', 'winrt']) {
      const directory = path.join(sdk.include, part);
      if (existsSync(directory)) includes.push(directory);
    }
    for (const part of ['ucrt', 'um']) {
      const directory = path.join(sdk.lib, part, architecture());
      if (existsSync(directory)) libraries.push(directory);
    }
  }

  if (includes.length === 0 || libraries.length === 0) return null;

  return { INCLUDE: includes.join(';'), LIB: libraries.join(';') };
}

function architecture(): string {
  return process.arch === 'arm64' ? 'arm64' : process.arch === 'ia32' ? 'x86' : 'x64';
}

/**
 * The MSVC tools directory of the newest Visual Studio installed.
 *
 * `vswhere` first, because it is the supported answer and handles Build Tools,
 * Community, Professional and Enterprise identically. The hard-coded fallbacks
 * cover a machine where the installer has been removed but the toolchain has
 * not — rare, and cheap to allow for.
 */
async function findVisualStudio(): Promise<string | null> {
  const roots: string[] = [];

  const vswhere = path.join(
    process.env['ProgramFiles(x86)'] ?? 'C:/Program Files (x86)',
    'Microsoft Visual Studio',
    'Installer',
    'vswhere.exe',
  );

  if (existsSync(vswhere)) {
    const outcome = await runProcess({
      command: vswhere,
      args: ['-latest', '-products', '*', '-property', 'installationPath'],
      cwd: process.cwd(),
      env: inheritedPath(),
      timeoutMs: 20_000,
      maxOutputBytes: 32 * 1024,
    });
    const found = outcome.stdout.trim().split('\n')[0]?.trim();
    if (found) roots.push(found);
  }

  for (const base of [process.env['ProgramFiles'], process.env['ProgramFiles(x86)']]) {
    if (!base) continue;
    for (const year of ['2022', '2019']) {
      for (const edition of ['BuildTools', 'Community', 'Professional', 'Enterprise']) {
        roots.push(path.join(base, 'Microsoft Visual Studio', year, edition));
      }
    }
  }

  for (const root of roots) {
    const tools = path.join(root, 'VC', 'Tools', 'MSVC');
    const newest = newestChild(tools);
    if (newest) return newest;
  }
  return null;
}

/** The newest Windows SDK's include and lib trees. */
function findWindowsSdk(): { include: string; lib: string } | null {
  for (const base of [process.env['ProgramFiles(x86)'], process.env['ProgramFiles']]) {
    if (!base) continue;
    const kit = path.join(base, 'Windows Kits', '10');

    // The version directories under Include and Lib are the same set, but a
    // partial install can leave one behind — so the version is chosen from
    // whichever exists in both.
    const includeVersion = newestChild(path.join(kit, 'Include'));
    if (!includeVersion) continue;

    const version = path.basename(includeVersion);
    const lib = path.join(kit, 'Lib', version);
    if (existsSync(lib)) return { include: includeVersion, lib };
  }
  return null;
}

/**
 * The highest-versioned subdirectory, compared numerically.
 *
 * String order gets this wrong the moment a version reaches double digits:
 * `10.0.9` sorts after `10.0.26100` alphabetically, and picking the older SDK
 * produces link errors that look nothing like a version problem.
 */
function newestChild(directory: string): string | null {
  if (!existsSync(directory)) return null;

  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(compareVersions);

  const newest = entries.at(-1);
  return newest === undefined ? null : path.join(directory, newest);
}

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
