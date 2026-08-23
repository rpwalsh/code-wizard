// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Cases the visible tests did not reach. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { addItem, describeBasket, divide, isWholeNumber } from '../main.js';

test(
  'a string is not a whole number',
  () => {
    expectEqual(isWholeNumber('3'), false);
    expectEqual(isWholeNumber(null), false);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'addItem returns the same array it was given',
  () => {
    const basket = [];
    expectEqual(addItem(basket, 'x') === basket, true);
  },
  { concept: 'javascript.syntax.bindings' },
);

test(
  'describing two items',
  () => {
    expectEqual(describeBasket(['a', 'b']), '2 items: a, b');
  },
  { concept: 'javascript.syntax.strings' },
);

test(
  'the separator is a comma and a space',
  () => {
    expectEqual(describeBasket(['a', 'b', 'c']).endsWith('a, b, c'), true);
  },
  { concept: 'javascript.syntax.strings' },
);

test(
  'dividing negatives',
  () => {
    expectEqual(divide(-10, 4), -2.5);
    expectEqual(divide(10, -4), -2.5);
  },
  { concept: 'javascript.syntax.values' },
);
