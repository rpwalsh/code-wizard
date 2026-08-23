// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The 405 case, which is the one hand-rolled routers get wrong. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { createRouter } from '../main.js';

const router = createRouter([
  { method: 'GET', pattern: '/users', name: 'listUsers' },
  { method: 'POST', pattern: '/users', name: 'createUser' },
  { method: 'DELETE', pattern: '/users/:id', name: 'deleteUser' },
]);

test(
  'a real path with the wrong method is 405, not 404',
  () => {
    expectEqual(router.route('PUT', '/users'), { status: 405, allow: ['GET', 'POST'] });
  },
  { concept: 'node.failure.errors' },
);

test(
  'the allow list is sorted and free of duplicates',
  () => {
    expectEqual(router.route('PATCH', '/users').allow, ['GET', 'POST']);
  },
  { concept: 'node.failure.errors' },
);

test(
  'a parameterized path reports its own allowed methods',
  () => {
    expectEqual(router.route('GET', '/users/9'), { status: 405, allow: ['DELETE'] });
  },
  { concept: 'node.failure.errors' },
);

test(
  'an unrouted path is still 404 for any method',
  () => {
    expectEqual(router.route('GET', '/orders'), { status: 404 });
    expectEqual(router.route('POST', '/orders'), { status: 404 });
  },
  { concept: 'node.failure.errors' },
);

test(
  'an empty router refuses everything with 404',
  () => {
    expectEqual(createRouter([]).route('GET', '/anything'), { status: 404 });
  },
  { concept: 'node.failure.errors' },
);
