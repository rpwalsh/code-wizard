// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * `T extends { length: number }` accepts anything measurable and refuses
 * everything the body could not have handled — which is the whole test of a
 * constraint.
 */
export function longest<T extends { length: number }>(items: T[]): T | undefined {
  let best: T | undefined;
  for (const item of items) {
    // `>` and not `>=`, so a tie keeps the first.
    if (best === undefined || item.length > best.length) best = item;
  }
  return best;
}

/**
 * `K extends keyof T` makes a misspelled key a compile error, and `T[K]` keeps
 * the property's own type rather than widening it away.
 */
export function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

export function byKey<T, K extends keyof T>(items: T[], key: K): Map<T[K], T> {
  const found = new Map<T[K], T>();
  // Later entries overwrite earlier ones, which is what `set` already does and
  // what the exercise specifies.
  for (const item of items) found.set(item[key], item);
  return found;
}
