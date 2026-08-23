// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: a chain that holds, and three ways to wait. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { firstSuccess, rootCause, settle, wrap } from '../main.js';

test(
  'a wrapped error keeps its message, its code and its cause',
  () => {
    const original = new Error('ECONNREFUSED 10.0.0.4:5432');
    const wrapped = wrap(original, 'could not load the customer', 'DB_UNAVAILABLE');

    expectEqual(wrapped.message, 'could not load the customer');
    expectEqual(wrapped.code, 'DB_UNAVAILABLE');
    // The point of the whole exercise: the original is still reachable.
    expectEqual(wrapped.cause, original);
  },
  { concept: 'node.failure.errors' },
);

test(
  'rootCause walks a chain back to what actually happened',
  () => {
    const socket = new Error('ECONNREFUSED 10.0.0.4:5432');
    const database = wrap(socket, 'query failed', 'DB_UNAVAILABLE');
    const service = wrap(database, 'could not load the customer', 'CUSTOMER_LOAD');
    const handler = wrap(service, 'request failed', 'INTERNAL');

    // Four layers deep, and the connection refusal is still findable.
    expectEqual(rootCause(handler).message, 'ECONNREFUSED 10.0.0.4:5432');
  },
  { concept: 'node.failure.errors' },
);

test(
  'an error with no cause is its own root',
  () => {
    const lonely = new Error('nothing wrapped this');
    expectEqual(rootCause(lonely), lonely);
  },
  { concept: 'node.failure.errors' },
);

test(
  'settle reports every task, successes and failures alike',
  async () => {
    const { values, failures } = await settle([
      async () => 'orders: ok',
      async () => {
        throw new Error('billing: timed out');
      },
      async () => 'shipping: ok',
    ]);

    // The failure in the middle did not stop the report on the other two,
    // which is exactly what Promise.all would have done.
    expectEqual(values, ['orders: ok', 'shipping: ok']);
    expectEqual(failures, ['billing: timed out']);
  },
  { concept: 'node.failure.async' },
);

test(
  'firstSuccess takes whichever mirror answers',
  async () => {
    const value = await firstSuccess([
      async () => {
        throw new Error('mirror one is down');
      },
      async () => 'the file',
      async () => {
        throw new Error('mirror three is down');
      },
    ]);

    expectEqual(value, 'the file');
  },
  { concept: 'node.failure.async' },
);

test(
  'firstSuccess reports every reason when nothing succeeds',
  async () => {
    let message = '';
    try {
      await firstSuccess([
        async () => {
          throw new Error('mirror one is down');
        },
        async () => {
          throw new Error('mirror two is down');
        },
      ]);
    } catch (error) {
      message = error.message;
    }

    // Both reasons, in the order the tasks were given. An AggregateError's
    // own message says nothing, and this is the smallest honest thing to
    // do with the errors it carries.
    expectEqual(message, 'mirror one is down; mirror two is down');
    expectTrue(message.includes('mirror two'));
  },
  { concept: 'node.failure.async' },
);
