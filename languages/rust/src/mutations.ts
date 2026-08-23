// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-retrainer/exercises';
import { braceFamilyOperators, swapOperator } from '@code-retrainer/exercises';

const dialect: Dialect = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', "'"],
  // &'a str is a lifetime, not an unterminated literal — mistaking one for
  // the other hides the rest of the line and silently drops mutants.
  singleQuoteIsCharLiteral: true,
};

/**
 * The mistakes Rust programmers make.
 *
 * Not memory bugs — the compiler took those. What is left is logic: an
 * `unwrap_or` default that swallows the error case, `is_some` for `is_none`,
 * and `?` propagation replaced by an unwrap that panics instead of returning.
 */
export const rustMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('option', dialect, [['is_some()', 'is_none()']], { symmetric: false }),
  swapOperator('saturating', dialect, [['saturating_add', 'wrapping_add']], { symmetric: false }),
]);
