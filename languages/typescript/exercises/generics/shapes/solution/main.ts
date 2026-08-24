// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Generics that keep their promises: keys the compiler has checked.
 */

export function pick<T extends object, K extends keyof T>(source: T, keys: K[]): Pick<T, K> {
  const chosen = {} as Pick<T, K>;
  for (const key of keys) {
    // Only keys the source actually has: a missing key would otherwise
    // appear as a property set to undefined, which is a different shape.
    if (Object.hasOwn(source, key)) chosen[key] = source[key];
  }
  return chosen;
}

export function omit<T extends object, K extends keyof T>(source: T, keys: K[]): Omit<T, K> {
  const removed = new Set<PropertyKey>(keys);
  const kept: Record<PropertyKey, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (!removed.has(key)) kept[key] = value;
  }

  return kept as Omit<T, K>;
}

export function indexBy<T extends object, K extends keyof T>(items: T[], key: K): Map<T[K], T> {
  const index = new Map<T[K], T>();
  for (const item of items) {
    // Last one wins, which is what an index means: one record per key.
    index.set(item[key], item);
  }
  return index;
}

export function countBy<T extends object, K extends keyof T>(items: T[], key: K): Map<T[K], number> {
  const counts = new Map<T[K], number>();
  for (const item of items) {
    const value = item[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function renameKey<T extends object, K extends keyof T, N extends string>(
  source: T,
  from: K,
  to: N,
): Omit<T, K> & Record<N, T[K]> {
  const rest = omit(source, [from]);
  return { ...rest, [to]: source[from] } as Omit<T, K> & Record<N, T[K]>;
}
