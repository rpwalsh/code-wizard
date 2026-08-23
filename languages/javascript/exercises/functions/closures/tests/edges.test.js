// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Independence, identity and the cases a sloppy cache gets wrong. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { makeCounter, memoize, once } from '../main.js';

test(
  'two counters never share state',
  () => {
    const first = makeCounter();
    const second = makeCounter();
    first.next();
    first.next();
    expectEqual(second.peek(), 0);
  },
  { concept: 'javascript.functions.closures' },
);

test(
  'once keeps the first answer even when later calls differ',
  () => {
    const pick = once((value) => value);
    expectEqual(pick('first'), 'first');
    expectEqual(pick('second'), 'first');
  },
  { concept: 'javascript.functions.higher-order' },
);

test(
  'a number and its string are different cache keys',
  () => {
    // An object-keyed cache coerces both to '1' and collides.
    const typeOf = memoize((value) => typeof value);
    expectEqual(typeOf(1), 'number');
    expectEqual(typeOf('1'), 'string');
  },
  { concept: 'javascript.functions.higher-order' },
);

test(
  'a cached undefined does not re-run the function',
  () => {
    let calls = 0;
    const nothing = memoize(() => {
      calls += 1;
      return undefined;
    });

    nothing('a');
    nothing('a');
    // A truthiness-based cache would re-run forever for this input.
    expectEqual(calls, 1);
  },
  { concept: 'javascript.functions.closures' },
);
