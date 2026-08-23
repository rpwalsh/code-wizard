// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary boundary crossings. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { assertPresent, errorMessage, tryParse, tryRun } from '../main.ts';

test(
  'errors, strings and numbers all become messages',
  () => {
    expectEqual(errorMessage(new Error('boom')), 'boom');
    expectEqual(errorMessage(new RangeError('range')), 'range');
    expectEqual(errorMessage('just text'), 'just text');
    expectEqual(errorMessage(42), '42');
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'good numbers parse, garbage does not',
  () => {
    expectEqual(tryParse('42'), { ok: true, value: 42 });
    expectEqual(tryParse(' 3.5 '), { ok: true, value: 3.5 });
    expectEqual(tryParse('abc').ok, false);
  },
  { concept: 'typescript.boundaries.errors' },
);

test(
  'tryRun captures success and failure as data',
  () => {
    expectEqual(tryRun(() => 2 + 2), { ok: true, value: 4 });

    const failed = tryRun<number>(() => {
      throw new Error('exploded');
    });
    expectEqual(failed, { ok: false, error: 'exploded' });
  },
  { concept: 'typescript.boundaries.errors' },
);

test(
  'assertPresent lets checked values through',
  () => {
    const maybe: string | null = 'here' as string | null;
    assertPresent(maybe, 'value');
    // After the assertion the compiler knows maybe is string.
    expectEqual(maybe.toUpperCase(), 'HERE');
  },
  { concept: 'typescript.boundaries.assertions' },
);

test(
  'assertPresent throws with the name in the message',
  () => {
    let caught: Error | null = null;
    try {
      assertPresent(null, 'database url');
    } catch (error) {
      caught = error as Error;
    }
    expectTrue(caught !== null && caught.message.includes('database url'));
  },
  { concept: 'typescript.boundaries.assertions' },
);
