// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
export type { FoundTool, ToolLookup, ToolSpec } from './discovery.ts';
export { findTool, forgetTools, inheritedPath, isFound } from './discovery.ts';

export type { Command, CompileStep, RunContext, TestContext, ToolchainSpec } from './runtime.ts';
export { parseDiagnostics, REPORT_FILE, ToolchainRuntime } from './runtime.ts';

export { reportWriter } from './report-writer.ts';

export type {
  InstallablePackage,
  InstallPlan,
  ManagerSpec,
  PackageManager,
  PackageNames,
  PlannedInstall,
  StepOutcome,
} from './install.ts';
export { detectManagers, MANAGERS, planInstall, runInstall } from './install.ts';

export type { MsvcEnvironment } from './msvc.ts';
export { findMsvcEnvironment, forgetMsvc } from './msvc.ts';

export type { PortableArchive, PortableSource, PortableStep } from './portable.ts';
export { goPortable, installPortable, phpPortable, portableRoot } from './portable.ts';
