// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import os from 'node:os';

import { buildSandboxEnvironment, runProcess } from '@code-wizard/execution';

export interface PythonInterpreter {
  /** Executable to spawn, e.g. `py` or `python3`. */
  readonly command: string;
  /** Arguments that must precede everything else, e.g. `['-3']` for the py launcher. */
  readonly prefixArgs: readonly string[];
  /** `sys.executable` of the resolved interpreter. */
  readonly executable: string;
  readonly version: string;
  readonly versionTuple: readonly [number, number, number];
  /** Whether `pytest` is importable in this interpreter. */
  readonly hasPytest: boolean;
  readonly pytestVersion: string | null;
  /** Formatter/linter availability, discovered once. */
  readonly hasRuff: boolean;
  readonly hasBlack: boolean;
}

export const MINIMUM_PYTHON: readonly [number, number] = [3, 10];

const PROBE = `
import json, sys

def version_of(module):
    try:
        loaded = __import__(module)
    except Exception:
        return None
    return str(getattr(loaded, "__version__", "unknown"))

print("RETRAINER_PROBE" + json.dumps({
    "executable": sys.executable,
    "version": "%d.%d.%d" % sys.version_info[:3],
    "versionTuple": list(sys.version_info[:3]),
    "pytest": version_of("pytest"),
    "ruff": version_of("ruff"),
    "black": version_of("black"),
}))
`;

interface Candidate {
  readonly command: string;
  readonly prefixArgs: readonly string[];
}

function candidates(): Candidate[] {
  const configured = process.env.CODE_RETRAINER_PYTHON?.trim();
  const list: Candidate[] = [];
  if (configured) list.push({ command: configured, prefixArgs: [] });
  if (os.platform() === 'win32') {
    // The py launcher resolves the newest installed 3.x, which is usually what
    // the learner means even when `python` is a Store alias stub.
    list.push({ command: 'py', prefixArgs: ['-3'] });
    list.push({ command: 'python', prefixArgs: [] });
  }
  list.push({ command: 'python3', prefixArgs: [] });
  if (os.platform() !== 'win32') list.push({ command: 'python', prefixArgs: [] });
  return list;
}

export class PythonNotFoundError extends Error {
  constructor(readonly attempted: readonly string[]) {
    super(
      `No usable Python ${MINIMUM_PYTHON.join('.')}+ interpreter found. Tried: ${attempted.join(', ')}. ` +
        'Set CODE_RETRAINER_PYTHON to an interpreter path to override discovery.',
    );
    this.name = 'PythonNotFoundError';
  }
}

async function probe(candidate: Candidate): Promise<PythonInterpreter | null> {
  const outcome = await runProcess({
    command: candidate.command,
    args: [...candidate.prefixArgs, '-c', PROBE],
    cwd: os.tmpdir(),
    env: buildSandboxEnvironment(),
    timeoutMs: 15_000,
    maxOutputBytes: 64 * 1024,
  });

  if (outcome.spawnError || outcome.exitCode !== 0) return null;

  const marker = outcome.stdout.indexOf('RETRAINER_PROBE');
  if (marker < 0) return null;

  let payload: {
    executable: string;
    version: string;
    versionTuple: number[];
    pytest: string | null;
    ruff: string | null;
    black: string | null;
  };
  try {
    payload = JSON.parse(outcome.stdout.slice(marker + 'RETRAINER_PROBE'.length).trim());
  } catch {
    return null;
  }

  const [major = 0, minor = 0, patch = 0] = payload.versionTuple;
  if (major < MINIMUM_PYTHON[0] || (major === MINIMUM_PYTHON[0] && minor < MINIMUM_PYTHON[1])) {
    return null;
  }

  return {
    command: candidate.command,
    prefixArgs: candidate.prefixArgs,
    executable: payload.executable,
    version: payload.version,
    versionTuple: [major, minor, patch],
    hasPytest: payload.pytest !== null,
    pytestVersion: payload.pytest,
    hasRuff: payload.ruff !== null,
    hasBlack: payload.black !== null,
  };
}

let cached: Promise<PythonInterpreter> | null = null;

/** Discover a usable interpreter, memoized for the life of the process. */
export function discoverPython(options: { refresh?: boolean } = {}): Promise<PythonInterpreter> {
  if (options.refresh) cached = null;
  cached ??= (async () => {
    const attempted: string[] = [];
    for (const candidate of candidates()) {
      const label = [candidate.command, ...candidate.prefixArgs].join(' ');
      if (attempted.includes(label)) continue;
      attempted.push(label);
      const interpreter = await probe(candidate);
      if (interpreter) return interpreter;
    }
    throw new PythonNotFoundError(attempted);
  })();
  return cached;
}

/** Test seam: drop the memoized interpreter. */
export function resetPythonDiscovery(): void {
  cached = null;
}
