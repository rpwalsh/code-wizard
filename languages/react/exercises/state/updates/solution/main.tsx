// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The update queue React runs, and the sharing that keeps rows from redrawing.
 */

export type Item = { id: string; label: string; done: boolean };

/** A queued update: a replacement value, or a function of the previous one. */
export type Update<T> = T | ((previous: T) => T);

export function applyQueue<T>(initial: T, queue: Update<T>[]): T {
  // React's own rule: a callable entry is an updater, anything else is a
  // replacement. This is why storing a function as state needs a wrapper.
  return queue.reduce<T>(
    (state, entry) => (typeof entry === 'function' ? (entry as (previous: T) => T)(state) : entry),
    initial,
  );
}

export function toggle(items: Item[], id: string): Item[] {
  // The else branch returns the original object rather than a copy, so an
  // untouched row is recognizably untouched to a memoized child.
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

export function rename(items: Item[], id: string, label: string): Item[] {
  return items.map((item) => (item.id === id ? { ...item, label } : item));
}

export function sameShape(before: Item[], after: Item[]): boolean {
  // Identity, not deep equality: comparing contents on a long list costs
  // more than the render it was trying to avoid.
  return before.length === after.length && before.every((item, index) => item === after[index]);
}
