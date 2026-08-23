// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { makeCounter, memoize, once } from '../main.js';

test(
  'a counter counts from its start',
  () => {
    const counter = makeCounter(10);
    expectEqual(counter.next(), 10);
    expectEqual(counter.next(), 11);
    expectEqual(counter.peek(), 12);
    expectEqual(counter.next(), 12);
  },
  { concept: 'javascript.functions.closures' },
);

test(
  'the default start is zero',
  () => {
    expectEqual(makeCounter().next(), 0);
  },
  { concept: 'javascript.functions.declaration' },
);

test(
  'once calls the function a single time',
  () => {
    let calls = 0;
    const setUp = once(() => {
      calls += 1;
      return 'ready';
    });

    expectEqual(setUp(), 'ready');
    expectEqual(setUp(), 'ready');
    expectEqual(setUp(), 'ready');
    expectEqual(calls, 1);
  },
  { concept: 'javascript.functions.higher-order' },
);

test(
  'memoize runs once per distinct argument',
  () => {
    let calls = 0;
    const double = memoize((n) => {
      calls += 1;
      return n * 2;
    });

    expectEqual(double(3), 6);
    expectEqual(double(3), 6);
    expectEqual(double(4), 8);
    expectEqual(calls, 2);
  },
  { concept: 'javascript.functions.closures' },
);
