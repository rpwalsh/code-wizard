// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { Basket, addItem, removeItem, total } from '../main.js';

const tea = { id: 'a', name: 'Tea', price: 250, quantity: 2 };
const jam = { id: 'b', name: 'Jam', price: 199, quantity: 1 };

test(
  'adds an item',
  () => {
    expectEqual(addItem([], tea).length, 1);
    expectEqual(addItem([tea], jam)[1].id, 'b');
  },
  { concept: 'react.state.immutability' },
);

test(
  'removes by id',
  () => {
    expectEqual(
      removeItem([tea, jam], 'a').map((item) => item.id),
      ['b'],
    );
  },
  { concept: 'react.state.immutability' },
);

test(
  'totals price times quantity',
  () => {
    expectEqual(total([tea, jam]), 699);
  },
  { concept: 'react.state.derived' },
);

test(
  'renders the empty state',
  () => {
    expectEqual(renderToStaticMarkup(<Basket items={[]} />), '<p>Basket is empty</p>');
  },
  { concept: 'react.state.derived' },
);
