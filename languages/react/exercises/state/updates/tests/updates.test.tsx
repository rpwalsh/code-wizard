// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: the queue, and the two edits. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { applyQueue, rename, sameShape, toggle, type Item } from '../main.js';

const items: Item[] = [
  { id: 'a', label: 'buy milk', done: false },
  { id: 'b', label: 'call ada', done: true },
  { id: 'c', label: 'write tests', done: false },
];

test(
  'three values land on the last one',
  () => {
    // setCount(count + 1) three times, with count fixed at 0.
    expectEqual(applyQueue(0, [1, 1, 1]), 1);
  },
  { concept: 'react.state.updates' },
);

test(
  'three updaters compose',
  () => {
    // setCount(c => c + 1) three times. The whole point of the form.
    expectEqual(
      applyQueue(0, [(c: number) => c + 1, (c: number) => c + 1, (c: number) => c + 1]),
      3,
    );
  },
  { concept: 'react.state.updates' },
);

test(
  'a value in the middle discards what came before it',
  () => {
    expectEqual(applyQueue(0, [(c: number) => c + 5, 100, (c: number) => c + 1]), 101);
  },
  { concept: 'react.state.updates' },
);

test(
  'an empty queue leaves the state alone',
  () => {
    expectEqual(applyQueue(7, []), 7);
  },
  { concept: 'react.state.updates' },
);

test(
  'toggle flips exactly one item',
  () => {
    const next = toggle(items, 'a');
    expectEqual(next[0].done, true);
    expectEqual(next[1].done, true);
    expectEqual(next[2].done, false);
  },
  { concept: 'react.state.immutability' },
);

test(
  'rename changes the label and nothing else',
  () => {
    const next = rename(items, 'b', 'call ada back');
    expectEqual(next[1].label, 'call ada back');
    expectEqual(next[1].done, true);
    expectEqual(next[1].id, 'b');
  },
  { concept: 'react.state.immutability' },
);

test(
  'sameShape is true for a list compared with itself',
  () => {
    expectTrue(sameShape(items, items));
  },
  { concept: 'react.state.immutability' },
);

test(
  'sameShape is false once an item has been replaced',
  () => {
    expectEqual(sameShape(items, toggle(items, 'a')), false);
  },
  { concept: 'react.state.immutability' },
);
