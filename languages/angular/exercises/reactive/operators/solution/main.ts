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
  return {
    subscribe(listener) {
      for (const value of values) listener(value);
      // Already finished, so unsubscribing has nothing left to stop.
      return () => undefined;
    },
  };
}

export function map<T, U>(source: Stream<T>, transform: (value: T) => U): Stream<U> {
  // An operator is a stream that wraps a stream: subscribing to the result
  // subscribes to the source, and unsubscribing passes straight through.
  return {
    subscribe: (listener) => source.subscribe((value) => listener(transform(value))),
  };
}

export function filter<T>(source: Stream<T>, keep: (value: T) => boolean): Stream<T> {
  return {
    subscribe: (listener) =>
      source.subscribe((value) => {
        if (keep(value)) listener(value);
      }),
  };
}

export function distinctUntilChanged<T>(source: Stream<T>): Stream<T> {
  return {
    subscribe(listener) {
      // Per subscription, not per stream: two subscribers each need their
      // own memory of what they last saw.
      let started = false;
      let previous: T;

      return source.subscribe((value) => {
        if (started && value === previous) return;
        started = true;
        previous = value;
        listener(value);
      });
    },
  };
}

export function switchMap<T, U>(source: Stream<T>, project: (value: T) => Stream<U>): Stream<U> {
  return {
    subscribe(listener) {
      let cancelInner: Unsubscribe | null = null;

      const cancelOuter = source.subscribe((value) => {
        // The switch: the previous inner stream is abandoned before the new
        // one begins, which is what stops an old response overwriting a new.
        cancelInner?.();
        cancelInner = project(value).subscribe(listener);
      });

      return () => {
        cancelInner?.();
        cancelOuter();
      };
    },
  };
}

export function subject<T>(): Stream<T> & { next(value: T): void; listeners(): number } {
  const listeners = new Set<Listener<T>>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      // Returning the removal is the whole contract. A subscribe that gives
      // back nothing is a leak the caller cannot fix.
      return () => listeners.delete(listener);
    },
    next(value) {
      for (const listener of [...listeners]) listener(value);
    },
    listeners: () => listeners.size,
  };
}
