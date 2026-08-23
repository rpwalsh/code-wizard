// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The JSON boundary: parse with context, default without flattening,
 * stringify without silent mangling.
 */

export class ConfigError extends Error {
  constructor(message, source) {
    super(message);
    this.name = 'ConfigError';
    this.source = source;
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseConfig(text, source) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    // Add where the text came from; "Unexpected token" alone points nowhere.
    throw new ConfigError(`${source}: ${error.message}`, source);
  }

  if (!isPlainObject(parsed)) {
    throw new ConfigError(`${source}: config must be an object`, source);
  }
  return parsed;
}

export function withDefaults(config, defaults) {
  const merged = { ...config };
  for (const key of Object.keys(defaults)) {
    // ?? asks "is this absent"; || would flatten 0, false and "" too.
    merged[key] = config[key] ?? defaults[key];
  }
  return merged;
}

export function safeStringify(value) {
  const refuse = (what) => {
    throw new ConfigError(`stringify: value contains ${what}`, 'stringify');
  };

  if (value === undefined) refuse('undefined');

  // The replacer sees every value stringify visits, so the recursive walk
  // comes free — the replacer just looks before JSON mangles.
  return JSON.stringify(value, (key, val) => {
    if (typeof val === 'function') refuse('a function');
    if (val === undefined) refuse('undefined');
    if (typeof val === 'number' && !Number.isFinite(val)) refuse(String(val));
    return val;
  });
}
