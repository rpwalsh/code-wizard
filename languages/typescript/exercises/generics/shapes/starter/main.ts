// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Generics that keep their promises: keys the compiler has checked.
 */

export function pick<T extends object, K extends keyof T>(source: T, keys: K[]): Pick<T, K> {
  throw new Error('not implemented');
}

export function omit<T extends object, K extends keyof T>(source: T, keys: K[]): Omit<T, K> {
  throw new Error('not implemented');
}

export function indexBy<T extends object, K extends keyof T>(
  items: T[],
  key: K,
): Map<T[K], T> {
  throw new Error('not implemented');
}

export function countBy<T extends object, K extends keyof T>(
  items: T[],
  key: K,
): Map<T[K], number> {
  throw new Error('not implemented');
}

export function renameKey<T extends object, K extends keyof T, N extends string>(
  source: T,
  from: K,
  to: N,
): Omit<T, K> & Record<N, T[K]> {
  throw new Error('not implemented');
}
