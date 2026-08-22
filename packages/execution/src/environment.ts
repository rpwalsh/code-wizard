import os from 'node:os';

/**
 * Learner code runs with an allowlisted environment only (spec §14). The
 * application's own environment may hold API tokens, telemetry keys, or paths
 * into the user's private data; none of it is inherited.
 */
const ALLOWED_KEYS_WINDOWS = [
  'PATH',
  'PATHEXT',
  'SYSTEMROOT',
  'SYSTEMDRIVE',
  'WINDIR',
  'COMSPEC',
  'TEMP',
  'TMP',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
  'USERPROFILE',
  'LOCALAPPDATA',
  // Windows resolves the per-user site-packages directory from APPDATA.
  // Dropping it silently hides everything installed with `pip install --user`.
  'APPDATA',
] as const;

const ALLOWED_KEYS_POSIX = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'SHELL', 'TERM'] as const;

export interface EnvironmentOptions {
  /** Extra variables the runtime adapter needs, e.g. `PYTHONPATH`. */
  readonly extra?: Readonly<Record<string, string>>;
  /** Source environment; defaults to the current process environment. */
  readonly source?: NodeJS.ProcessEnv;
}

export function buildSandboxEnvironment(
  options: EnvironmentOptions = {},
): Record<string, string> {
  const source = options.source ?? process.env;
  const allowed = os.platform() === 'win32' ? ALLOWED_KEYS_WINDOWS : ALLOWED_KEYS_POSIX;
  const environment: Record<string, string> = {};

  // Windows environment variable names are case-insensitive but arrive with
  // mixed casing, so match case-insensitively and preserve the original key.
  const wanted = new Set<string>(allowed.map((key) => key.toUpperCase()));
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (wanted.has(key.toUpperCase())) environment[key] = value;
  }

  for (const [key, value] of Object.entries(options.extra ?? {})) {
    environment[key] = value;
  }
  return environment;
}
