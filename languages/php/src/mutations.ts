// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-wizard/exercises';
import { braceFamilyOperators, swapOperator } from '@code-wizard/exercises';

const dialect: Dialect = {
  lineComments: ['//', '#'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', "'"],
};

/**
 * The mistakes PHP programmers make.
 *
 * Note what is absent: `&&` for `and`. They differ only in precedence
 * against assignment, so inside a condition the swap changes nothing — an
 * operator whose mutants are always equivalent reports holes that are not
 * there, which is worse than not testing for them at all.
 *
 * `===` for `==` leads this list by a distance: PHP's loose comparison has
 * its own table of surprises, and the strict form is the one that behaves as
 * written. `??` for `?:` is the second — the null-coalescing operator keeps a
 * legitimate `0` or `''` that the ternary shorthand discards.
 */
export const phpMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('strictness', dialect, [
    ['===', '=='],
    ['!==', '!='],
  ], { symmetric: false }),
  swapOperator('nullish', dialect, [['??', '?:']], { symmetric: false }),
]);
