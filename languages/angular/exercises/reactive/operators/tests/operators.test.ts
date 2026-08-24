// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: each operator on its own, then the search pipeline. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { distinctUntilChanged, filter, map, of, subject, switchMap } from '../main.ts';

/** Collect everything a stream emits. */
function collect<T>(stream: { subscribe(listener: (value: T) => void): () => void }): T[] {
  const seen: T[] = [];
  stream.subscribe((value) => seen.push(value));
  return seen;
}

test(
  'of emits each value to a subscriber',
  () => {
    expectEqual(collect(of(1, 2, 3)), [1, 2, 3]);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'map transforms every value',
  () => {
    expectEqual(
      collect(
        map(of(1, 2, 3), (n) => n * 2),
      ),
      [2, 4, 6],
    );
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'filter keeps only what passes',
  () => {
    expectEqual(
      collect(
        filter(of(1, 2, 3, 4), (n) => n % 2 === 0),
      ),
      [2, 4],
    );
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'distinctUntilChanged drops a repeat of the previous value',
  () => {
    expectEqual(collect(distinctUntilChanged(of('a', 'a', 'b', 'b', 'a'))), ['a', 'b', 'a']);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'a subject sends to whoever is listening',
  () => {
    const source = subject<number>();
    const seen = collect(source);

    source.next(1);
    source.next(2);
    expectEqual(seen, [1, 2]);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'unsubscribing stops delivery',
  () => {
    const source = subject<number>();
    const seen: number[] = [];
    const stop = source.subscribe((value) => seen.push(value));

    source.next(1);
    stop();
    source.next(2);

    expectEqual(seen, [1]);
  },
  { concept: 'angular.reactive.subscriptions' },
);

test(
  'switchMap follows the newest value into a new stream',
  () => {
    const terms = subject<string>();
    const results = switchMap(terms, (term) => of(`${term}-1`, `${term}-2`));
    const seen = collect(results);

    terms.next('ada');
    terms.next('bo');

    expectEqual(seen, ['ada-1', 'ada-2', 'bo-1', 'bo-2']);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'the search pipeline composes',
  () => {
    const typed = subject<string>();
    const trimmed = map(typed, (text) => text.trim());
    const longEnough = filter(trimmed, (text) => text.length >= 2);
    const searched = switchMap(distinctUntilChanged(longEnough), (term) =>
      of(`results for ${term}`),
    );
    const seen = collect(searched);

    typed.next('a');
    typed.next('ad');
    typed.next('ad ');
    typed.next('ada');

    // 'a' is too short; 'ad ' trims to a repeat of 'ad' and is dropped.
    expectEqual(seen, ['results for ad', 'results for ada']);
  },
  { concept: 'angular.reactive.operators' },
);
