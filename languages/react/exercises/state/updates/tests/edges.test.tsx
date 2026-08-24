// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: identity of the untouched, and the array left alone. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { applyQueue, rename, sameShape, toggle, type Item } from '../main.js';

const items: Item[] = [
  { id: 'a', label: 'buy milk', done: false },
  { id: 'b', label: 'call ada', done: true },
  { id: 'c', label: 'write tests', done: false },
];

test(
  'untouched items keep their identity',
  () => {
    const next = toggle(items, 'a');
    // The whole reason to write it this way. A memoized row for 'b' or 'c'
    // sees the same object and does not redraw.
    expectTrue(next[1] === items[1]);
    expectTrue(next[2] === items[2]);
    // And the changed one is genuinely a different object.
    expectTrue(next[0] !== items[0]);
  },
  { concept: 'react.state.immutability' },
);

test(
  'rename shares the untouched items too',
  () => {
    const next = rename(items, 'c', 'write more tests');
    expectTrue(next[0] === items[0]);
    expectTrue(next[1] === items[1]);
    expectTrue(next[2] !== items[2]);
  },
  { concept: 'react.state.immutability' },
);

test(
  'the input array is never modified',
  () => {
    const before = items.map((item) => ({ ...item }));
    toggle(items, 'a');
    rename(items, 'b', 'changed');

    // A handler that mutates leaves React holding a list whose contents
    // changed while its identity did not, and the screen keeps showing the
    // old state until something unrelated causes a render.
    expectEqual(items.length, before.length);
    for (const [index, item] of items.entries()) {
      expectEqual(item.done, before[index].done);
      expectEqual(item.label, before[index].label);
    }
  },
  { concept: 'react.state.immutability' },
);

test(
  'an id that matches nothing returns an equivalent list',
  () => {
    const next = toggle(items, 'missing');
    expectEqual(next.length, 3);
    // Every item shared, so a memoized list re-renders nothing at all.
    expectTrue(sameShape(items, next));
  },
  { concept: 'react.state.immutability' },
);

test(
  'toggling the same item twice returns to the original values',
  () => {
    const there = toggle(items, 'a');
    const back = toggle(there, 'a');
    expectEqual(back[0].done, items[0].done);
    // Equal in value, and still a fresh object: React is told something
    // happened, which is the honest report.
    expectTrue(back[0] !== items[0]);
  },
  { concept: 'react.state.immutability' },
);

test(
  'sameShape notices order without looking at contents',
  () => {
    const reordered = [items[1], items[0], items[2]];
    expectEqual(sameShape(items, reordered), false);
  },
  { concept: 'react.state.immutability' },
);

test(
  'sameShape notices a length change',
  () => {
    expectEqual(sameShape(items, items.slice(0, 2)), false);
    expectEqual(sameShape(items.slice(0, 2), items), false);
    expectTrue(sameShape([], []));
  },
  { concept: 'react.state.immutability' },
);

test(
  'an updater receiving a value it did not expect still runs in order',
  () => {
    // Queue entries of mixed kinds, applied strictly left to right.
    const result = applyQueue<string>('a', [
      (previous) => `${previous}b`,
      'reset',
      (previous) => `${previous}c`,
      (previous) => `${previous}d`,
    ]);
    expectEqual(result, 'resetcd');
  },
  { concept: 'react.state.updates' },
);
