// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-retrainer/exercises';
import { braceFamilyOperators, swapOperator } from '@code-retrainer/exercises';

const dialect: Dialect = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', "'"],
  // `#include <stdio.h>` carries angle brackets that are not comparisons.
  directivePrefixes: ['#'],
};

/**
 * The mistakes C programmers make.
 *
 * Beyond the shared family: `&&` for `&` is C's own — the bitwise operator
 * compiles anywhere the logical one does, evaluates both sides, and produces
 * a different answer only for some inputs. `NULL` for a pointer that was
 * checked is the other: it turns a guarded path into the unguarded one.
 */
export const cMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('bitwise', dialect, [
    ['&&', '&'],
    ['||', '|'],
  ], { symmetric: false }),
]);
