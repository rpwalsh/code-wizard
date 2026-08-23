// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The pipeline, stage by stage. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { matchRoute, navigate, requireRole, requireUser, type Route } from '../main.ts';

const anonymous = { user: null, roles: [] } as const;
const ada = { user: 'ada', roles: ['admin'] } as const;
const bo = { user: 'bo', roles: [] } as const;

const routes: Route[] = [
  { path: '/', name: 'home' },
  { path: '/users/new', name: 'newUser', guards: [requireUser, requireRole('admin')] },
  { path: '/users/:id', name: 'showUser', guards: [requireUser] },
];

test(
  'paths match with parameters',
  () => {
    expectEqual(matchRoute(routes, '/users/42'), { name: 'showUser', params: { id: '42' } });
    expectEqual(matchRoute(routes, '/'), { name: 'home', params: {} });
    expectEqual(matchRoute(routes, '/nowhere'), null);
  },
  { concept: 'angular.routing.routes' },
);

test(
  'earlier routes win, which is why /users/new is listed first',
  () => {
    expectEqual(matchRoute(routes, '/users/new')?.name, 'newUser');
  },
  { concept: 'angular.routing.routes' },
);

test(
  'a signed-in user activates a guarded route',
  () => {
    expectEqual(navigate(routes, '/users/7', ada), {
      status: 'activated',
      name: 'showUser',
      params: { id: '7' },
    });
  },
  { concept: 'angular.routing.guards' },
);

test(
  'an anonymous user is redirected to login',
  () => {
    expectEqual(navigate(routes, '/users/7', anonymous), { status: 'redirected', to: '/login' });
  },
  { concept: 'angular.routing.guards' },
);

test(
  'a known user without the role is blocked, not bounced',
  () => {
    expectEqual(navigate(routes, '/users/new', bo), { status: 'blocked' });
    expectEqual(navigate(routes, '/users/new', ada).status, 'activated');
  },
  { concept: 'angular.routing.guards' },
);
