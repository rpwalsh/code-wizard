// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-retrainer/exercises';
import { braceFamilyOperators, swapOperator } from '@code-retrainer/exercises';

const dialect: Dialect = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', "'"],
};

/**
 * The mistakes C++ programmers make.
 *
 * The shared family, plus two of this language's own: `.at()` for `[]`
 * reversed — dropping the bounds check — and a `const` removed from a
 * reference parameter, which is how an accidental copy or an accidental
 * mutation gets in.
 */
export const cppMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('bounds', dialect, [['.at(', '[']], { symmetric: false }),
  swapOperator('bitwise', dialect, [
    ['&&', '&'],
    ['||', '|'],
  ], { symmetric: false }),
]);
