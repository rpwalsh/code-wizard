// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Emptiness, ties and duplicates. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { byKey, longest, pluck } from '../main.ts';

test(
  'an empty list has no longest',
  () => {
    expectEqual(longest([]), undefined);
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'a tie keeps the first',
  () => {
    // "The longest" is ambiguous until this is stated, so it is stated.
    expectEqual(longest(['ab', 'cd']), 'ab');
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'plucking from nothing gives nothing',
  () => {
    expectEqual(pluck([], 'anything' as never), []);
  },
  { concept: 'typescript.generics.inference' },
);

test(
  'the last duplicate wins',
  () => {
    const rows = [
      { id: 'a', value: 1 },
      { id: 'a', value: 2 },
    ];
    expectEqual(byKey(rows, 'id').get('a')?.value, 2);
  },
  { concept: 'typescript.generics.functions' },
);

test(
  'an empty string is a legitimate longest',
  () => {
    // Zero length is still a length. An implementation seeded with a falsy
    // check rather than `undefined` returns nothing here.
    expectEqual(longest(['']), '');
  },
  { concept: 'typescript.generics.constraints' },
);
