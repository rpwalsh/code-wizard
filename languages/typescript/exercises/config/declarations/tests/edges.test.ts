// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The vendor's lies, caught at the boundary. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { getUser, isVendorEvent, recentEvents } from '../main.ts';

test(
  'a lying vendor is a loud contract violation',
  () => {
    // User 3 has plan 'legacy-gold' — a value the declaration never met.
    // Without the guard this type-checks perfectly and breaks downstream.
    let caught: Error | null = null;
    try {
      getUser(3);
    } catch (error) {
      caught = error as Error;
    }
    expectTrue(caught !== null && caught.message.includes('user'));
  },
  { concept: 'typescript.config.declaration' },
);

test(
  'a missing user is a contract violation too',
  () => {
    let threw = false;
    try {
      getUser(999);
    } catch {
      threw = true;
    }
    expectTrue(threw);
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'malformed events are dropped, not thrown',
  () => {
    const all = recentEvents('2026-01-01T00:00:00Z');
    // Five in the feed; the numeric payload and the missing timestamp
    // fall out, and the feed still delivers.
    expectEqual(all.length, 3);
    expectTrue(all.every((event) => typeof event.at === 'string'));
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'the event guard checks payload values deeply',
  () => {
    expectEqual(
      isVendorEvent({ kind: 'x', at: '2026-01-01', payload: { n: 1 } }),
      false,
    );
    expectTrue(isVendorEvent({ kind: 'x', at: '2026-01-01', payload: {} }));
  },
  { concept: 'typescript.boundaries.validation' },
);

test(
  'since is inclusive by string comparison',
  () => {
    const events = recentEvents('2026-08-23T18:12:00Z');
    expectEqual(events.map((event) => event.kind), ['logout']);
  },
  { concept: 'typescript.boundaries.validation' },
);
