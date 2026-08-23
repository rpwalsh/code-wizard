// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { byKey, longest, pluck } from '../main.ts';

const people = [
  { id: 'a', name: 'Ada', age: 36 },
  { id: 'b', name: 'Grace', age: 45 },
];

test(
  'finds the longest string',
  () => {
    expectEqual(longest(['ab', 'abcd', 'a']), 'abcd');
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'works on arrays too',
  () => {
    expectEqual(longest([[1], [1, 2, 3], []]), [1, 2, 3]);
  },
  { concept: 'typescript.generics.constraints' },
);

test(
  'plucks one property from each item',
  () => {
    expectEqual(pluck(people, 'name'), ['Ada', 'Grace']);
    expectEqual(pluck(people, 'age'), [36, 45]);
  },
  { concept: 'typescript.generics.inference' },
);

test(
  'indexes by a key',
  () => {
    const index = byKey(people, 'id');
    expectEqual(index.size, 2);
    expectEqual(index.get('b')?.name, 'Grace');
  },
  { concept: 'typescript.generics.functions' },
);
