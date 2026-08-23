// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Rendering, including the key. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';
import { renderToStaticMarkup } from 'react-dom/server';

import { Basket, addItem } from '../main.js';

const tea = { id: 'a', name: 'Tea', price: 250, quantity: 2 };
const jam = { id: 'b', name: 'Jam', price: 199, quantity: 1 };

test(
  'renders one row per item, in order',
  () => {
    const html = renderToStaticMarkup(<Basket items={[tea, jam]} />);
    expectTrue(html.includes('<li>Tea</li>'), html);
    expectTrue(html.includes('<li>Jam</li>'), html);
    expectTrue(html.indexOf('Tea') < html.indexOf('Jam'), 'order is not preserved');
  },
  { concept: 'react.render.lists' },
);

test(
  'renders the derived total',
  () => {
    const html = renderToStaticMarkup(<Basket items={[tea, jam]} />);
    expectTrue(html.includes('Total: 699p'), html);
  },
  { concept: 'react.state.derived' },
);

test(
  'the total follows the items with nothing to keep in step',
  () => {
    const html = renderToStaticMarkup(<Basket items={addItem([tea], jam)} />);
    expectTrue(html.includes('Total: 699p'), html);
  },
  { concept: 'react.state.derived' },
);
