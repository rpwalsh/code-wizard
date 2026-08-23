// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Short-circuits, slashes, and encoded parameters. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import {
  matchRoute,
  navigate,
  runGuards,
  type GuardFn,
  type Route,
} from '../main.ts';

const session = { user: 'ada', roles: [] } as const;

test(
  'guards after the first refusal never run',
  () => {
    const calls: string[] = [];
    const failing: GuardFn = () => {
      calls.push('first');
      return false;
    };
    const afterward: GuardFn = () => {
      calls.push('second');
      return true;
    };

    const verdict = runGuards([failing, afterward], { params: {}, session });
    expectEqual(verdict, false);
    expectEqual(calls, ['first']);
  },
  { concept: 'angular.routing.guards' },
);

test(
  'an empty guard list passes',
  () => {
    expectEqual(runGuards([], { params: {}, session }), true);
  },
  { concept: 'angular.routing.guards' },
);

test(
  'a redirect from the first guard is the verdict',
  () => {
    const bounce: GuardFn = () => ({ redirectTo: '/elsewhere' });
    const never: GuardFn = () => {
      throw new Error('must not run');
    };
    expectEqual(runGuards([bounce, never], { params: {}, session }), {
      redirectTo: '/elsewhere',
    });
  },
  { concept: 'angular.routing.guards' },
);

test(
  'trailing slashes do not change the route',
  () => {
    const routes: Route[] = [{ path: '/about', name: 'about' }];
    expectEqual(matchRoute(routes, '/about/')?.name, 'about');
  },
  { concept: 'angular.routing.routes' },
);

test(
  'parameters arrive decoded',
  () => {
    const routes: Route[] = [{ path: '/tags/:tag', name: 'tag' }];
    expectEqual(matchRoute(routes, '/tags/c%2B%2B')?.params, { tag: 'c++' });
  },
  { concept: 'angular.routing.routes' },
);

test(
  'a longer path does not match a shorter pattern',
  () => {
    const routes: Route[] = [{ path: '/a', name: 'a' }];
    expectEqual(navigate(routes, '/a/b', session), { status: 'not-found' });
  },
  { concept: 'angular.routing.routes' },
);
