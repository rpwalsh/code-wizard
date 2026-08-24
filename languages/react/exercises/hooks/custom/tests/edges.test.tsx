// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: the stale answer, the kept data, the capped delay. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { fetchReducer, initialState, selectRetryDelay, shouldRefetch } from '../main.js';

test(
  'an answer to a superseded request is ignored',
  () => {
    // Request 1 went out, the dependencies changed, request 2 went out, and
    // now request 1 finally answers. Applying it shows the user data for a
    // query they have already moved on from.
    const loading = fetchReducer(initialState<string>(), { type: 'start' }, 2);
    const next = fetchReducer(loading, { type: 'resolved', data: 'stale', requestId: 1 }, 2);

    expectTrue(next === loading);
    expectEqual(next.status, 'loading');
  },
  { concept: 'react.hooks.custom' },
);

test(
  'a failure from a superseded request is ignored too',
  () => {
    // The half everybody forgets: an old request failing must not put the
    // screen into an error state for a query that is still in flight.
    const loading = fetchReducer(initialState<string>(), { type: 'start' }, 2);
    const next = fetchReducer(loading, { type: 'rejected', error: 'old', requestId: 1 }, 2);

    expectEqual(next.status, 'loading');
    expectEqual(next.error, null);
  },
  { concept: 'react.hooks.custom' },
);

test(
  'reloading keeps the data already on screen',
  () => {
    const ready = fetchReducer(
      fetchReducer(initialState<string>(), { type: 'start' }, 1),
      { type: 'resolved', data: 'first', requestId: 1 },
      1,
    );
    const reloading = fetchReducer(ready, { type: 'start' }, 2);

    // Blanking here is the flicker every list has on refresh.
    expectEqual(reloading.status, 'loading');
    expectEqual(reloading.data, 'first');
  },
  { concept: 'react.hooks.custom' },
);

test(
  'a failure keeps the last good data',
  () => {
    const ready = fetchReducer(
      fetchReducer(initialState<string>(), { type: 'start' }, 1),
      { type: 'resolved', data: 'first', requestId: 1 },
      1,
    );
    const failed = fetchReducer(ready, { type: 'rejected', error: 'offline', requestId: 1 }, 1);

    expectEqual(failed.data, 'first');
    expectEqual(failed.error, 'offline');
  },
  { concept: 'react.hooks.custom' },
);

test(
  'empty dependency arrays match each other',
  () => {
    expectEqual(shouldRefetch([], []), false);
    expectEqual(shouldRefetch([], ['a']), true);
    expectEqual(shouldRefetch(['a'], []), true);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'order in the dependency array is significant',
  () => {
    // Positional, like React's own comparison. Two arrays with the same
    // members in another order are a different dependency list.
    expectEqual(shouldRefetch(['a', 'b'], ['b', 'a']), true);
  },
  { concept: 'react.effects.dependencies' },
);

test(
  'the delay is capped rather than growing forever',
  () => {
    // Uncapped, the eighth attempt waits hours, which a user cannot tell
    // apart from the app having given up.
    expectEqual(selectRetryDelay(10, 100, 5_000), 5_000);
    expectEqual(selectRetryDelay(50, 100, 5_000), 5_000);
  },
  { concept: 'react.hooks.custom' },
);

test(
  'the first attempt is not a retry',
  () => {
    expectEqual(selectRetryDelay(0, 100, 5_000), 0);
    expectEqual(selectRetryDelay(-1, 100, 5_000), 0);
  },
  { concept: 'react.hooks.custom' },
);
