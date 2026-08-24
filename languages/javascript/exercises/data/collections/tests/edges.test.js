// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: keys an object would ruin, and the cost of the naive scan. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { countBy, groupBy, intersect, pluck, uniqueBy } from '../main.js';

test(
  'a number key and its string spelling stay apart',
  () => {
    // In an object both become the key '1' and the counts merge. This is
    // the failure that turns two different rows of a CSV into one.
    const counts = countBy([1, '1', 1], (value) => value);
    expectEqual(counts.get(1), 2);
    expectEqual(counts.get('1'), 1);
    expectEqual(counts.size, 2);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'booleans and their spellings stay apart too',
  () => {
    const counts = countBy([true, 'true'], (value) => value);
    expectEqual(counts.get(true), 1);
    expectEqual(counts.get('true'), 1);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'keys borrowed from the prototype are counted like any other',
  () => {
    // An object-backed counter treats these three specially: `constructor`
    // is already truthy, `__proto__` may not assign at all, and `toString`
    // arrives inherited. A Map has no opinion about any of them.
    const names = ['constructor', 'toString', '__proto__', 'constructor'];
    const counts = countBy(names, (name) => name);

    expectEqual(counts.get('constructor'), 2);
    expectEqual(counts.get('toString'), 1);
    expectEqual(counts.get('__proto__'), 1);
    expectEqual(counts.size, 3);
  },
  { concept: 'javascript.data.objects' },
);

test(
  'grouping under a dangerous key still produces a plain array',
  () => {
    const groups = groupBy(['__proto__', '__proto__'], (name) => name);
    const bucket = groups.get('__proto__');
    expectTrue(Array.isArray(bucket));
    expectEqual(bucket.length, 2);
  },
  { concept: 'javascript.data.objects' },
);

test(
  'objects used as keys are distinguished by identity',
  () => {
    const left = { id: 1 };
    const right = { id: 1 };
    const counts = countBy([left, right, left], (value) => value);

    // Two objects with equal contents are still two keys. An object-backed
    // counter would turn both into the string '[object Object]' and report
    // a single count of three.
    expectEqual(counts.get(left), 2);
    expectEqual(counts.get(right), 1);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'empty input produces empty containers, not undefined',
  () => {
    expectEqual(countBy([], (x) => x).size, 0);
    expectEqual(groupBy([], (x) => x).size, 0);
    expectEqual(uniqueBy([], (x) => x), []);
    expectEqual(intersect([], [1, 2]), []);
    expectEqual(intersect([1, 2], []), []);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'intersect stays fast when both lists are long',
  () => {
    const size = 20_000;
    const left = Array.from({ length: size }, (_, index) => index);
    const right = Array.from({ length: size }, (_, index) => index + size / 2);

    const began = Date.now();
    const both = intersect(left, right);
    const elapsed = Date.now() - began;

    expectEqual(both.length, size / 2);
    expectEqual(both[0], size / 2);
    // Scanning `right` once per element of `left` is four hundred million
    // comparisons and takes seconds. A Set makes it two passes. The ceiling
    // is generous so a loaded machine passes and a quadratic scan does not.
    expectTrue(elapsed < 1000);
  },
  { concept: 'javascript.data.collections' },
);

test(
  'pluck returns an own value even when it is falsy',
  () => {
    // The `record[key] || undefined` shortcut loses all four of these.
    expectEqual(pluck({ count: 0 }, 'count'), 0);
    expectEqual(pluck({ name: '' }, 'name'), '');
    expectEqual(pluck({ ok: false }, 'ok'), false);
    expectEqual(pluck({ value: null }, 'value'), null);
  },
  { concept: 'javascript.data.objects' },
);
