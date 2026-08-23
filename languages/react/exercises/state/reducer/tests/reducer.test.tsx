// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary transitions. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { initialState, reducer, canSubmit } from '../main.js';

test(
  'editing records the value and marks the form dirty',
  () => {
    const next = reducer(initialState, { type: 'edit', value: 'ada' });
    expectEqual(next.value, 'ada');
    expectEqual(next.dirty, true);
    expectEqual(next.submitting, false);
  },
  { concept: 'react.state.reducer' },
);

test(
  'submitting sets the flag and clears the error',
  () => {
    const failed = { ...initialState, error: 'nope', dirty: true };
    const next = reducer(failed, { type: 'submit' });
    expectEqual(next.submitting, true);
    expectEqual(next.error, null);
  },
  { concept: 'react.state.reducer' },
);

test(
  'success clears both the flag and the dirty mark',
  () => {
    const sending = { ...initialState, value: 'ada', submitting: true, dirty: true };
    const next = reducer(sending, { type: 'succeeded' });
    expectEqual(next.submitting, false);
    expectEqual(next.dirty, false);
    expectEqual(next.error, null);
    expectEqual(next.value, 'ada');
  },
  { concept: 'react.state.reducer' },
);

test(
  'failure reports the message and leaves the edit unsaved',
  () => {
    const sending = { ...initialState, value: 'ada', submitting: true, dirty: true };
    const next = reducer(sending, { type: 'failed', message: 'server said no' });
    expectEqual(next.submitting, false);
    expectEqual(next.error, 'server said no');
    expectEqual(next.dirty, true);
  },
  { concept: 'react.state.reducer' },
);

test(
  'a dirty, non-blank, idle form can be submitted',
  () => {
    expectEqual(canSubmit({ ...initialState, value: 'ada', dirty: true }), true);
    expectEqual(canSubmit(initialState), false);
  },
  { concept: 'react.state.updates' },
);
