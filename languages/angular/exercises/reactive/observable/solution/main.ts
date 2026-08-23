// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The four pieces of RxJS, built to be read: producer, subscribe,
 * operators, teardown.
 */

export interface Observer<T> {
  next: (value: T) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export type Teardown = (() => void) | undefined;

export interface Scheduler {
  schedule: (callback: () => void) => () => void;
}

export class Observable<T> {
  readonly producer: (observer: Required<Observer<T>>) => Teardown;

  constructor(producer: (observer: Required<Observer<T>>) => Teardown) {
    this.producer = producer;
  }

  subscribe(observer: Observer<T>): Subscription {
    let closed = false;
    let teardown: Teardown;
    let torndown = false;

    // Teardown runs exactly once, whoever triggers it first.
    const cleanup = () => {
      if (torndown) return;
      torndown = true;
      teardown?.();
    };

    // The guard: a producer is arbitrary code, and a dead subscription
    // hears nothing however hard it pushes.
    const guarded: Required<Observer<T>> = {
      next: (value) => {
        if (!closed) observer.next(value);
      },
      complete: () => {
        if (closed) return;
        closed = true;
        observer.complete?.();
        cleanup();
      },
    };

    teardown = this.producer(guarded);
    // A synchronous complete may have beaten us here; honor it.
    if (closed) cleanup();

    return {
      unsubscribe: () => {
        closed = true;
        cleanup();
      },
    };
  }
}

export function of<T>(...values: T[]): Observable<T> {
  return new Observable((observer) => {
    for (const value of values) observer.next(value);
    observer.complete();
    return undefined;
  });
}

export function map<T, U>(source: Observable<T>, fn: (value: T) => U): Observable<U> {
  // Lazy: subscribing downstream is what subscribes upstream, and the
  // teardown chains so unsubscribing releases the whole pipeline.
  return new Observable((observer) => {
    const subscription = source.subscribe({
      next: (value) => observer.next(fn(value)),
      complete: () => observer.complete(),
    });
    return () => subscription.unsubscribe();
  });
}

export function filter<T>(source: Observable<T>, keep: (value: T) => boolean): Observable<T> {
  return new Observable((observer) => {
    const subscription = source.subscribe({
      next: (value) => {
        if (keep(value)) observer.next(value);
      },
      complete: () => observer.complete(),
    });
    return () => subscription.unsubscribe();
  });
}

export function toArray<T>(source: Observable<T>): T[] {
  const values: T[] = [];
  source.subscribe({ next: (value) => values.push(value) });
  return values;
}

export function interval(scheduler: Scheduler): Observable<number> {
  return new Observable((observer) => {
    let count = 0;
    // The producer takes a resource; the teardown returns it. This pairing
    // is the entire subscription-leak story.
    const cancel = scheduler.schedule(() => {
      observer.next(count);
      count += 1;
    });
    return cancel;
  });
}
