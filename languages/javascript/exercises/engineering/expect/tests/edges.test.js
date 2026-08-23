// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The comparisons === gets wrong, and the throws that are themselves wrong. */
import { test } from 'retrainer/test.js';
import { expectEqual as check, expectTrue, expectFalse } from 'retrainer/expect.js';

import { AssertionError, deepEqual, expectThrows } from '../main.js';

test(
  'NaN equals NaN here, because a test framework must say so',
  () => {
    expectTrue(deepEqual(NaN, NaN));
    expectTrue(deepEqual([NaN], [NaN]));
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'zero and negative zero are different answers',
  () => {
    expectFalse(deepEqual(0, -0));
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'an extra key is a difference in both directions',
  () => {
    // Exactly false: deepEqual is public API, and undefined is not an answer.
    check(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
    check(deepEqual({ a: 1, b: 2 }, { a: 1 }), false);
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'arrays of different lengths are exactly unequal',
  () => {
    check(deepEqual([1], [1, 2]), false);
    check(deepEqual([1, 2], [1]), false);
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'an array and an object are never equal',
  () => {
    expectFalse(deepEqual([], {}));
    expectFalse(deepEqual({ 0: 'a', length: 1 }, ['a']));
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'null is only equal to null',
  () => {
    expectTrue(deepEqual(null, null));
    check(deepEqual(null, {}), false);
    check(deepEqual(null, undefined), false);
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'not throwing is an AssertionError',
  () => {
    let caught = null;
    try {
      expectThrows(TypeError, () => 42);
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof AssertionError);
  },
  { concept: 'javascript.engineering.api' },
);

test(
  'throwing the wrong type is an AssertionError naming both',
  () => {
    let caught = null;
    try {
      expectThrows(TypeError, () => {
        throw new RangeError('wrong kind');
      });
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof AssertionError);
    check(caught.expected, 'TypeError');
    check(caught.received, 'RangeError');
  },
  { concept: 'javascript.engineering.api' },
);

test(
  'a subclass instance satisfies the parent type',
  () => {
    class Custom extends RangeError {}
    const error = expectThrows(RangeError, () => {
      throw new Custom('specific');
    });
    check(error.message, 'specific');
  },
  { concept: 'javascript.engineering.api' },
);
