// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The typed surface, working. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { getUser, isVendorUser, planLabel, recentEvents } from '../main.ts';

test(
  'a well-shaped user comes through typed',
  () => {
    const user = getUser(1);
    expectEqual(user, { id: 1, login: 'ada', plan: 'pro' });
    expectEqual(planLabel(user), 'Pro plan');
  },
  { concept: 'typescript.config.declaration' },
);

test(
  'the guard accepts the declared shape and only it',
  () => {
    expectTrue(isVendorUser({ id: 2, login: 'bo', plan: 'free' }));
    expectEqual(isVendorUser({ id: 2, login: 'bo', plan: 'legacy-gold' }), false);
    expectEqual(isVendorUser({ id: '2', login: 'bo', plan: 'free' }), false);
    expectEqual(isVendorUser(null), false);
  },
  { concept: 'typescript.config.declaration' },
);

test(
  'events arrive validated and filtered by time',
  () => {
    const events = recentEvents('2026-08-21T00:00:00Z');
    expectEqual(events.map((event) => event.kind), ['upgrade', 'logout']);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'both plans label',
  () => {
    expectEqual(planLabel({ id: 9, login: 'x', plan: 'free' }), 'Free plan');
  },
  { concept: 'typescript.config.declaration' },
);
