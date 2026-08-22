import type { MutationOperator } from '@code-retrainer/exercises';

/**
 * Small, plausible faults — the ones a JavaScript programmer actually makes.
 *
 * The operator set is not the Python one with different symbols. Two of these
 * exist only because of how this language fails: swapping `??` for `||`, which
 * is the single most common way a legitimate zero disappears, and swapping
 * `===` for `==`, which is invisible until the day the types differ.
 *
 * Nothing inside a string, a template literal or a comment is ever touched. A
 * mutated string produces a mutant no test can kill, and every one of them
 * shows up as a survivor — a report claiming holes that are not there.
 */

/**
 * Which characters of the source are code.
 *
 * One pass over the whole file, because template literals span lines and a
 * line-local scan cannot see them.
 */
function codeMask(source: string): boolean[] {
  const mask = new Array<boolean>(source.length).fill(true);
  let index = 0;

  const hide = (from: number, to: number): void => {
    for (let at = from; at < to && at < source.length; at += 1) mask[at] = false;
  };

  while (index < source.length) {
    const character = source[index]!;
    const pair = source.slice(index, index + 2);

    if (pair === '//') {
      const end = source.indexOf('\n', index);
      hide(index, end === -1 ? source.length : end);
      index = end === -1 ? source.length : end;
      continue;
    }

    if (pair === '/*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      hide(index, stop);
      index = stop;
      continue;
    }

    if (character !== '"' && character !== "'" && character !== '`') {
      index += 1;
      continue;
    }

    const quote = character;
    const start = index;
    index += 1;

    while (index < source.length) {
      if (source[index] === '\\') {
        index += 2;
        continue;
      }
      if (source[index] === quote) {
        index += 1;
        break;
      }
      // A single- or double-quoted string cannot cross a line; a template can.
      if (quote !== '`' && source[index] === '\n') break;
      index += 1;
    }

    hide(start, index);
  }

  return mask;
}

function isCode(mask: readonly boolean[], from: number, length: number): boolean {
  for (let at = from; at < from + length; at += 1) {
    if (mask[at] !== true) return false;
  }
  return true;
}

/** 1-indexed, so it matches what an editor shows. */
function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let at = 0; at < offset; at += 1) {
    if (source[at] === '\n') line += 1;
  }
  return line;
}

interface Change {
  line: number;
  description: string;
  source: string;
}

function swapOperator(
  name: string,
  pairs: readonly (readonly [string, string])[],
  options: { readonly boundary?: boolean; readonly symmetric?: boolean } = {},
): MutationOperator {
  const all =
    options.symmetric === false
      ? pairs
      : [...pairs, ...pairs.map(([from, to]) => [to, from] as const)];

  return {
    name,
    apply(source) {
      const mask = codeMask(source);
      const changes: Change[] = [];

      for (const [from, to] of all) {
        let at = source.indexOf(from);
        while (at !== -1) {
          const before = source[at - 1] ?? ' ';
          const after = source[at + from.length] ?? ' ';
          const wordBoundaryOk = !options.boundary || (!/\w/.test(before) && !/\w/.test(after));
          // `<` must not match inside `<=`, and `==` must not match inside `===`.
          const notPartOfLonger = !/[=<>&|?]/.test(after) || to.endsWith(after);
          const notPartOfEarlier = !/[=<>&|?!]/.test(before) || to.startsWith(before);

          if (
            wordBoundaryOk &&
            notPartOfLonger &&
            notPartOfEarlier &&
            isCode(mask, at, from.length)
          ) {
            changes.push({
              line: lineOf(source, at),
              description: `\`${from}\` became \`${to}\``,
              source: source.slice(0, at) + to + source.slice(at + from.length),
            });
          }
          at = source.indexOf(from, at + 1);
        }
      }

      return changes;
    },
  };
}

const comparisons = swapOperator('comparison', [
  ['===', '!=='],
  ['<=', '<'],
  ['>=', '>'],
]);

/**
 * Strict for loose.
 *
 * Behaves identically until the day the two sides have different types, which
 * is exactly the day it matters and never the day the test was written.
 */
const strictness = swapOperator('strictness', [['===', '==']], { symmetric: false });

const arithmetic = swapOperator('arithmetic', [
  ['+', '-'],
  ['*', '/'],
]);

const logical = swapOperator('logical', [['&&', '||']]);

/**
 * Nullish for falsy.
 *
 * The single most common way a legitimate zero, an empty string or a false
 * silently becomes a default.
 */
const nullish = swapOperator('nullish', [['??', '||']], { symmetric: false });

const constants = swapOperator('constant', [['true', 'false']], { boundary: true });

function rewrite(
  name: string,
  pattern: RegExp,
  replace: (match: RegExpExecArray) => { text: string; description: string } | null,
  guard?: (match: RegExpExecArray) => number,
): MutationOperator {
  return {
    name,
    apply(source) {
      const mask = codeMask(source);
      const changes: Change[] = [];
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      const scanner = new RegExp(pattern.source, flags);

      let match = scanner.exec(source);
      while (match) {
        const replacement = replace(match);
        const guarded = guard ? guard(match) : match[0].length;
        if (replacement && isCode(mask, match.index, guarded)) {
          changes.push({
            line: lineOf(source, match.index),
            description: replacement.description,
            source:
              source.slice(0, match.index) +
              replacement.text +
              source.slice(match.index + match[0].length),
          });
        }
        match = scanner.exec(source);
      }

      return changes;
    },
  };
}

/** Off-by-one: the mistake that survives more test suites than any other. */
const offByOne = rewrite('off-by-one', /\b\d+\b/g, (match) => {
  const bumped = String(Number(match[0]) + 1);
  return { text: bumped, description: `\`${match[0]}\` became \`${bumped}\`` };
});

/** Drop a negation. Fatal when both branches are covered, invisible when not. */
const negation = rewrite('negation', /!(?=[A-Za-z_$(])/g, () => ({
  text: '',
  description: '`!` was dropped',
}));

/**
 * Return nothing.
 *
 * Proves a test inspects the result rather than only checking the call did not
 * throw.
 */
const emptyReturn = rewrite(
  'empty-return',
  /return .+/g,
  (match) =>
    match[0] === 'return undefined'
      ? null
      : { text: 'return undefined', description: 'the return value became `undefined`' },
  // Only the keyword must be code; what follows is very often a literal.
  () => 'return'.length,
);

export const javascriptMutationOperators: readonly MutationOperator[] = Object.freeze([
  comparisons,
  strictness,
  arithmetic,
  logical,
  nullish,
  constants,
  offByOne,
  negation,
  emptyReturn,
]);
