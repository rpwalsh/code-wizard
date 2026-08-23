// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Config, logs and flags: the process boundary, typed and injectable.
 */

const LEVELS = ['debug', 'info', 'warn', 'error'];

export function loadConfig(env) {
  let port = 8080;
  if (env.PORT !== undefined) {
    const parsed = Number(env.PORT.trim());
    // Defaults are for absence; garbage dies at boot, where it is cheap.
    if (env.PORT.trim() === '' || !Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`invalid PORT: ${env.PORT}`);
    }
    port = parsed;
  }

  let logLevel = 'info';
  if (env.LOG_LEVEL !== undefined) {
    if (!LEVELS.includes(env.LOG_LEVEL)) {
      throw new Error(`invalid LOG_LEVEL: ${env.LOG_LEVEL}`);
    }
    logLevel = env.LOG_LEVEL;
  }

  const features =
    env.FEATURES === undefined
      ? []
      : env.FEATURES.split(',')
          .map((feature) => feature.trim())
          .filter((feature) => feature !== '');

  return { port, logLevel, features };
}

export function logLine(level, message, fields = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(fields)) {
    // JSON.stringify(new Error) is '{}' — message and stack are
    // non-enumerable, and the log that should explain the outage says
    // nothing. Serialize the message by hand.
    cleaned[key] = value instanceof Error ? value.message : value;
  }
  // Spread first, reserved keys after: a field cannot spoof severity.
  return JSON.stringify({ ...cleaned, level, message });
}

export function parseArgs(argv) {
  const parsed = { _: [] };
  let index = 0;

  while (index < argv.length) {
    const token = argv[index];

    if (token === '--') {
      parsed._.push(...argv.slice(index + 1));
      break;
    }

    if (token.startsWith('--')) {
      const name = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--')) {
        parsed[name] = true;
        index += 1;
      } else {
        parsed[name] = next;
        index += 2;
      }
      continue;
    }

    parsed._.push(token);
    index += 1;
  }

  return parsed;
}
