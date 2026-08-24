// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: the stale response, the leak, and state kept per subscriber. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { distinctUntilChanged, of, subject, switchMap } from '../main.ts';

test(
  'switchMap abandons the previous inner stream',
  () => {
    // The reason switchMap exists. The first request is still outstanding
    // when the second term arrives, and its answer must never be shown.
    const terms = subject<string>();
    const responses = new Map<string, { next(value: string): void; listeners(): number }>();

    const results = switchMap(terms, (term) => {
      const response = subject<string>();
      responses.set(term, response);
      return response;
    });

    const seen: string[] = [];
    results.subscribe((value) => seen.push(value));

    terms.next('slow');
    terms.next('fast');

    // The fast one answers first, then the slow one finally replies.
    const fast = responses.get('fast');
    const slow = responses.get('slow');
    expectTrue(fast !== undefined && slow !== undefined);
    fast?.next('fast result');
    slow?.next('slow result');

    // Without the switch the stale answer overwrites the fresh one: the
    // search box showing results for what you typed two words ago.
    expectEqual(seen, ['fast result']);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'unsubscribing a switchMap stops the inner stream too',
  () => {
    const terms = subject<string>();
    const inner = subject<string>();
    const results = switchMap(terms, () => inner);

    const seen: string[] = [];
    const stop = results.subscribe((value) => seen.push(value));

    terms.next('go');
    inner.next('one');
    stop();
    inner.next('two');

    // A teardown that forgets the inner subscription leaks it, and a
    // component that was destroyed keeps receiving.
    expectEqual(seen, ['one']);
    expectEqual(inner.listeners(), 0);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'a subject drops the listener when it unsubscribes',
  () => {
    const source = subject<number>();
    const stop = source.subscribe(() => undefined);
    expectEqual(source.listeners(), 1);

    stop();
    expectEqual(source.listeners(), 0);

    // Twice is harmless: components unsubscribe in a destroy hook that can
    // run after an explicit unsubscribe.
    stop();
    expectEqual(source.listeners(), 0);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'distinctUntilChanged remembers per subscriber, not per stream',
  () => {
    const source = subject<string>();
    const distinct = distinctUntilChanged(source);

    const first: string[] = [];
    distinct.subscribe((value) => first.push(value));

    source.next('a');

    // A second subscriber arriving later has seen nothing yet, so 'a' is
    // new to it. State kept on the stream rather than the subscription
    // would silently swallow this.
    const second: string[] = [];
    distinct.subscribe((value) => second.push(value));

    source.next('a');

    expectEqual(first, ['a']);
    expectEqual(second, ['a']);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'two subscribers each receive everything',
  () => {
    const source = subject<number>();
    const a: number[] = [];
    const b: number[] = [];
    source.subscribe((value) => a.push(value));
    source.subscribe((value) => b.push(value));

    source.next(7);

    expectEqual(a, [7]);
    expectEqual(b, [7]);
    expectEqual(source.listeners(), 2);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'a listener that unsubscribes during delivery does not disturb the rest',
  () => {
    const source = subject<number>();
    const seen: string[] = [];

    const stopFirst = source.subscribe(() => {
      seen.push('first');
      stopFirst();
    });
    source.subscribe(() => seen.push('second'));

    source.next(1);

    // Iterating the live set while a listener removes itself skips the
    // next one. Copying before delivery is what prevents it.
    expectEqual(seen, ['first', 'second']);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'a subject with no subscribers emits to nobody without failing',
  () => {
    const source = subject<number>();
    source.next(1);
    expectEqual(source.listeners(), 0);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'subscribing to a finished stream still hands back a teardown',
  () => {
    // `of` has nothing left to stop, but the contract is the contract: every
    // subscribe returns something callable, or the caller has to check.
    const stop = of(1, 2).subscribe(() => undefined);
    expectEqual(typeof stop, 'function');
    stop();
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'the first value is emitted even when it is undefined',
  () => {
    // A stream may legitimately carry undefined. An operator that starts
    // out believing it has already seen a value swallows this one.
    const source = subject<string | undefined>();
    const seen: (string | undefined)[] = [];
    distinctUntilChanged(source).subscribe((value) => seen.push(value));

    source.next(undefined);
    source.next(undefined);
    source.next('a');

    expectEqual(seen.length, 2);
    expectEqual(seen[0], undefined);
    expectEqual(seen[1], 'a');
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'values that merely look alike are both delivered',
  () => {
    // 0 and '0' are equal under loose comparison and distinct under strict.
    // A stream of mixed types is where that difference stops being academic.
    const source = subject<number | string>();
    const seen: (number | string)[] = [];
    distinctUntilChanged(source).subscribe((value) => seen.push(value));

    source.next(0);
    source.next('0');
    source.next('0');

    expectEqual(seen, [0, '0']);
  },
  { concept: 'angular.reactive.operators' },
);
