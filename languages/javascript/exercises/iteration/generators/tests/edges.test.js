// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Proof the laziness is real, and the protocol edges. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { Range, chain, map, naturals, take } from '../main.js';

test(
  'map calls the function only for values actually pulled',
  () => {
    let calls = 0;
    const counted = map(naturals(), (n) => {
      calls += 1;
      return n;
    });

    // An eager map over naturals() would never have returned at all.
    expectEqual([...take(counted, 3)], [0, 1, 2]);
    expectTrue(calls <= 4);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'take of zero pulls nothing',
  () => {
    let calls = 0;
    const counted = map([1, 2, 3], () => {
      calls += 1;
      return 0;
    });
    expectEqual([...take(counted, 0)], []);
    expectEqual(calls, 0);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'take of one takes exactly one',
  () => {
    expectEqual([...take([5, 6], 1)], [5]);
  },
  { concept: 'javascript.iteration.generators' },
);

test(
  'take past the end just ends',
  () => {
    expectEqual([...take([1, 2], 10)], [1, 2]);
  },
  { concept: 'javascript.iteration.iterables' },
);

test(
  'a Range can be walked twice',
  () => {
    const range = new Range(0, 3);
    expectEqual([...range], [0, 1, 2]);
    // A bare generator object would be exhausted here; a Range is not.
    expectEqual([...range], [0, 1, 2]);
  },
  { concept: 'javascript.iteration.iterables' },
);

test(
  'an empty Range yields nothing',
  () => {
    expectEqual([...new Range(3, 3)], []);
    expectEqual([...new Range(5, 2)], []);
  },
  { concept: 'javascript.iteration.iterables' },
);

test(
  'chain delegates lazily too',
  () => {
    expectEqual([...take(chain([1], naturals()), 4)], [1, 0, 1, 2]);
  },
  { concept: 'javascript.iteration.generators' },
);
