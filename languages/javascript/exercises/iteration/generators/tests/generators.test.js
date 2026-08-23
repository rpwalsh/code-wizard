// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { Range, chain, map, naturals, take } from '../main.js';

test(
  'take slices the front of an infinite sequence',
  () => {
    expectEqual([...take(naturals(), 4)], [0, 1, 2, 3]);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'map transforms lazily but correctly',
  () => {
    expectEqual([...take(map(naturals(), (n) => n * n), 5)], [0, 1, 4, 9, 16]);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'chain runs its sources in order',
  () => {
    expectEqual([...chain([1, 2], [], [3])], [1, 2, 3]);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'a Range produces its half-open interval',
  () => {
    expectEqual([...new Range(2, 5)], [2, 3, 4]);
  },
  { concept: 'javascript.iteration.iterables' },
);

test(
  'the tools accept any iterable, not just generators',
  () => {
    expectEqual([...take('hello', 2)], ['h', 'e']);
    expectEqual([...map([1, 2], (n) => n + 10)], [11, 12]);
  },
  { concept: 'javascript.iteration.iterables' },
);
