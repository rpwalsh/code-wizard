// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The things people actually throw. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { errorMessage, tryParse, tryRun } from '../main.ts';

test(
  'thrown null and undefined become the honest fallback',
  () => {
    expectEqual(errorMessage(null), 'unknown error');
    expectEqual(errorMessage(undefined), 'unknown error');
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'a bare object does not print as [object Object]',
  () => {
    expectEqual(errorMessage({}), 'unknown error');
    expectEqual(errorMessage({ code: 500 }), 'unknown error');
  },
  { concept: 'typescript.boundaries.unknown' },
);

test(
  'tryRun survives a thrown string',
  () => {
    const failed = tryRun<never>(() => {
      // Legal, regrettable, and exactly why catch variables are unknown.
      throw 'oops';
    });
    expectEqual(failed, { ok: false, error: 'oops' });
  },
  { concept: 'typescript.boundaries.errors' },
);

test(
  'empty and whitespace strings are not zero',
  () => {
    // Number('') is 0 — the trap tryParse must not fall into.
    expectEqual(tryParse('').ok, false);
    expectEqual(tryParse('   ').ok, false);
  },
  { concept: 'typescript.boundaries.errors' },);

test(
  'Infinity is not a parse',
  () => {
    expectEqual(tryParse('Infinity').ok, false);
  },
  { concept: 'typescript.boundaries.errors' },
);

test(
  'zero parses — falsy is not failure',
  () => {
    expectEqual(tryParse('0'), { ok: true, value: 0 });
  },
  { concept: 'typescript.boundaries.errors' },
);
