// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MutationOperator } from '@code-retrainer/exercises';

/**
 * Small, plausible faults — the ones a learner actually makes.
 *
 * Not random noise. A mutant that turns the solution into a syntax error is
 * caught by everything and proves nothing; the useful mutants are the ones a
 * tired person would write and then stare at: the flipped comparison, the
 * off-by-one, the `and` that should have been `or`.
 *
 * Nothing inside a string or a comment is ever touched. That is not tidiness:
 * a mutated docstring produces a mutant no test can kill, and every one of
 * them shows up as a survivor — which is a report claiming the exercise has
 * holes it does not have. The first version of this scanned line by line and
 * mis-read `"""..."""` as three separate quotes, and reported exactly that.
 */

/**
 * Which characters of the source are code.
 *
 * A single pass over the whole file rather than per line, because Python's
 * triple-quoted strings span lines and a line-local scan cannot see them.
 */
function codeMask(source: string): boolean[] {
  const mask = new Array<boolean>(source.length).fill(true);
  let index = 0;

  const hide = (from: number, to: number): void => {
    for (let at = from; at < to && at < source.length; at += 1) mask[at] = false;
  };

  while (index < source.length) {
    const character = source[index]!;

    if (character === '#') {
      const end = source.indexOf('\n', index);
      hide(index, end === -1 ? source.length : end);
      index = end === -1 ? source.length : end;
      continue;
    }

    if (character !== '"' && character !== "'") {
      index += 1;
      continue;
    }

    // Triple quotes first: `"""` also starts with `"`, and taking the short
    // match is precisely the bug this function exists to avoid.
    const triple = source.slice(index, index + 3);
    const delimiter = triple === '"""' || triple === "'''" ? triple : character;
    const start = index;
    index += delimiter.length;

    while (index < source.length) {
      if (source[index] === '\\') {
        index += 2;
        continue;
      }
      if (source.startsWith(delimiter, index)) {
        index += delimiter.length;
        break;
      }
      // An unterminated single-quoted string ends at the newline; Python would
      // not accept it either, and running past it would hide real code.
      if (delimiter.length === 1 && source[index] === '\n') break;
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

/**
 * Swap one token for another, once per occurrence.
 *
 * `boundary` matters for word operators: replacing `or` inside `for` would
 * produce nonsense, and nonsense mutants are always killed.
 */
function swapOperator(
  name: string,
  pairs: readonly (readonly [string, string])[],
  options: { readonly boundary?: boolean } = {},
): MutationOperator {
  const symmetric = [...pairs, ...pairs.map(([from, to]) => [to, from] as const)];

  return {
    name,
    apply(source) {
      const mask = codeMask(source);
      const changes: Change[] = [];

      for (const [from, to] of symmetric) {
        let at = source.indexOf(from);
        while (at !== -1) {
          const before = source[at - 1] ?? ' ';
          const after = source[at + from.length] ?? ' ';
          const wordBoundaryOk = !options.boundary || (!/\w/.test(before) && !/\w/.test(after));
          // `<` must not match inside `<=`, and `=` must not match inside `==`.
          const notPartOfLonger = !/[=<>]/.test(after) || to.includes(after);

          if (wordBoundaryOk && notPartOfLonger && isCode(mask, at, from.length)) {
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
  ['==', '!='],
  ['<=', '<'],
  ['>=', '>'],
]);

const arithmetic = swapOperator('arithmetic', [
  ['+', '-'],
  ['*', '/'],
]);

const booleans = swapOperator('boolean', [['and', 'or']], { boundary: true });

const constants = swapOperator('constant', [['True', 'False']], { boundary: true });

/**
 * Every match of `pattern` that lies in code, as a mutant.
 *
 * `guard` says how much of the match has to be code rather than all of it.
 * `return f"..."` is a statement worth mutating even though everything after
 * the keyword is a string literal, and requiring the whole match to be code
 * would silently skip every exercise whose solution returns a formatted
 * string — reporting a clean run over nothing at all.
 */
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
      const scanner = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
      );

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

/**
 * Drop a negation.
 *
 * Reliably fatal when the tests cover both branches, and reliably invisible
 * when they only cover the happy path — which is exactly the gap worth
 * finding.
 */
const negation = rewrite('negation', /\bnot\s+/g, () => ({
  text: '',
  description: '`not` was dropped',
}));

/**
 * Return nothing.
 *
 * The bluntest mutant there is, and the one that proves a test actually
 * inspects the result rather than only checking that the call did not raise.
 */
const emptyReturn = rewrite(
  'empty-return',
  /return .+/g,
  (match) =>
    match[0] === 'return None'
      ? null
      : { text: 'return None', description: 'the return value became `None`' },
  // Only the keyword has to be code; what follows is very often a literal.
  () => 'return'.length,
);

export const pythonMutationOperators: readonly MutationOperator[] = Object.freeze([
  comparisons,
  arithmetic,
  booleans,
  constants,
  offByOne,
  negation,
  emptyReturn,
]);
