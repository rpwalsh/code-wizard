// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The boundary kit: unknown taken apart, failures as data, and the one
 * assertion that checks.
 */

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

export function errorMessage(thrown: unknown): string {
  // Narrowing in order of usefulness — and never touching .message until
  // the instanceof has proved it exists. Anything can be thrown.
  if (thrown instanceof Error) {
    return thrown.message;
  }
  if (typeof thrown === 'string') {
    return thrown;
  }
  if (thrown === null || thrown === undefined) {
    return 'unknown error';
  }
  const text = String(thrown);
  // "[object Object]" helps nobody; say so honestly instead.
  return text === '[object Object]' ? 'unknown error' : text;
}

export function tryParse(text: string): Result<number> {
  const trimmed = text.trim();
  const value = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(value)) {
    return { ok: false, error: `not a number: ${text}` };
  }
  return { ok: true, value };
}

export function tryRun<T>(operation: () => T): Result<T> {
  try {
    return { ok: true, value: operation() };
  } catch (thrown) {
    // thrown is unknown — the honest type — and errorMessage is the one
    // place that knows how to make anything printable.
    return { ok: false, error: errorMessage(thrown) };
  }
}

export function assertPresent<T>(
  value: T | null | undefined,
  what: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${what} is missing`);
  }
}
