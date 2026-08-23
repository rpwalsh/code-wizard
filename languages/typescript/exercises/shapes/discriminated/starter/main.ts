// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A result that carries its reason.
 *
 * Fill in the type and the four functions. The tests describe the behavior
 * precisely; the prompt explains why the shape matters.
 */

// Replace this with a union of a success and a failure, told apart by `ok`.
export type Result<T> = never;

export function parseAge(input: string): Result<number> {
  throw new Error('not implemented');
}

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  throw new Error('not implemented');
}

export function describe(result: Result<number>): string {
  throw new Error('not implemented');
}
