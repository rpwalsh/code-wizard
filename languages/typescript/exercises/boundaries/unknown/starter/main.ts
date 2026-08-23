// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The boundary kit: unknown taken apart, failures as data, and the one
 * assertion that checks.
 */

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

export function errorMessage(thrown: unknown): string {
  throw new Error('not implemented');
}

export function tryParse(text: string): Result<number> {
  throw new Error('not implemented');
}

export function tryRun<T>(operation: () => T): Result<T> {
  throw new Error('not implemented');
}

export function assertPresent<T>(
  value: T | null | undefined,
  what: string,
): asserts value is T {
  throw new Error('not implemented');
}
