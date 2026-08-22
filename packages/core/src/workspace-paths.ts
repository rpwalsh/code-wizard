/**
 * Workspace path validation.
 *
 * Lives in core, with no platform imports, because both runtimes need it and
 * one of them is a browser. Exercise content is data, and data can be wrong or
 * hostile; this is the gate every path passes through before it reaches a real
 * filesystem or a WASM one.
 */

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

/** Absolute POSIX path, Windows drive path, or UNC path. */
const ABSOLUTE = /^([A-Za-z]:|[\\/])/;

/**
 * Validate a workspace-relative path and return it in POSIX form.
 *
 * Both separators are understood deliberately: hand-written manifests and
 * Windows tooling produce backslashes, and a guard that only understands `/`
 * would wave `..\escape.py` straight through.
 */
export function assertSafeRelativePath(relativePath: string): string {
  if (relativePath.length === 0) throw new WorkspacePathError(relativePath, 'path is empty');
  if (relativePath.includes('\0')) throw new WorkspacePathError(relativePath, 'contains NUL');
  if (ABSOLUTE.test(relativePath)) {
    throw new WorkspacePathError(relativePath, 'must be a relative path');
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

/** True when the path is safe. For filtering, where throwing would be noise. */
export function isSafeRelativePath(relativePath: string): boolean {
  try {
    assertSafeRelativePath(relativePath);
    return true;
  } catch {
    return false;
  }
}
