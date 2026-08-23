// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { BasketService } from '../main.ts';

const tea = { id: 'a', name: 'Tea', price: 250, quantity: 2 };
const jam = { id: 'b', name: 'Jam', price: 199, quantity: 1 };

test(
  'starts empty',
  () => {
    const basket = new BasketService();
    expectEqual(basket.isEmpty, true);
    expectEqual(basket.total, 0);
  },
  { concept: 'angular.reactive.state' },
);

test(
  'adds items',
  () => {
    const basket = new BasketService();
    basket.add(tea);
    basket.add(jam);
    expectEqual(basket.items.length, 2);
    expectEqual(basket.isEmpty, false);
  },
  { concept: 'angular.reactive.state' },
);

test(
  'totals price times quantity',
  () => {
    const basket = new BasketService();
    basket.add(tea);
    basket.add(jam);
    expectEqual(basket.total, 699);
  },
  { concept: 'angular.reactive.state' },
);

test(
  'removes by id',
  () => {
    const basket = new BasketService();
    basket.add(tea);
    basket.add(jam);
    basket.remove('a');
    expectEqual(
      basket.items.map((item) => item.id),
      ['b'],
    );
  },
  { concept: 'angular.reactive.state' },
);
