// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual as check, expectTrue, expectFalse } from 'retrainer/expect.js';

import { AssertionError, deepEqual, expectEqual, expectThrows } from '../main.js';

test(
  'primitives and nested structures compare by value',
  () => {
    expectTrue(deepEqual(3, 3));
    expectTrue(deepEqual([1, [2, 3]], [1, [2, 3]]));
    expectTrue(deepEqual({ a: { b: 1 } }, { a: { b: 1 } }));
    expectFalse(deepEqual([1, 2], [2, 1]));
    expectFalse(deepEqual({ a: 1 }, { a: 2 }));
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'a passing expectEqual is silent',
  () => {
    expectEqual({ ok: true }, { ok: true });
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'a failing expectEqual carries both sides',
  () => {
    let caught = null;
    try {
      expectEqual(4, 5);
    } catch (error) {
      caught = error;
    }

    expectTrue(caught instanceof AssertionError);
    check(caught.expected, 5);
    check(caught.received, 4);
    check(caught.name, 'AssertionError');
    expectTrue(caught.message.includes('4') && caught.message.includes('5'));
  },
  { concept: 'javascript.engineering.testing' },
);

test(
  'expectThrows returns the matching error',
  () => {
    const error = expectThrows(RangeError, () => {
      throw new RangeError('out of range');
    });
    check(error.message, 'out of range');
  },
  { concept: 'javascript.engineering.testing' },
);
