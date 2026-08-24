// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Module resolution, and the environment a process actually has.
 */
import path from 'node:path';

export function classify(specifier) {
  // The resolver's own dispatch order, and it matters: 'node:fs' is a
  // builtin, './fs' is a file, and 'fs' is whatever a package named fs
  // resolves to, which is not the same thing at all.
  if (specifier.startsWith('node:')) return 'builtin';
  if (specifier.startsWith('#')) return 'imports-field';
  if (specifier.startsWith('./') || specifier.startsWith('../')) return 'relative';
  if (path.isAbsolute(specifier)) return 'absolute';
  return 'bare';
}

export function resolveRelative(fromFile, specifier) {
  if (classify(specifier) !== 'relative') return null;
  // Relative to the importing *file's directory*, not the process working
  // directory — which is why a module moved to another folder breaks even
  // though the program is started the same way.
  return path.resolve(path.dirname(fromFile), specifier);
}

export function readConfig(env, defaults) {
  const config = {};

  for (const [key, fallback] of Object.entries(defaults)) {
    const raw = env[key];

    // Present but empty is a real answer: PORT= in a compose file means
    // somebody cleared it, and silently substituting the default hides it.
    if (raw === undefined) {
      config[key] = fallback;
      continue;
    }

    if (typeof fallback === 'number') {
      // Number('') is 0 and Number('  ') is 0, so isFinite alone accepts a
      // cleared variable as port zero — which binds to a random free port
      // and produces a service nobody can reach.
      // Coerced to text first: a config object built in code rather than
      // read from the environment can hold a null, and calling a string
      // method on it would throw a TypeError naming nothing useful.
      const text = String(raw);
      const parsed = text.trim() === '' ? Number.NaN : Number(text);
      if (!Number.isFinite(parsed)) throw new Error(`${key} is not a number: ${raw}`);
      config[key] = parsed;
      continue;
    }

    if (typeof fallback === 'boolean') {
      if (String(raw) !== 'true' && String(raw) !== 'false') {
        throw new Error(`${key} must be true or false: ${raw}`);
      }
      config[key] = String(raw) === 'true';
      continue;
    }

    config[key] = raw;
  }

  return config;
}

export function exitCodeFor(outcome) {
  // Zero means success and nothing else does. A process that exits 0 after
  // failing tells every script that ran it the wrong thing.
  if (outcome === 'ok') return 0;
  if (outcome === 'usage') return 2;
  return 1;
}
