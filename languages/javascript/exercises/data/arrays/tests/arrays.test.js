// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { activeNames, cheapestFirst, firstPriceOver, total } from '../main.js';

const ITEMS = [
  { name: 'tea', price: 3, active: true },
  { name: 'jam', price: 7, active: false },
  { name: 'bread', price: 2, active: true },
];

test(
  'active names in order',
  () => {
    expectEqual(activeNames(ITEMS), ['tea', 'bread']);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'totalling prices',
  () => {
    expectEqual(total(ITEMS), 12);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'cheapest first',
  () => {
    expectEqual(
      cheapestFirst(ITEMS).map((item) => item.name),
      ['bread', 'tea', 'jam'],
    );
  },
  { concept: 'javascript.data.arrays' },
);

test(
  'the first item over a limit',
  () => {
    expectEqual(firstPriceOver(ITEMS, 4), 7);
  },
  { concept: 'javascript.data.array-methods' },
);
