// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Structured logs: one JSON object per line, filtered and redacted.
 */

export const LEVELS = ['debug', 'info', 'warn', 'error'];

export function shouldLog(configured, level) {
  throw new Error('not implemented');
}

export function redact(value) {
  throw new Error('not implemented');
}

export function createLogger({ level, sink, now }) {
  throw new Error('not implemented');
}

export async function withTiming(work, now) {
  throw new Error('not implemented');
}
