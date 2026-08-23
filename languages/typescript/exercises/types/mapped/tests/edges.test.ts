// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners the naive versions get wrong. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { makeSetters, pickFields } from '../main.ts';
import type { Locked, Unwrapped } from '../main.ts';

test(
  'Locked survives assignment as readonly',
  () => {
    const locked: Locked<{ n: number }> = { n: 1 };
    // locked.n = 2 would be the compile error that proves the type; here we
    // prove the value still reads.
    expectEqual(locked.n, 1);
  },
  { concept: 'typescript.types.mapped' },
);

test(
  'Unwrapped leaves non-promises alone, arrays included',
  () => {
    const list: Unwrapped<number[]> = [1, 2];
    expectEqual(list, [1, 2]);
  },
  { concept: 'typescript.types.conditional' },
);

test(
  'pickFields with no keys is an empty object',
  () => {
    expectEqual(pickFields({ a: 1, b: 2 }, []), {});
  },
  { concept: 'typescript.types.utility' },
);

test(
  'pickFields copies rather than aliases',
  () => {
    const source = { a: 1, b: 2 };
    const picked = pickFields(source, ['a']);
    source.a = 99;
    expectEqual(picked.a, 1);
  },
  { concept: 'typescript.types.utility' },
);

test(
  'setters exist per key with capitalized names',
  () => {
    const setters = makeSetters({ theme: 'dark', fontSize: 14 });
    expectEqual(typeof setters.setTheme, 'function');
    expectEqual(typeof setters.setFontSize, 'function');
  },
  { concept: 'typescript.types.mapped' },
);
