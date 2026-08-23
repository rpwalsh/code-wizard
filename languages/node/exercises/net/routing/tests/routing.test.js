// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { createRouter } from '../main.js';

const router = createRouter([
  { method: 'GET', pattern: '/users', name: 'listUsers' },
  { method: 'POST', pattern: '/users', name: 'createUser' },
  { method: 'GET', pattern: '/users/:id', name: 'showUser' },
  { method: 'GET', pattern: '/users/me', name: 'showSelf' },
  { method: 'GET', pattern: '/users/:id/posts/:postId', name: 'showPost' },
]);

test(
  'a literal path finds its handler',
  () => {
    expectEqual(router.route('GET', '/users'), { status: 200, name: 'listUsers', params: {} });
  },
  { concept: 'node.net.routing' },
);

test(
  'the method selects between handlers on one path',
  () => {
    expectEqual(router.route('POST', '/users').name, 'createUser');
  },
  { concept: 'node.net.routing' },
);

test(
  'a parameter is captured by name',
  () => {
    expectEqual(router.route('GET', '/users/42'), {
      status: 200,
      name: 'showUser',
      params: { id: '42' },
    });
  },
  { concept: 'node.net.routing' },
);

test(
  'several parameters are captured at once',
  () => {
    expectEqual(router.route('GET', '/users/42/posts/7').params, { id: '42', postId: '7' });
  },
  { concept: 'node.net.routing' },
);

test(
  'a path nobody registered is 404',
  () => {
    expectEqual(router.route('GET', '/nope'), { status: 404 });
  },
  { concept: 'node.net.routing' },
);
