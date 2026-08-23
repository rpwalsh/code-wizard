// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { addItem, describeBasket, divide, isWholeNumber } from '../main.js';

test(
  'dividing',
  () => {
    expectEqual(divide(10, 4), 2.5);
    expectEqual(divide(9, 3), 3);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'whole numbers',
  () => {
    expectEqual(isWholeNumber(3), true);
    expectEqual(isWholeNumber(3.5), false);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'adding to a basket',
  () => {
    const basket = ['tea'];
    addItem(basket, 'jam');
    expectEqual(basket, ['tea', 'jam']);
  },
  { concept: 'javascript.syntax.bindings' },
);

test(
  'describing a basket',
  () => {
    expectEqual(describeBasket(['tea', 'jam', 'bread']), '3 items: tea, jam, bread');
    expectEqual(describeBasket([]), 'empty');
  },
  { concept: 'javascript.syntax.strings' },
);
