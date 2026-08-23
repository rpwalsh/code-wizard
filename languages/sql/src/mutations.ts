// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Dialect, MutationOperator } from '@code-retrainer/exercises';
import { rewriteOperator, swapOperator } from '@code-retrainer/exercises';

const dialect: Dialect = {
  lineComments: ['--'],
  blockComment: ['/*', '*/'] as const,
  // One quote character, and it is the string one: SQL has no char literal.
  stringQuotes: ["'"],
};

/**
 * The mistakes SQL writers make.
 *
 * Nothing about memory or control flow — SQL has neither. What goes wrong is
 * set logic: AND for OR, an inner join where an outer one was meant, a
 * boundary that should have been inclusive, and NULL comparisons written with
 * `=` where only `IS` can work. Keywords match in any casing, because SQL is
 * written in every casing.
 */
export const sqlMutationOperators: readonly MutationOperator[] = Object.freeze([
  swapOperator('logical', dialect, [['AND', 'OR']], { boundary: true, ignoreCase: true }),
  swapOperator('join', dialect, [['LEFT JOIN', 'INNER JOIN']], {
    ignoreCase: true,
    symmetric: false,
  }),
  swapOperator('comparison', dialect, [
    ['>=', '>'],
    ['<=', '<'],
    ['=', '!='],
  ]),
  swapOperator('null-test', dialect, [['IS NULL', 'IS NOT NULL']], { ignoreCase: true }),
  swapOperator('ordering', dialect, [['DESC', 'ASC']], { boundary: true, ignoreCase: true }),
  swapOperator('distinctness', dialect, [['UNION ALL', 'UNION']], {
    ignoreCase: true,
    symmetric: false,
  }),
  rewriteOperator('off-by-one', dialect, /\b\d+\b/g, (match) => {
    const bumped = String(Number(match[0]) + 1);
    return { text: bumped, description: `\`${match[0]}\` became \`${bumped}\`` };
  }),
]);
