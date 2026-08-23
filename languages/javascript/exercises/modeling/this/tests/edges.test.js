// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Detachment, shared prototypes, and the accessor that is not a method. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { Timer, methodsOf, ownedBy } from '../main.js';

test(
  'a bare detached method loses its this',
  () => {
    const timer = new Timer();
    const detached = timer.tick;

    // Class bodies are strict, so this is undefined rather than the global.
    let caught = null;
    try {
      detached();
    } catch (error) {
      caught = error;
    }
    expectTrue(caught instanceof TypeError);
  },
  { concept: 'javascript.functions.this' },
);

test(
  'two timers share one tick function',
  () => {
    const first = new Timer();
    const second = new Timer();
    expectTrue(Object.getPrototypeOf(first).tick === Object.getPrototypeOf(second).tick);
    expectTrue(first.tick === second.tick);
  },
  { concept: 'javascript.modeling.prototypes' },
);

test(
  'the getter is not listed as a method',
  () => {
    // elapsed is an accessor; the descriptor knows even though a read looks
    // identical to a data property.
    expectTrue(!methodsOf(new Timer()).includes('elapsed'));
  },
  { concept: 'javascript.modeling.prototypes' },
);

test(
  'tickers from different timers stay separate',
  () => {
    const first = new Timer();
    const second = new Timer(100);
    const tickFirst = first.makeTicker();
    const tickSecond = second.makeTicker();

    tickFirst();
    tickSecond();
    tickSecond();

    expectEqual(first.elapsed, 1);
    expectEqual(second.elapsed, 102);
  },
  { concept: 'javascript.functions.this' },
);

test(
  'the ticker returns what tick returns',
  () => {
    const timer = new Timer();
    const tickIt = timer.makeTicker();
    expectEqual(tickIt(), 1);
  },
  { concept: 'javascript.functions.this' },
);
