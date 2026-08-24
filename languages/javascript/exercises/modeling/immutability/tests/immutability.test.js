// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: reading, setting and updating a path. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { deepFreeze, getIn, setIn, updateIn } from '../main.js';

const state = {
  user: { name: 'ada', address: { city: 'leeds' } },
  items: [{ id: 1, qty: 2 }],
};

test(
  'getIn reads a nested value',
  () => {
    expectEqual(getIn(state, ['user', 'address', 'city']), 'leeds');
    expectEqual(getIn(state, ['items', 0, 'qty']), 2);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'getIn returns undefined for a path that is not there',
  () => {
    expectEqual(getIn(state, ['user', 'phone']), undefined);
    expectEqual(getIn(state, ['user', 'phone', 'country']), undefined);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'setIn produces a new object with the value changed',
  () => {
    const next = setIn(state, ['user', 'address', 'city'], 'york');
    expectEqual(getIn(next, ['user', 'address', 'city']), 'york');
    expectEqual(getIn(state, ['user', 'address', 'city']), 'leeds');
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'setIn shares the parts it did not touch',
  () => {
    const next = setIn(state, ['user', 'name'], 'bo');
    // items was not on the path, so it is the same array.
    expectTrue(next.items === state.items);
    expectTrue(next.user !== state.user);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'updateIn computes the new value from the old one',
  () => {
    const next = updateIn(state, ['items', 0, 'qty'], (qty) => qty + 1);
    expectEqual(getIn(next, ['items', 0, 'qty']), 3);
    expectEqual(getIn(state, ['items', 0, 'qty']), 2);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'deepFreeze returns the value it froze',
  () => {
    const frozen = deepFreeze({ a: 1 });
    expectTrue(Object.isFrozen(frozen));
  },
  { concept: 'javascript.modeling.immutability' },
);
