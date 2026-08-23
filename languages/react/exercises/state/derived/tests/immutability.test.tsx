// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The inputs must survive untouched. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { addItem, removeItem, total } from '../main.js';

const tea = { id: 'a', name: 'Tea', price: 250, quantity: 2 };
const jam = { id: 'b', name: 'Jam', price: 199, quantity: 1 };

test(
  'adding does not modify the original array',
  () => {
    const original = [tea];
    const next = addItem(original, jam);
    expectEqual(original.length, 1);
    // A different array, or React will not re-render.
    expectTrue(original !== next, 'addItem must return a new array');
  },
  { concept: 'react.state.immutability' },
);

test(
  'removing does not modify the original array',
  () => {
    const original = [tea, jam];
    const next = removeItem(original, 'a');
    expectEqual(original.length, 2);
    expectTrue(original !== next, 'removeItem must return a new array');
  },
  { concept: 'react.state.immutability' },
);

test(
  'an empty basket totals zero',
  () => {
    expectEqual(total([]), 0);
  },
  { concept: 'react.state.derived' },
);

test(
  'a quantity of zero contributes nothing',
  () => {
    expectEqual(total([{ ...tea, quantity: 0 }]), 0);
  },
  { concept: 'react.state.derived' },
);
