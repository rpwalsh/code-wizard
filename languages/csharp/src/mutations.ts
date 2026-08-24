// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-wizard/exercises';
import { braceFamilyOperators, swapOperator } from '@code-wizard/exercises';

const dialect: Dialect = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'] as const,
  stringQuotes: ['"', "'"],
};

/**
 * The mistakes C# programmers make.
 *
 * `??` for `||` is the null-coalescing slip that turns a legitimate `false`
 * into a default. `is not null` losing its `not` is the other: a guard that
 * reads as a check and behaves as its opposite.
 */
export const csharpMutationOperators: readonly MutationOperator[] = Object.freeze([
  ...braceFamilyOperators(dialect),
  swapOperator('nullish', dialect, [['??', '||']], { symmetric: false }),
  swapOperator('null-check', dialect, [['is not null', 'is null']], { symmetric: false }),
]);
