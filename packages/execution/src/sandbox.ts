import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Workspace, WorkspaceFile } from '@forge/core';

export class WorkspacePathError extends Error {
  constructor(
    readonly requestedPath: string,
    reason: string,
  ) {
    super(`Unsafe workspace path ${JSON.stringify(requestedPath)}: ${reason}`);
    this.name = 'WorkspacePathError';
  }
}

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

/**
 * Exercise content is data, and data can be hostile or simply wrong (spec §35
 * lists malicious exercise content as a tested threat). Every relative path is
 * validated before it is joined to a real directory.
 */
export function assertSafeRelativePath(relativePath: string): string {
  if (relativePath.length === 0) throw new WorkspacePathError(relativePath, 'path is empty');
  if (relativePath.includes('\0')) throw new WorkspacePathError(relativePath, 'contains NUL');
  if (path.isAbsolute(relativePath) || /^[A-Za-z]:/.test(relativePath)) {
    throw new WorkspacePathError(relativePath, 'must be relative');
  }
  // Both separators, deliberately: Windows exercise content and hand-written
  // manifests use backslashes, and a guard that only understands `/` would let
  // `..\escape.py` through.
  if (/^[\\/]/.test(relativePath)) {
    throw new WorkspacePathError(relativePath, 'must not start with a separator');
  }

  const segments = relativePath.split(/[\\/]+/);
  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      throw new WorkspacePathError(relativePath, 'contains an empty or "." segment');
    }
    if (segment === '..') {
      throw new WorkspacePathError(relativePath, 'traverses outside the workspace');
    }
    if (WINDOWS_RESERVED.test(segment)) {
      throw new WorkspacePathError(relativePath, `"${segment}" is a reserved device name`);
    }
  }
  return segments.join('/');
}

/** Resolve a workspace-relative path inside `root`, refusing to escape it. */
export function resolveInside(root: string, relativePath: string): string {
  const safe = assertSafeRelativePath(relativePath);
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, safe);
  const boundary = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (target !== resolvedRoot && !target.startsWith(boundary)) {
    throw new WorkspacePathError(relativePath, 'resolves outside the workspace root');
  }
  return target;
}

export interface SandboxOptions {
  /** Parent directory for sandboxes. Defaults to the OS temp directory. */
  readonly rootDir?: string;
  readonly prefix?: string;
}

/**
 * A disposable directory holding one attempt's files. Isolation is per
 * execution: nothing an exercise writes can be seen by the next one.
 */
export class Sandbox implements AsyncDisposable {
  #disposed = false;

  private constructor(readonly root: string) {}

  static async create(options: SandboxOptions = {}): Promise<Sandbox> {
    const parent = options.rootDir ?? path.join(os.tmpdir(), 'forge-sandboxes');
    await fs.mkdir(parent, { recursive: true });
    const root = path.join(parent, `${options.prefix ?? 'attempt'}-${randomUUID()}`);
    await fs.mkdir(root, { recursive: true });
    return new Sandbox(root);
  }

  resolve(relativePath: string): string {
    return resolveInside(this.root, relativePath);
  }

  async writeFile(file: WorkspaceFile): Promise<void> {
    const target = this.resolve(file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.contents, 'utf8');
  }

  async materialise(workspace: Workspace): Promise<void> {
    for (const file of workspace.files) await this.writeFile(file);
  }

  /** Read back the learner-visible files after a run (formatters rewrite them). */
  async readFile(relativePath: string): Promise<string> {
    return fs.readFile(this.resolve(relativePath), 'utf8');
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    await fs.rm(this.root, { recursive: true, force: true, maxRetries: 3 });
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose();
  }
}

/** Run `body` against a fresh sandbox and always clean it up. */
export async function withSandbox<T>(
  workspace: Workspace,
  body: (sandbox: Sandbox) => Promise<T>,
  options: SandboxOptions = {},
): Promise<T> {
  const sandbox = await Sandbox.create(options);
  try {
    await sandbox.materialise(workspace);
    return await body(sandbox);
  } finally {
    await sandbox.dispose();
  }
}
