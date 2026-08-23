// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The two kinds of failure, kept apart. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { firstError, run } from '../main.js';

function catching(program) {
  try {
    run(program);
    return null;
  } catch (error) {
    return error;
  }
}

test(
  'an unknown command is a SyntaxError naming it',
  () => {
    const error = catching(['push 1', 'launch']);
    expectTrue(error instanceof SyntaxError);
    expectTrue(error.message.includes('launch'));
    expectTrue(error.message.includes('at 1'));
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'push without a number is a SyntaxError',
  () => {
    expectTrue(catching(['push']) instanceof SyntaxError);
    expectTrue(catching(['push three']) instanceof SyntaxError);
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'parseInt-style partial numbers are refused',
  () => {
    // parseInt('3oranges') is 3; Number refuses the whole string.
    expectTrue(catching(['push 3oranges']) instanceof SyntaxError);
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'an empty-stack pop is a RangeError, not a SyntaxError',
  () => {
    const error = catching(['add']);
    expectTrue(error instanceof RangeError);
    expectTrue(error.message.includes('at 0'));
    expectTrue(catching(['push 1', 'add']) instanceof RangeError);
    expectTrue(catching(['dup']) instanceof RangeError);
    expectTrue(catching(['drop']) instanceof RangeError);
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'firstError converts the throw into a message',
  () => {
    expectEqual(firstError(['fly']), 'at 0: unknown command fly');
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'drop works with exactly one value on the stack',
  () => {
    // The guard is < 1; an off-by-one would refuse a legal drop here.
    expectEqual(run(['push 1', 'drop']), []);
    expectEqual(run(['push 7', 'dup', 'drop']), [7]);
  },
  { concept: 'javascript.control.conditionals' },
);

test(
  'push with an empty argument is refused, not zero',
  () => {
    // Number('') is 0, so only the explicit empty-string check catches this.
    expectTrue(catching(['push ']) instanceof SyntaxError);
  },
  { concept: 'javascript.control.exceptions' },
);

test(
  'negative and decimal numbers push fine',
  () => {
    expectEqual(run(['push -2.5', 'push 2.5', 'add']), [0]);
  },
  { concept: 'javascript.control.conditionals' },
);
