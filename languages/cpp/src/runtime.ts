// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkspaceFile } from '@code-wizard/core';
import type {
  Command,
  CompileStep,
  RunContext,
  TestContext,
  ToolchainSpec,
} from '@code-wizard/toolchain';
import { findMsvcEnvironment, ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * C++, compiled with whatever the machine has.
 *
 * Built at C++20, because that is the version the curriculum is written
 * against: concepts, ranges and `std::span` are in the course, and teaching
 * modern C++ on a compiler pinned to an older standard would be teaching a
 * different language.
 *
 * Sanitizers are on wherever the platform supports them, for the same reason
 * as in C and one more: RAII means a lifetime bug in C++ usually surfaces as a
 * use-after-free inside a destructor, a long way from the line that caused it.
 * The sanitizer names the allocation and the free, which is the difference
 * between a lesson and an afternoon.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

/**
 * The program `doctor` builds to prove the toolchain actually works here.
 *
 * A compiler being on PATH and a compiler that can produce a running binary on
 * this machine are different claims — a missing standard library, a mismatched
 * SDK, or a sandbox on a volume mounted noexec all satisfy the first and fail
 * the second — and only the second one matters to a learner.
 */
const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'main.cpp',
      contents: '#include <iostream>\nint main() { std::cout << "ok\\n"; return 0; }\n',
    },
  ],
  entryPoint: 'main.cpp',
};

/**
 * Definitions the platform needs to be quiet about its own standard library.
 *
 * MSVC's headers mark `fopen`, `strcpy` and most of the C string functions
 * deprecated in favor of `_s` variants that exist nowhere else. Left on, a
 * learner's first C exercise opens with forty lines of warnings about the
 * harness, which is a good way to teach that warnings are noise.
 */
function platformDefines(): readonly string[] {
  return process.platform === 'win32' ? ['-D_CRT_SECURE_NO_WARNINGS'] : [];
}

/** Sanitizers, when the platform supports them. */
function sanitizerFlags(): readonly string[] {
  // Not on Windows: the ASan runtime there needs a DLL beside the executable
  // and a matching toolchain, and a learner meeting a loader error instead of
  // their own program has been taught nothing at all.
  return process.platform === 'win32' ? [] : ['-fsanitize=address,undefined'];
}

const BASE_FLAGS = ['-std=c++20', '-Wall', '-Wextra', '-g', '-O0'] as const;

export const cppSpec: ToolchainSpec = {
  metadata: {
    id: 'cpp',
    displayName: 'C++',
    editorLanguage: 'cpp',
    fileExtension: '.cpp',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'cpp',
    label: 'A C++ compiler',
    packages: {
      winget: 'Microsoft.VisualStudio.2022.BuildTools',
      choco: 'visualstudio2022buildtools',
      brew: 'llvm',
      apt: 'build-essential',
      dnf: 'gcc-c++',
      pacman: 'gcc',
    },
    manual:
      'On macOS run `xcode-select --install`; on Windows install the Visual Studio Build Tools ' +
      'with the "Desktop development with C++" workload.',
    needsNewShell: true,
  },

  tools: [
    {
      candidates: ['clang++', 'g++', 'c++'],
      searchPaths: [
        // Where this product's own portable installer unpacks a toolchain.
        '~/toolchains/llvm/bin',
        '~/toolchains/mingw64/bin',
        'C:/msys64/ucrt64/bin',
        'C:/msys64/mingw64/bin',
        'C:/mingw64/bin',
        'C:/Program Files/LLVM/bin',
        'C:/Program Files/Git/mingw64/bin',
        '/opt/homebrew/opt/llvm/bin',
        '/usr/local/opt/llvm/bin',
      ],
      versionArgs: ['--version'],
      label: 'A C++ compiler',
      install:
        'Install clang++ or g++: on macOS run `xcode-select --install`, on Debian/Ubuntu ' +
        '`apt install g++`, on Windows install the Visual Studio Build Tools ' +
        '("Desktop development with C++") or MSYS2, and put it on PATH.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const [header, entryPoint] = await Promise.all([
      fs.readFile(path.join(supportDir, 'retrainer.hpp'), 'utf8'),
      fs.readFile(path.join(supportDir, 'retrainer_main.cpp'), 'utf8'),
    ]);
    return [
      { path: 'retrainer.hpp', contents: header },
      { path: 'retrainer_main.cpp', contents: entryPoint },
    ];
  },

  async compile(context: RunContext): Promise<CompileStep | null> {
    const compiler = context.tools[0]?.command ?? 'c++';
    const flags = [...BASE_FLAGS, ...sanitizerFlags(), ...platformDefines()];

    // On Windows a compiler cannot find the standard headers or anything to
    // link against without these. See `packages/toolchain/src/msvc.ts` — it is
    // the difference between "clang++ is installed" and "clang++ can build".
    const msvc = (await findMsvcEnvironment()) ?? {};

    if (context.mode === 'test') {
      // A C++ test file `#include`s the implementation, so the test binary is
      // built from the test files alone. Compiling both together would define
      // every function twice and fail at the linker with a message that says
      // nothing about the exercise.
      // The tests, the learner's implementation, and the harness entry point.
      // Tests declare what they use through a header rather than including the
      // implementation, so the definitions have to be linked in here — which
      // is also what lets an exercise have more than one test file.
      const tests = context.files.filter((file) => isSource(file) && isTest(file));
      const implementation = context.files.filter((file) => isSource(file) && !isTest(file));
      return {
        label: compiler,
        command: compiler,
        args: [
          ...flags,
          '-I.',
          '-o',
          testBinary(),
          'retrainer_main.cpp',
          ...implementation,
          ...tests,
        ],
        env: msvc,
      };
    }

    const sources = context.files.filter((file) => isSource(file) && !isTest(file));
    return {
      label: compiler,
      command: compiler,
      args: [...flags, '-o', binary(), ...sources],
      env: msvc,
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
    return {
      command: context.sandbox.resolve(binary()),
      args: [...context.args],
      env: sanitizerEnv(),
    };
  },

  test(context: TestContext): Command {
    return {
      command: context.sandbox.resolve(testBinary()),
      args: [context.reportFile],
      env: sanitizerEnv(),
    };
  },

  formatter(context: RunContext): Command | null {
    const sources = context.files.filter(isSource);
    if (sources.length === 0) return null;
    // clang-format ships beside clang but is a separate executable and is
    // often absent; an absent formatter reports unavailable rather than
    // failing, which is what the contract asks for.
    return { command: 'clang-format', args: ['-i', '-style=LLVM', ...sources] };
  },

  linter(context: RunContext): Command | null {
    const compiler = context.tools[0]?.command ?? 'cc';
    // Syntax only: a fraction of the cost of a build, and it is what the
    // gutter needs — where the parse broke, not whether it links.
    const sources = context.files.filter((file) => isSource(file) && !isTest(file));
    if (sources.length === 0) return null;
    return { command: compiler, args: [...BASE_FLAGS, '-fsyntax-only', ...sources] };
  },
};

function binary(): string {
  return process.platform === 'win32' ? 'program.exe' : 'program';
}

function testBinary(): string {
  return process.platform === 'win32' ? 'tests.exe' : 'tests';
}

function isTest(file: string): boolean {
  return /(^|[\\/])tests?[\\/]/u.test(file);
}

/** A translation unit the compiler should be handed. Fixtures are not. */
function isSource(file: string): boolean {
  // The harness's own entry point is compiled explicitly for a test build and
  // must never be swept into a plain run, where it would be a second `main`.
  if (file === 'retrainer_main.cpp') return false;
  return file.endsWith('.cpp') || file.endsWith('.cc');
}

/**
 * Sanitizer output belongs in stderr, in full, and must not be interactive.
 */
function sanitizerEnv(): Record<string, string> {
  return {
    ASAN_OPTIONS: 'detect_leaks=1:abort_on_error=0:print_summary=1',
    UBSAN_OPTIONS: 'print_stacktrace=1:halt_on_error=0',
  };
}

export function createCppRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(cppSpec, options);
}
