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
 * ASP.NET Core, tested without starting a server.
 *
 * The honest scope, stated up front: exercises here build and assert on the
 * *pieces* of a web application — an endpoint handler, a model validator, a
 * result type, a middleware delegate, an options binding, a DI registration —
 * by calling them directly. Nothing binds a port and nothing sends an HTTP
 * request.
 *
 * That is a deliberate line and it is where the value is. Spinning up
 * `WebApplicationFactory` needs the ASP.NET test host, which is a NuGet
 * package, a restore, and a network connection on first use, and it buys
 * end-to-end coverage of code that is mostly framework. Meanwhile the mistakes
 * people actually make — a scoped service captured by a singleton,
 * authorization registered before routing, a 401 where a 403 belongs, a
 * validator that passes on null — are all in the pieces, and every one is
 * reachable here in milliseconds with no restore at all.
 *
 * `FrameworkReference` rather than `PackageReference` is what makes that true:
 * `Microsoft.AspNetCore.App` is part of the installed shared framework, so
 * `HttpContext`, `Results`, `IServiceCollection` and the rest are available
 * with nothing to download.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const supportDir = path.resolve(here, '..', '..', 'csharp', 'runtime');
export const exercisesDir = path.resolve(here, '..', 'exercises');
export const curriculumDir = path.resolve(here, '..', 'curriculum');

const RUN_PROJECT = '.retrainer-run.csproj';
const TEST_PROJECT = '.retrainer-test.csproj';
const BUILD_DIR = '.build';

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
    <InvariantGlobalization>true</InvariantGlobalization>
    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>
    <AssemblyName>exercise</AssemblyName>
    <RootNamespace>Exercise</RootNamespace>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
${startup}  </PropertyGroup>
  <ItemGroup>
    <!-- Part of the installed shared framework: no package, no restore, no
         network. This is the whole reason the first run is fast. -->
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>
  <ItemGroup>
${includes}
  </ItemGroup>
</Project>
`;
}

const SMOKE_WORKSPACE = {
  files: [
    {
      path: 'Program.cs',
      contents:
        'var builder = WebApplication.CreateBuilder();\n' +
        'builder.Services.AddSingleton<string>("ok");\n' +
        'var app = builder.Build();\n' +
        'System.Console.WriteLine(app.Services.GetRequiredService<string>());\n',
    },
  ],
  entryPoint: 'Program.cs',
};

export const aspnetSpec: ToolchainSpec = {
  metadata: {
    id: 'aspnet',
    displayName: 'ASP.NET Core',
    editorLanguage: 'csharp',
    fileExtension: '.cs',
    commentPrefix: '//',
    tracing: false,
  },

  smoke: SMOKE_WORKSPACE,

  installable: {
    language: 'aspnet',
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
      install:
        'Install the .NET SDK (8.0 or later) from https://dotnet.microsoft.com/download. ' +
        'It includes the ASP.NET Core shared framework.',
    },
  ],

  async support(): Promise<readonly WorkspaceFile[]> {
    // The C# harness, unchanged. One harness for both .NET courses means the
    // report is identical by construction rather than by agreement.
    const harness = await fs.readFile(path.join(supportDir, 'Retrainer.cs'), 'utf8');
    return [
      { path: 'Retrainer.cs', contents: harness },
      { path: 'Directory.Build.props', contents: '<Project />\n' },
      {
        path: 'GlobalUsings.cs',
        contents: [
          'global using Microsoft.AspNetCore.Builder;',
          'global using Microsoft.AspNetCore.Http;',
          'global using Microsoft.Extensions.DependencyInjection;',
          'global using Microsoft.Extensions.Hosting;',
          '',
        ].join('\n'),
      },
    ];
  },

  async compile(context: RunContext): Promise<CompileStep | null> {
    const dotnet = context.tools[0]?.command ?? 'dotnet';
    const testing = context.mode === 'test';

    const own = context.files.filter(
      (file) => file.endsWith('.cs') && file !== 'Retrainer.cs' && file !== 'GlobalUsings.cs',
    );
    const sources = own.filter((file) => isTest(file) === testing);
    if (sources.length === 0) return null;

    const file = testing ? TEST_PROJECT : RUN_PROJECT;
    const compiled = testing
      ? ['Retrainer.cs', 'GlobalUsings.cs', ...own.filter((entry) => !isTest(entry)), ...sources]
      : ['GlobalUsings.cs', ...sources];

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
};

/** Build against the framework this SDK actually has. See the C# runtime. */
function targetFramework(version: string): string {
  const major = /^(\d+)\./u.exec(version.trim())?.[1];
  return major === undefined ? 'net8.0' : `net${major}.0`;
}

function isTest(file: string): boolean {
  return /(^|[\\/])tests?[\\/]/u.test(file);
}

function executable(): string {
  return process.platform === 'win32' ? 'exercise.exe' : 'exercise';
}

export function createAspNetRuntime(
  options: { readonly sandboxRoot?: string } = {},
): ToolchainRuntime {
  return new ToolchainRuntime(aspnetSpec, options);
}
