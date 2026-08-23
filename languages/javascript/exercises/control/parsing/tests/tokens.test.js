// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary programs. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { firstError, run } from '../main.js';

test(
  'push and add compute',
  () => {
    expectEqual(run(['push 2', 'push 3', 'add']), [5]);
  },
  { concept: 'javascript.control.loops' },
);

test(
  'dup copies and drop discards',
  () => {
    expectEqual(run(['push 4', 'dup', 'add']), [8]);
    expectEqual(run(['push 1', 'push 2', 'drop']), [1]);
  },
  { concept: 'javascript.control.loops' },
);

test(
  'halt stops execution where it stands',
  () => {
    expectEqual(run(['push 1', 'halt', 'push 2']), [1]);
  },
  { concept: 'javascript.control.conditionals' },
);

test(
  'an empty program is an empty stack',
  () => {
    expectEqual(run([]), []);
  },
  { concept: 'javascript.control.loops' },
);

test(
  'a clean run has no first error',
  () => {
    expectEqual(firstError(['push 1', 'push 2', 'add']), null);
  },
  { concept: 'javascript.control.exceptions' },
);
