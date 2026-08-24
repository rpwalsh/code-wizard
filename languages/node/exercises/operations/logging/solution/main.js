// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Structured logs: one JSON object per line, filtered and redacted.
 */

export const LEVELS = ['debug', 'info', 'warn', 'error'];

const SECRET_KEYS = new Set(['password', 'token', 'secret', 'authorization']);

export function shouldLog(configured, level) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(configured);
}

export function redact(value) {
  if (Array.isArray(value)) return value.map((entry) => redact(entry));

  // typeof null is 'object', so the null test has to come first.
  if (value === null || typeof value !== 'object') return value;

  const copy = {};
  for (const [key, entry] of Object.entries(value)) {
    // A password three objects deep is the one that reaches production,
    // because the shallow version looked like it worked.
    copy[key] = SECRET_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(entry);
  }
  return copy;
}

export function createLogger({ level, sink, now }) {
  const logger = {};

  for (const name of LEVELS) {
    logger[name] = (message, fields) => {
      // Nothing is built for a filtered message: no redaction, no
      // stringify, not even a call to the clock. The expensive part of a
      // debug log is assembling it, not writing it.
      if (!shouldLog(level, name)) return;

      sink(JSON.stringify({ level: name, message, time: now(), ...redact(fields ?? {}) }));
    };
  }

  return logger;
}

export async function withTiming(work, now) {
  const began = now();
  try {
    const value = await work();
    return { value, ms: now() - began };
  } catch (error) {
    // Timed even when it fails. A measurement that drops the failures
    // reports a fast service during an outage, because every slow call now
    // ends in an error and leaves the sample.
    error.ms = now() - began;
    throw error;
  }
}
