// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three small generics. The signatures are most of the work.
 */

export function longest<T>(items: T[]): T | undefined {
  throw new Error('not implemented');
}

export function pluck<T, K>(items: T[], key: K): unknown[] {
  throw new Error('not implemented');
}

export function byKey<T, K>(items: T[], key: K): Map<unknown, T> {
  throw new Error('not implemented');
}
