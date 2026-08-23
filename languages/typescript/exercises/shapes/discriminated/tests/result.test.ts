// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, parseAge, unwrapOr } from '../main.ts';

test(
  'a valid age succeeds',
  () => {
    const result = parseAge('42');
    expectEqual(result.ok, true);
    expectEqual(unwrapOr(result, -1), 42);
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'a failure carries its reason',
  () => {
    const result = parseAge('abc');
    expectEqual(result.ok, false);
    expectEqual(describe(result), 'failed: not a number');
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'the fallback is used only on failure',
  () => {
    expectEqual(unwrapOr(parseAge('7'), -1), 7);
    expectEqual(unwrapOr(parseAge('nope'), -1), -1);
  },
  { concept: 'typescript.basics.narrowing' },
);

test(
  'describe renders a success',
  () => {
    expectEqual(describe(parseAge('30')), 'age 30');
  },
  { concept: 'typescript.shapes.exhaustive' },
);
