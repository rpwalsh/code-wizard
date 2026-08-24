// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The update queue React runs, and the sharing that keeps rows from redrawing.
 */

export type Item = { id: string; label: string; done: boolean };

/** A queued update: a replacement value, or a function of the previous one. */
export type Update<T> = T | ((previous: T) => T);

export function applyQueue<T>(initial: T, queue: Update<T>[]): T {
  throw new Error('not implemented');
}

export function toggle(items: Item[], id: string): Item[] {
  throw new Error('not implemented');
}

export function rename(items: Item[], id: string, label: string): Item[] {
  throw new Error('not implemented');
}

export function sameShape(before: Item[], after: Item[]): boolean {
  throw new Error('not implemented');
}
