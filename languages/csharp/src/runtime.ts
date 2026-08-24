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
import { ToolchainRuntime } from '@code-wizard/toolchain';

/**
 * C#, on the .NET SDK.
 *
 * The project file is generated rather than authored by the learner, and it
 * has no `PackageReference` at all — which is what makes this work on a train.
 * A restore with no packages to fetch needs no network, so a first run is a
 * few seconds of compilation and nothing else. Adding a test SDK would trade
 * that for a thirty-second first run and a hard dependency on a NuGet feed,
 * which is why the harness is a single source file compiled into the same
 * assembly (see `runtime/Retrainer.cs`).
 *
 * `Nullable` and `TreatWarningsAsErrors` are on. Nullable reference types are
 * the single most valuable thing to have learned about modern C#, and a course
 * that teaches C# with them switched off is teaching the previous language.
 * Warnings as errors is a teaching decision too: the compiler's warnings here
 * are almost all real defects, and letting them scroll past is how a learner
 * develops the habit of ignoring them.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const RUN_PROJECT = '.retrainer-run.csproj';
const TEST_PROJECT = '.retrainer-test.csproj';
const BUILD_DIR = '.build';

/**
 * The project the exercise is compiled into.
 *
 * `EnableDefaultCompileItems` is off and the sources are listed explicitly,
 * because the two modes need different sets: a run must not include the test
 * files (two entry points), and a test build must not include the exercise's
 * own `Main` (likewise).
 */
function project(
  sources: readonly string[],
  entryPointType: string | null,
  targetFramework: string,
): string {
  const includes = sources.map((file) => `    <Compile Include="${file}" />`).join('\n');
  const startup =
    entryPointType === null ? '' : `    <StartupObject>${entryPointType}</StartupObject>\n`;

  return `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <NoWarn>CS1591</NoWarn>
    <InvariantGlobalization>true</InvariantGlobalization>
    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>
    <AssemblyName>exercise</AssemblyName>
    <RootNamespace>Exercise</RootNamespace>
    <!-- Nothing is published or shipped, so none of the packaging work is wanted. -->
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
    <SatelliteResourceLanguages>en</SatelliteResourceLanguages>
${startup}  </PropertyGroup>
  <ItemGroup>
${includes}
  </ItemGroup>
</Project>
`;
}

const SMOKE_WORKSPACE = {
  files: [{ path: 'Program.cs', contents: 'System.Console.WriteLine("ok");\n' }],
  entryPoint: 'Program.cs',
};

export const csharpSpec: ToolchainSpec = {
  metadata: {
    id: 'csharp',
    displayName: 'C#',
    editorLanguage: 'csharp',
    fileExtension: '.cs',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'csharp',
    label: 'The .NET SDK',
    packages: {
      winget: 'Microsoft.DotNet.SDK.8',
      choco: 'dotnet-sdk',
      brew: 'dotnet-sdk',
      apt: 'dotnet-sdk-8.0',
      dnf: 'dotnet-sdk-8.0',
      pacman: 'dotnet-sdk',
    },
    manual: 'Download it from https://dotnet.microsoft.com/download.',
    needsNewShell: true,
  },

  tools: [
    {
      candidates: ['dotnet'],
      versionArgs: ['--version'],
      label: 'The .NET SDK',
      install: 'Install the .NET SDK (8.0 or later) from https://dotnet.microsoft.com/download.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    const harness = await fs.readFile(path.join(supportDir, 'Retrainer.cs'), 'utf8');
    return [
      { path: 'Retrainer.cs', contents: harness },
      // Keeps the SDK from walking upward looking for a Directory.Build.props
      // outside the sandbox, which would make a build depend on where the
      // sandbox happened to be created.
      { path: 'Directory.Build.props', contents: '<Project />\n' },
      // Deliberately no NuGet.config clearing the feed list. The reference
      // assemblies for the SDK's own framework are already on disk, so an
      // unconfigured restore resolves them locally and never reaches the
      // network — while clearing the sources makes the restore *fail* when it
      // wants a pack it already has, which is a baffling error to hand
      // somebody working offline.
    ];
  },

  async compile(context: RunContext): Promise<CompileStep | null> {
    const dotnet = context.tools[0]?.command ?? 'dotnet';
    const testing = context.mode === 'test';

    const sources = context.files.filter(
      (file) => file.endsWith('.cs') && isTest(file) === testing && file !== 'Retrainer.cs',
    );
    if (sources.length === 0) return null;

    const file = testing ? TEST_PROJECT : RUN_PROJECT;
    const compiled = testing ? ['Retrainer.cs', ...implementationOf(context), ...sources] : sources;
    await fs.writeFile(
      context.sandbox.resolve(file),
      project(
        compiled,
        testing ? 'Retrainer.Harness' : null,
        targetFramework(context.tools[0]?.version ?? ''),
      ),
      'utf8',
    );

    return {
      label: 'dotnet build',
      command: dotnet,
      // `minimal`, not `quiet`: quiet suppresses the compiler's own errors,
      // and a build that fails silently is the least useful thing a build can
      // do. Minimal prints diagnostics and nothing else.
      args: ['build', file, '-c', 'Release', '-o', BUILD_DIR, '--nologo', '-v', 'minimal'],
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
      command: context.sandbox.resolve(path.join(BUILD_DIR, executable())),
      args: [...context.args],
    };
  },

  test(context: TestContext): Command {
    return {
      command: context.sandbox.resolve(path.join(BUILD_DIR, executable())),
      args: [context.reportFile],
    };
  },

  formatter(context: RunContext): Command | null {
    // `dotnet format` ships with the SDK from 6.0 onwards.
    const dotnet = context.tools[0]?.command ?? 'dotnet';
    return {
      command: dotnet,
      args: ['format', RUN_PROJECT, '--no-restore', '--verbosity', 'quiet'],
    };
  },
};

/**
 * The framework to build against: the one this SDK actually has.
 *
 * Pinning a fixed `net8.0` looks stable and is the opposite. Targeting a
 * framework older than the installed SDK requires *downloading reference
 * packs*, so a machine with only .NET 10 fails to build a `net8.0` project —
 * offline, always; online, on the first run of the day. Building against the
 * SDK's own version needs nothing but what is already on disk.
 *
 * Falls back to net8.0 when the version cannot be read, which is the oldest
 * release still supported and the safest guess if we are guessing at all.
 */
function targetFramework(version: string): string {
  const major = /^(\d+)\./u.exec(version.trim())?.[1];
  return major === undefined ? 'net8.0' : `net${major}.0`;
}

/** The learner's own code, which the test build also needs. */
function implementationOf(context: RunContext): readonly string[] {
  return context.files.filter(
    (file) => file.endsWith('.cs') && !isTest(file) && file !== 'Retrainer.cs',
  );
}

function isTest(file: string): boolean {
  return /(^|[\\/])tests?[\\/]/u.test(file);
}

function executable(): string {
  return process.platform === 'win32' ? 'exercise.exe' : 'exercise';
}

export function createCSharpRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(csharpSpec, options);
}
