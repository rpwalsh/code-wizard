// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The operators a search box needs, written out rather than imported.
 */

export type Listener<T> = (value: T) => void;
export type Unsubscribe = () => void;

/** A minimal observable: subscribe, receive, stop receiving. */
export interface Stream<T> {
  subscribe(listener: Listener<T>): Unsubscribe;
}

export function of<T>(...values: T[]): Stream<T> {
  throw new Error('not implemented');
}

export function map<T, U>(source: Stream<T>, transform: (value: T) => U): Stream<U> {
  throw new Error('not implemented');
}

export function filter<T>(source: Stream<T>, keep: (value: T) => boolean): Stream<T> {
  throw new Error('not implemented');
}

export function distinctUntilChanged<T>(source: Stream<T>): Stream<T> {
  throw new Error('not implemented');
}

export function switchMap<T, U>(
  source: Stream<T>,
  project: (value: T) => Stream<U>,
): Stream<U> {
  throw new Error('not implemented');
}

export function subject<T>(): Stream<T> & { next(value: T): void; listeners(): number } {
  throw new Error('not implemented');
}
