// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { BasketService } from '../main.ts';

const tea = { id: 'a', name: 'Tea', price: 250, quantity: 2 };

test(
  'the array reference changes on every mutation',
  () => {
    // The property OnPush depends on. A push would leave these identical and
    // the view would never update.
    const basket = new BasketService();
    const before = basket.items;
    basket.add(tea);
    expectTrue(before !== basket.items, 'the array was mutated rather than replaced');
  },
  { concept: 'angular.change.onpush' },
);

test(
  'removing something absent changes nothing observable',
  () => {
    const basket = new BasketService();
    basket.add(tea);
    basket.remove('nope');
    expectEqual(basket.items.length, 1);
  },
  { concept: 'angular.reactive.state' },
);

test(
  'a quantity of zero contributes nothing',
  () => {
    const basket = new BasketService();
    basket.add({ ...tea, quantity: 0 });
    expectEqual(basket.total, 0);
    // Present but worth nothing: empty is about the list, not the money.
    expectEqual(basket.isEmpty, false);
  },
  { concept: 'angular.reactive.state' },
);

test(
  'two services do not share state',
  () => {
    // The reason provider scope matters: a service holding per-component state
    // and provided in root becomes shared state between components.
    const first = new BasketService();
    const second = new BasketService();
    first.add(tea);
    expectEqual(second.items.length, 0);
  },
  { concept: 'angular.di.scope' },
);
