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

export function parseConfig(text, source) {
  throw new Error('not implemented');
}

export function withDefaults(config, defaults) {
  throw new Error('not implemented');
}

export function safeStringify(value) {
  throw new Error('not implemented');
}
