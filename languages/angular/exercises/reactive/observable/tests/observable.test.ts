// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary streams. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { Observable, filter, map, of, toArray } from '../main.ts';

test(
  'of emits its values and completes',
  () => {
    const seen: number[] = [];
    let completed = false;
    of(1, 2, 3).subscribe({
      next: (value) => seen.push(value),
      complete: () => {
        completed = true;
      },
    });
    expectEqual(seen, [1, 2, 3]);
    expectEqual(completed, true);
  },
  { concept: 'angular.reactive.observables' },
);

test(
  'map transforms each value',
  () => {
    expectEqual(toArray(map(of(1, 2, 3), (n) => n * 10)), [10, 20, 30]);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'filter keeps what the predicate keeps',
  () => {
    expectEqual(toArray(filter(of(1, 2, 3, 4), (n) => n % 2 === 0)), [2, 4]);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'operators compose',
  () => {
    const evensDoubled = map(filter(of(1, 2, 3, 4, 5), (n) => n % 2 === 0), (n) => n * 2);
    expectEqual(toArray(evensDoubled), [4, 8]);
  },
  { concept: 'angular.reactive.operators' },
);

test(
  'a completed observer is optional',
  () => {
    const seen: string[] = [];
    of('a').subscribe({ next: (value) => seen.push(value) });
    expectEqual(seen, ['a']);
  },
  { concept: 'angular.reactive.observables' },
);
