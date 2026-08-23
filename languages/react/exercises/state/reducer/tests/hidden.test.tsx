// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Sequences, which is where a reducer either holds together or does not. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { initialState, reducer, canSubmit } from '../main.js';

function run(actions) {
  return actions.reduce(reducer, initialState);
}

test(
  'editing after a failure clears the stale message',
  () => {
    const state = run([
      { type: 'edit', value: 'a' },
      { type: 'submit' },
      { type: 'failed', message: 'too short' },
      { type: 'edit', value: 'ada' },
    ]);
    expectEqual(state.error, null);
    expectEqual(state.value, 'ada');
    expectEqual(canSubmit(state), true);
  },
  { concept: 'react.state.updates' },
);

test(
  'a saved form is not submittable again until it changes',
  () => {
    const saved = run([
      { type: 'edit', value: 'ada' },
      { type: 'submit' },
      { type: 'succeeded' },
    ]);
    expectEqual(canSubmit(saved), false);
    expectEqual(canSubmit(reducer(saved, { type: 'edit', value: 'ada b' })), true);
  },
  { concept: 'react.state.updates' },
);

test(
  'a spinner and an error message never appear together',
  () => {
    const states = [
      run([{ type: 'edit', value: 'a' }, { type: 'submit' }]),
      run([{ type: 'edit', value: 'a' }, { type: 'submit' }, { type: 'failed', message: 'x' }]),
      run([{ type: 'edit', value: 'a' }, { type: 'submit' }, { type: 'failed', message: 'x' }, { type: 'submit' }]),
    ];
    for (const state of states) {
      expectTrue(!(state.submitting && state.error !== null));
    }
  },
  { concept: 'react.state.reducer' },
);
