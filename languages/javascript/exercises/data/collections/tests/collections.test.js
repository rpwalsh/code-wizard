// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: counting, grouping, first-wins, and membership. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { countBy, groupBy, intersect, pluck, uniqueBy } from '../main.js';

const orders = [
  { id: 1, city: 'leeds', total: 30 },
  { id: 2, city: 'york', total: 12 },
  { id: 3, city: 'leeds', total: 8 },
  { id: 4, city: 'hull', total: 45 },
  { id: 5, city: 'york', total: 5 },
];

test(
  'countBy returns a Map of key to count',
  () => {
    const counts = countBy(orders, (order) => order.city);
    expectTrue(counts instanceof Map);
    expectEqual(counts.get('leeds'), 2);
    expectEqual(counts.get('york'), 2);
    expectEqual(counts.get('hull'), 1);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'countBy keeps keys in the order they were first seen',
  () => {
    const counts = countBy(orders, (order) => order.city);
    expectEqual([...counts.keys()], ['leeds', 'york', 'hull']);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'a key nobody counted is absent rather than zero',
  () => {
    const counts = countBy(orders, (order) => order.city);
    expectEqual(counts.get('ripon'), undefined);
    expectEqual(counts.has('ripon'), false);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'groupBy collects the items themselves, in input order',
  () => {
    const groups = groupBy(orders, (order) => order.city);
    expectEqual(
      groups.get('leeds').map((order) => order.id),
      [1, 3],
    );
    expectEqual(
      groups.get('york').map((order) => order.id),
      [2, 5],
    );
  },
  { concept: 'javascript.data.collections' },
);

test(
  'uniqueBy keeps the first item for each key',
  () => {
    const first = uniqueBy(orders, (order) => order.city);
    // First per city, not last: ids 1, 2 and 4.
    expectEqual(
      first.map((order) => order.id),
      [1, 2, 4],
    );
  },
  { concept: 'javascript.data.collections' },
);

test(
  'intersect keeps the left order and drops duplicates',
  () => {
    expectEqual(intersect(['b', 'a', 'b', 'c'], ['c', 'b']), ['b', 'c']);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'pluck reads an own value and refuses an inherited one',
  () => {
    expectEqual(pluck({ size: 3 }, 'size'), 3);
    expectEqual(pluck({}, 'missing'), undefined);
    // toString exists on every object, and belongs to none of them.
    expectEqual(pluck({}, 'toString'), undefined);
  },
  { concept: 'javascript.data.objects' },
);
