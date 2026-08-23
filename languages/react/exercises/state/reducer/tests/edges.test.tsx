// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Identity, immutability, and the actions that should do nothing. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { initialState, reducer, canSubmit } from '../main.js';

test(
  'an unknown action returns the very same object',
  () => {
    const next = reducer(initialState, { type: 'unknown' });
    // Reference equality, not deep equality: React re-renders on identity.
    expectTrue(next === initialState);
  },
  { concept: 'react.state.immutability' },
);

test(
  'a second submit while submitting returns the very same object',
  () => {
    const sending = { ...initialState, submitting: true, dirty: true };
    expectTrue(reducer(sending, { type: 'submit' }) === sending);
  },
  { concept: 'react.state.immutability' },
);

test(
  'the previous state is never mutated',
  () => {
    const before = { ...initialState };
    reducer(before, { type: 'edit', value: 'ada' });
    expectEqual(before.value, '');
    expectEqual(before.dirty, false);
  },
  { concept: 'react.state.immutability' },
);

test(
  'whitespace alone is not something to submit',
  () => {
    expectEqual(canSubmit({ ...initialState, value: '   ', dirty: true }), false);
  },
  { concept: 'react.state.updates' },
);
