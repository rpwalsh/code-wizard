/** Where the single number type shows. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { addItem, describeBasket, divide, isWholeNumber } from '../main.js';

test(
  'dividing by zero is a value, not an error',
  () => {
    // Which is a convenience and a trap: an average over nothing is NaN, and it
    // propagates silently until it shows up as a blank cell.
    expectEqual(divide(1, 0), Infinity);
    expectEqual(divide(-1, 0), -Infinity);
    expectEqual(Number.isNaN(divide(0, 0)), true);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'every number is a float',
  () => {
    expectEqual(divide(1, 1), 1);
    expectEqual(isWholeNumber(divide(4, 2)), true);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'infinity is not a whole number',
  () => {
    // `value % 1 === 0` says it is, which is why that check is not enough.
    expectEqual(isWholeNumber(Infinity), false);
    expectEqual(isWholeNumber(NaN), false);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'negative and zero are whole numbers',
  () => {
    expectEqual(isWholeNumber(0), true);
    expectEqual(isWholeNumber(-4), true);
    expectEqual(isWholeNumber(-4.5), false);
  },
  { concept: 'javascript.syntax.values' },
);

test(
  'a const basket is still mutable',
  () => {
    // const binds the name. It says nothing about the object.
    const basket = [];
    addItem(basket, 'tea');
    addItem(basket, 'jam');
    expectEqual(basket.length, 2);
  },
  { concept: 'javascript.syntax.bindings' },
);

test(
  'one item is singular',
  () => {
    expectEqual(describeBasket(['tea']), '1 item: tea');
  },
  { concept: 'javascript.syntax.strings' },
);
