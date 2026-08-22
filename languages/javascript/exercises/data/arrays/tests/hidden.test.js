/** Cases the visible tests did not reach. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { activeNames, cheapestFirst, firstPriceOver, total } from '../main.js';

test(
  'a falsy name is still a name',
  () => {
    expectEqual(activeNames([{ name: '', price: 1, active: true }]), ['']);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'totals with fractional and negative prices',
  () => {
    expectEqual(total([{ price: 1.5 }, { price: -0.5 }]), 1);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'equal prices keep their original order',
  () => {
    const items = [
      { name: 'a', price: 5 },
      { name: 'b', price: 5 },
    ];
    expectEqual(
      cheapestFirst(items).map((item) => item.name),
      ['a', 'b'],
    );
  },
  { concept: 'javascript.data.arrays' },
);

test(
  'the limit itself is not over the limit',
  () => {
    expectEqual(firstPriceOver([{ name: 'a', price: 5 }], 5), null);
    expectEqual(firstPriceOver([{ name: 'a', price: 6 }], 5), 6);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'a price of zero is included in the total',
  () => {
    expectEqual(total([{ price: 0 }, { price: 4 }]), 4);
  },
  { concept: 'javascript.data.array-methods' },
);

test(
  'sorting negatives',
  () => {
    const items = [
      { name: 'a', price: 2 },
      { name: 'b', price: -3 },
    ];
    expectEqual(
      cheapestFirst(items).map((item) => item.name),
      ['b', 'a'],
    );
  },
  { concept: 'javascript.data.arrays' },
);
