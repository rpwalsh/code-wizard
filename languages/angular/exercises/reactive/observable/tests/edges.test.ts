// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Laziness, guards, and the teardown that must run. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { Observable, interval, map, type Scheduler } from '../main.ts';

/** A scheduler the test can fire by hand, recording cancellation. */
function manualScheduler(): Scheduler & { fire: () => void; canceled: boolean } {
  const state = {
    callback: undefined as (() => void) | undefined,
    canceled: false,
  };
  return {
    schedule(callback) {
      state.callback = callback;
      return () => {
        state.canceled = true;
        state.callback = undefined;
      };
    },
    fire: () => state.callback?.(),
    get canceled() {
      return state.canceled;
    },
  };
}

test(
  'nothing runs until subscribe',
  () => {
    let ran = false;
    const lazy = new Observable<number>((observer) => {
      ran = true;
      observer.complete();
      return undefined;
    });
    const mapped = map(lazy, (n) => n);

    expectEqual(ran, false);
    mapped.subscribe({ next: () => undefined });
    expectEqual(ran, true);
  },
  { concept: 'angular.reactive.observables' },
);

test(
  'a dead subscription hears nothing',
  () => {
    let push: (n: number) => void = () => undefined;
    const source = new Observable<number>((observer) => {
      push = (n) => observer.next(n);
      return undefined;
    });

    const seen: number[] = [];
    const subscription = source.subscribe({ next: (n) => seen.push(n) });

    push(1);
    subscription.unsubscribe();
    // The producer misbehaves and keeps pushing; the guard absorbs it.
    push(2);
    push(3);

    expectEqual(seen, [1]);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'next after complete is ignored',
  () => {
    const seen: number[] = [];
    new Observable<number>((observer) => {
      observer.next(1);
      observer.complete();
      observer.next(2);
      return undefined;
    }).subscribe({ next: (n) => seen.push(n) });
    expectEqual(seen, [1]);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'unsubscribing an interval cancels its timer',
  () => {
    const scheduler = manualScheduler();
    const seen: number[] = [];
    const subscription = interval(scheduler).subscribe({ next: (n) => seen.push(n) });

    scheduler.fire();
    scheduler.fire();
    subscription.unsubscribe();

    expectEqual(seen, [0, 1]);
    // The leak test: the resource must actually be released.
    expectTrue(scheduler.canceled);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'teardown runs once even when unsubscribe is called twice',
  () => {
    let teardowns = 0;
    const source = new Observable<number>(() => () => {
      teardowns += 1;
    });
    const subscription = source.subscribe({ next: () => undefined });
    subscription.unsubscribe();
    subscription.unsubscribe();
    expectEqual(teardowns, 1);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'unsubscribing a mapped stream releases the source',
  () => {
    const scheduler = manualScheduler();
    const doubled = map(interval(scheduler), (n) => n * 2);
    const subscription = doubled.subscribe({ next: () => undefined });
    subscription.unsubscribe();
    // The chain must pass teardown through the operator joint.
    expectTrue(scheduler.canceled);
  },
  { concept: 'angular.reactive.subscriptions' },
);
