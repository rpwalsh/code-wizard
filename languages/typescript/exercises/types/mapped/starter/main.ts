// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The utility types, rebuilt: mapped, conditional, and remapped keys.
 */

export type Mine<T> = T; // your Partial
export type Locked<T> = T; // your Readonly
export type Chosen<T, K extends keyof T> = T; // your Pick
export type Unwrapped<T> = T; // Promise<T> -> T, one layer
export type Setters<T> = T; // { setName(value) ... }

export function pickFields<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Chosen<T, K> {
  throw new Error('not implemented');
}

export function makeSetters<T extends Record<string, string | number | boolean>>(
  target: T,
): Setters<T> {
  throw new Error('not implemented');
}
