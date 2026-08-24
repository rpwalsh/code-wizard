// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-wizard/exercises';
import { braceFamilyOperators, swapOperator } from '@code-wizard/exercises';

const dialect: Dialect = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', '`', "'"],
  multilineQuotes: ['`'],
};

/**
 * The mistakes Go programmers make.
 *
 * `err != nil` becoming `err == nil` is the one that matters most: it is the
 * single most-written line in the language, and inverting it turns the error
 * path into the happy path silently. Raw strings use backticks and may cross
 * lines, so the scanner is told.
 */
export const goMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('error-check', dialect, [['err != nil', 'err == nil']], { symmetric: false }),
]);
