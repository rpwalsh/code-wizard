// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Slashes, encoding, and specificity. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { createRouter } from '../main.js';

const router = createRouter([
  { method: 'GET', pattern: '/', name: 'home' },
  { method: 'GET', pattern: '/users', name: 'listUsers' },
  { method: 'GET', pattern: '/users/:id', name: 'showUser' },
  { method: 'GET', pattern: '/users/me', name: 'showSelf' },
]);

test(
  'a trailing slash does not change the path',
  () => {
    expectEqual(router.route('GET', '/users/').name, 'listUsers');
  },
  { concept: 'node.net.validation' },
);

test(
  'the root path still routes',
  () => {
    expectEqual(router.route('GET', '/').name, 'home');
  },
  { concept: 'node.net.validation' },
);

test(
  'the more specific pattern wins whatever the order',
  () => {
    // /users/me was registered after /users/:id and still beats it.
    expectEqual(router.route('GET', '/users/me').name, 'showSelf');
    expectEqual(router.route('GET', '/users/other').name, 'showUser');
  },
  { concept: 'node.net.routing' },
);

test(
  'a percent-encoded parameter arrives decoded',
  () => {
    expectEqual(router.route('GET', '/users/ada%20lovelace').params, { id: 'ada lovelace' });
  },
  { concept: 'node.net.validation' },
);

test(
  'a longer path does not match a shorter pattern',
  () => {
    expectEqual(router.route('GET', '/users/1/extra'), { status: 404 });
  },
  { concept: 'node.net.validation' },
);
