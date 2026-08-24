// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: shallow freezing, arrays that must stay arrays, cycles. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { deepFreeze, getIn, setIn, updateIn } from '../main.js';

test(
  'freezing reaches the nested objects too',
  () => {
    const config = deepFreeze({ server: { port: 80, tags: ['a'] } });

    expectTrue(Object.isFrozen(config));
    expectTrue(Object.isFrozen(config.server));
    // Object.freeze on its own stops at the first level, and the version
    // that looks correct is the one that never checked this line.
    expectTrue(Object.isFrozen(config.server.tags));
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'freezing something already frozen hands it straight back',
  () => {
    const once = deepFreeze({ a: { b: 1 } });
    const twice = deepFreeze(once);
    // The early exit is a shortcut, not a different answer.
    expectTrue(twice === once);
    expectTrue(Object.isFrozen(twice.a));
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'freezing a structure that refers to itself terminates',
  () => {
    const node = { name: 'root' };
    node.self = node;

    deepFreeze(node);
    expectTrue(Object.isFrozen(node));
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'primitives pass through freezing unharmed',
  () => {
    expectEqual(deepFreeze(5), 5);
    expectEqual(deepFreeze('x'), 'x');
    expectEqual(deepFreeze(null), null);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'an array on the path stays an array',
  () => {
    const state = { items: [{ qty: 1 }, { qty: 2 }] };
    const next = setIn(state, ['items', 1, 'qty'], 9);

    // Spreading an array into an object gives {0:..,1:..}: it prints
    // almost the same and has no map, no length and no push.
    expectTrue(Array.isArray(next.items));
    expectEqual(next.items.length, 2);
    expectEqual(next.items[1].qty, 9);
    // The sibling that was not touched is shared.
    expectTrue(next.items[0] === state.items[0]);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'setting through a path that does not exist yet creates it',
  () => {
    const next = setIn({}, ['a', 'b', 'c'], 1);
    expectEqual(next, { a: { b: { c: 1 } } });
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'an empty path replaces the whole value',
  () => {
    expectEqual(setIn({ a: 1 }, [], 'replaced'), 'replaced');
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'a falsy value is set rather than skipped',
  () => {
    const next = setIn({ a: { b: 1 } }, ['a', 'b'], 0);
    expectEqual(getIn(next, ['a', 'b']), 0);

    const cleared = setIn({ a: { b: 'x' } }, ['a', 'b'], '');
    expectEqual(getIn(cleared, ['a', 'b']), '');
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'updateIn on an absent path receives undefined',
  () => {
    const next = updateIn({ counts: {} }, ['counts', 'leeds'], (value) => (value ?? 0) + 1);
    expectEqual(getIn(next, ['counts', 'leeds']), 1);
  },
  { concept: 'javascript.modeling.immutability' },
);

test(
  'the original is untouched however deep the change was',
  () => {
    const state = { a: { b: { c: { d: 1 } } } };
    const next = setIn(state, ['a', 'b', 'c', 'd'], 2);

    expectEqual(getIn(state, ['a', 'b', 'c', 'd']), 1);
    expectEqual(getIn(next, ['a', 'b', 'c', 'd']), 2);
    // Every object on the path is fresh; nothing off it is.
    expectTrue(next.a !== state.a);
    expectTrue(next.a.b !== state.a.b);
  },
  { concept: 'javascript.modeling.immutability' },
);
