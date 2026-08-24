// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: the state machine, the deps and the backoff. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { fetchReducer, initialState, selectRetryDelay, shouldRefetch } from '../main.js';

test(
  'a fresh hook is idle with nothing in it',
  () => {
    expectEqual(initialState<string>(), { status: 'idle', data: null, error: null });
  },
  { concept: 'react.hooks.custom' },
);

test(
  'starting moves to loading',
  () => {
    const next = fetchReducer(initialState<string>(), { type: 'start' }, 1);
    expectEqual(next.status, 'loading');
    expectEqual(next.error, null);
  },
  { concept: 'react.hooks.custom' },
);

test(
  'resolving stores the data and clears the error',
  () => {
    const loading = fetchReducer(initialState<string>(), { type: 'start' }, 1);
    const next = fetchReducer(loading, { type: 'resolved', data: 'value', requestId: 1 }, 1);

    expectEqual(next.status, 'ready');
    expectEqual(next.data, 'value');
    expectEqual(next.error, null);
  },
  { concept: 'react.hooks.custom' },
);

test(
  'rejecting records the message',
  () => {
    const loading = fetchReducer(initialState<string>(), { type: 'start' }, 1);
    const next = fetchReducer(loading, { type: 'rejected', error: 'offline', requestId: 1 }, 1);

    expectEqual(next.status, 'failed');
    expectEqual(next.error, 'offline');
  },
  { concept: 'react.hooks.custom' },
);

test(
  'identical dependencies do not refetch',
  () => {
    expectEqual(shouldRefetch(['a', 'b'], ['a', 'b']), false);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'a changed dependency refetches',
  () => {
    expectEqual(shouldRefetch(['a', 'b'], ['a', 'c']), true);
    expectEqual(shouldRefetch(['a'], ['a', 'b']), true);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'the retry delay doubles',
  () => {
    expectEqual(selectRetryDelay(1, 100, 10_000), 100);
    expectEqual(selectRetryDelay(2, 100, 10_000), 200);
    expectEqual(selectRetryDelay(3, 100, 10_000), 400);
  },
  { concept: 'react.hooks.custom' },
);
