// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { Timer, methodsOf, ownedBy } from '../main.js';

test(
  'a timer ticks from its start',
  () => {
    const timer = new Timer(10);
    expectEqual(timer.tick(), 11);
    expectEqual(timer.tick(), 12);
    expectEqual(timer.elapsed, 12);
  },
  { concept: 'javascript.modeling.classes' },
);

test(
  'reset returns to the start, not to zero',
  () => {
    const timer = new Timer(5);
    timer.tick();
    timer.reset();
    expectEqual(timer.elapsed, 5);
  },
  { concept: 'javascript.modeling.classes' },
);

test(
  'a ticker works detached from the timer',
  () => {
    const timer = new Timer();
    const tickIt = timer.makeTicker();

    // No receiver in sight — this is the callback case.
    tickIt();
    tickIt();
    expectEqual(timer.elapsed, 2);
  },
  { concept: 'javascript.functions.this' },
);

test(
  'methods live on the prototype, not the instance',
  () => {
    const timer = new Timer();
    expectEqual(ownedBy(timer), ['count', 'start']);
    expectEqual(methodsOf(timer), ['makeTicker', 'reset', 'tick']);
  },
  { concept: 'javascript.modeling.prototypes' },
);
