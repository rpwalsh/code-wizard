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
    throw new Error('not implemented');
  }
}

export function of<T>(...values: T[]): Observable<T> {
  throw new Error('not implemented');
}

export function map<T, U>(source: Observable<T>, fn: (value: T) => U): Observable<U> {
  throw new Error('not implemented');
}

export function filter<T>(source: Observable<T>, keep: (value: T) => boolean): Observable<T> {
  throw new Error('not implemented');
}

export function toArray<T>(source: Observable<T>): T[] {
  throw new Error('not implemented');
}

export function interval(scheduler: Scheduler): Observable<number> {
  throw new Error('not implemented');
}
