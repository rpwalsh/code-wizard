// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** What changed, and what came back. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { activeNames, cheapestFirst, firstPriceOver, total } from '../main.js';

test(
  'sorting leaves the caller array alone',
  () => {
    // sort returns the array as well as reordering it, which is what makes
    // `const sorted = items.sort(...)` look like it produced something new.
    const items = [
      { name: 'b', price: 9 },
      { name: 'a', price: 1 },
    ];
    cheapestFirst(items);
    expectEqual(
      items.map((item) => item.name),
      ['b', 'a'],
    );
  },
  { concept: 'javascript.data.arrays' },
);

test(
  'sorting returns a different array',
  () => {
    const items = [{ name: 'a', price: 1 }];
    expectEqual(cheapestFirst(items) === items, false);
  },
  { concept: 'javascript.data.arrays' },
);

test(
  'numbers sort as numbers, not as text',
  () => {
    // The default sort would put 10 before 9.
    const items = [
      { name: 'ten', price: 10 },
      { name: 'nine', price: 9 },
    ];
    expectEqual(
      cheapestFirst(items).map((item) => item.name),
      ['nine', 'ten'],
    );
  },
  { concept: 'javascript.data.arrays' },
);

test(
  'a price of zero is a real answer',
  () => {
    // `|| null` turns it into null, and nothing about the output says so.
    expectEqual(firstPriceOver([{ name: 'free', price: 0 }], -1), 0);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'nothing over the limit is null, not undefined',
  () => {
    // find gives undefined, which vanishes from JSON entirely.
    expectEqual(firstPriceOver([{ name: 'a', price: 1 }], 99), null);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'the empty cases',
  () => {
    expectEqual(activeNames([]), []);
    expectEqual(total([]), 0);
    expectEqual(cheapestFirst([]), []);
    expectEqual(firstPriceOver([], 1), null);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'nothing active is an empty list',
  () => {
    expectEqual(activeNames([{ name: 'a', price: 1, active: false }]), []);
  },
  { concept: 'javascript.data.array-methods' },
);
