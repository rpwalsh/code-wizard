// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The machinery behind every language's mutation operators.
 *
 * The *operators* are facts about a language — which mistakes its programmers
 * actually make — and they live with that language. What does not vary is the
 * mechanism: find the parts of a file that are code, swap one token, report a
 * single-point change. That mechanism lives here so twelve languages do not
 * each carry their own copy of a string scanner.
 *
 * Nothing inside a string, a character literal or a comment is ever mutated. A
 * mutated string produces a mutant no test can kill, and every one of them
 * surfaces in the report as a survivor — a gate claiming holes that are not
 * there is worse than no gate.
 */
import type { MutationOperator } from './mutation.ts';

/** How one language spells its comments and its literals. */
export interface Dialect {
  /** Everything after this, to end of line, is a comment. `//`, `#`, `--`. */
  readonly lineComments: readonly string[];
  /** Paired block comment delimiters, if the language has them. */
  readonly blockComment?: readonly [string, string];
  /** Quote characters that open a string. */
  readonly stringQuotes: readonly string[];
  /** Quotes that may span lines (JS backticks, Go backticks). */
  readonly multilineQuotes?: readonly string[];
  /**
   * True when a single quote can open a *lifetime* rather than a literal, as
   * in Rust's `&'a str`. Treating those as strings would hide real code after
   * them and silently drop mutants — the scanner needs to know.
   */
  readonly singleQuoteIsCharLiteral?: boolean;
}

/**
 * Which characters of the source are code.
 *
 * One pass over the whole file, because multi-line strings and block comments
 * cannot be seen by a line-local scan.
 */
export function codeMask(source: string, dialect: Dialect): boolean[] {
  const mask = new Array<boolean>(source.length).fill(true);
  let index = 0;

  const hide = (from: number, to: number): void => {
    for (let at = from; at < to && at < source.length; at += 1) mask[at] = false;
  };

  const multiline = new Set(dialect.multilineQuotes ?? []);

  while (index < source.length) {
    const character = source[index]!;

    const lineComment = dialect.lineComments.find((token) => source.startsWith(token, index));
    if (lineComment !== undefined) {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;
      hide(index, stop);
      index = stop;
      continue;
    }

    if (dialect.blockComment && source.startsWith(dialect.blockComment[0], index)) {
      const [open, close] = dialect.blockComment;
      const end = source.indexOf(close, index + open.length);
      const stop = end === -1 ? source.length : end + close.length;
      hide(index, stop);
      index = stop;
      continue;
    }

    if (!dialect.stringQuotes.includes(character)) {
      index += 1;
      continue;
    }

    /*
     * Rust's lifetimes look exactly like an unterminated character literal:
     * `&'a str`. A char literal is one character (or one escape) followed by a
     * closing quote, so anything else beginning with ' is a lifetime and must
     * stay visible as code.
     */
    if (character === "'" && dialect.singleQuoteIsCharLiteral === true) {
      const escaped = source[index + 1] === '\\';
      const closes = escaped ? source.indexOf("'", index + 2) : index + 2;
      if (!escaped && source[closes] !== "'") {
        index += 1;
        continue;
      }
      const stop = escaped ? (closes === -1 ? source.length : closes + 1) : closes + 1;
      hide(index, stop);
      index = stop;
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
      // Only some quotes may cross a line; an unterminated one ends there.
      if (!multiline.has(quote) && source[index] === '\n') break;
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

export interface SwapOptions {
  /** Require non-word characters either side — for keywords like `true`. */
  readonly boundary?: boolean;
  /** False to swap one way only, as with strict-for-loose. */
  readonly symmetric?: boolean;
  /** Case-insensitive matching, for SQL keywords. */
  readonly ignoreCase?: boolean;
}

/**
 * An operator that replaces one token with another, one occurrence at a time.
 */
export function swapOperator(
  name: string,
  dialect: Dialect,
  pairs: readonly (readonly [string, string])[],
  options: SwapOptions = {},
): MutationOperator {
  const all =
    options.symmetric === false
      ? pairs
      : [...pairs, ...pairs.map(([from, to]) => [to, from] as const)];

  return {
    name,
    apply(source) {
      const mask = codeMask(source, dialect);
      const haystack = options.ignoreCase === true ? source.toLowerCase() : source;
      const changes: Change[] = [];

      for (const [from, to] of all) {
        const needle = options.ignoreCase === true ? from.toLowerCase() : from;
        let at = haystack.indexOf(needle);

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
          at = haystack.indexOf(needle, at + 1);
        }
      }

      return changes;
    },
  };
}

/** An operator driven by a pattern rather than a token pair. */
export function rewriteOperator(
  name: string,
  dialect: Dialect,
  pattern: RegExp,
  replace: (match: RegExpExecArray) => { text: string; description: string } | null,
  guard?: (match: RegExpExecArray) => number,
): MutationOperator {
  return {
    name,
    apply(source) {
      const mask = codeMask(source, dialect);
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

/**
 * The faults every curly-brace language shares.
 *
 * Comparisons, arithmetic, boolean logic, dropped negations, off-by-one and a
 * discarded return value. A language adds its own on top — PHP's `===`, Go's
 * `:=`, Rust's `unwrap_or` — because those are where its own programmers slip.
 */
export function braceFamilyOperators(
  dialect: Dialect,
  options: {
    readonly booleans?: readonly [string, string];
    /** How this language spells "return nothing", if it can. */
    readonly emptyReturn?: string | null;
  } = {},
): MutationOperator[] {
  const booleans = options.booleans ?? (['true', 'false'] as const);

  const operators: MutationOperator[] = [
    swapOperator('comparison', dialect, [
      ['==', '!='],
      ['<=', '<'],
      ['>=', '>'],
    ]),
    swapOperator('arithmetic', dialect, [
      ['+', '-'],
      ['*', '/'],
    ]),
    swapOperator('logical', dialect, [['&&', '||']]),
    swapOperator('constant', dialect, [[booleans[0], booleans[1]]], { boundary: true }),
    rewriteOperator('off-by-one', dialect, /\b\d+\b/g, (match) => {
      const bumped = String(Number(match[0]) + 1);
      return { text: bumped, description: `\`${match[0]}\` became \`${bumped}\`` };
    }),
    rewriteOperator('negation', dialect, /!(?=[A-Za-z_(])/g, () => ({
      text: '',
      description: '`!` was dropped',
    })),
  ];

  if (options.emptyReturn !== null) {
    const nothing = options.emptyReturn ?? 'return;';
    operators.push(
      rewriteOperator(
        'empty-return',
        dialect,
        /return [^;\n]+;/g,
        (match) =>
          match[0] === nothing
            ? null
            : { text: nothing, description: 'the return value was discarded' },
        // Only the keyword must be code; what follows is often a literal.
        () => 'return'.length,
      ),
    );
  }

  return operators;
}
