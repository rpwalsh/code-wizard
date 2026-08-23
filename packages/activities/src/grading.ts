// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Activity, ActivityResponse } from './model.ts';

/**
 * What happened when an answer was submitted.
 *
 * `correct` is the only thing that counts toward mastery. Everything else is
 * for what the learner is shown afterwards, which is where an activity does
 * its actual teaching.
 */
export interface ActivityGrade {
  readonly correct: boolean;
  /**
   * Which parts were right, for activities with more than one part.
   *
   * Not partial credit — `correct` is all-or-nothing — but a learner who put
   * six of seven lines in the right order should be shown the one that moved,
   * not a red cross over the whole thing.
   */
  readonly parts: readonly boolean[];
  /** The right answer, rendered for display. */
  readonly expected: string;
  /** What the learner actually submitted, rendered the same way. */
  readonly submitted: string;
}

/**
 * Grade an answer.
 *
 * Every branch is a comparison against data the author wrote down. There is no
 * scoring model, no similarity threshold and no interpretation: given the same
 * activity and the same response this returns the same grade on every machine,
 * forever, which is the property that lets a mastery score mean anything at
 * all.
 *
 * The kinds are matched pairwise, so a mismatched response is a compile error
 * at every call site and a thrown error at the one runtime boundary where
 * responses arrive as data.
 */
export function grade(activity: Activity, response: ActivityResponse): ActivityGrade {
  if (activity.kind !== response.kind) {
    throw new Error(
      `Response of kind '${response.kind}' cannot grade a '${activity.kind}' activity`,
    );
  }

  switch (activity.kind) {
    case 'multiple-choice': {
      if (response.kind !== 'multiple-choice') throw mismatch();
      const wanted = new Set(activity.correct);
      const got = new Set(response.selected);
      // Every option is a part, so the review can mark each one rather than
      // only reporting that the set was wrong.
      const parts = activity.options.map((_, index) => wanted.has(index) === got.has(index));
      return {
        correct: parts.every(Boolean),
        parts,
        expected: activity.correct.map((index) => activity.options[index]?.text ?? '').join(' + '),
        submitted: response.selected
          .map((index) => activity.options[index]?.text ?? '')
          .join(' + '),
      };
    }

    case 'predict-output': {
      if (response.kind !== 'predict-output') throw mismatch();
      const submitted = normalizeOutput(response.text);
      const accepted = [activity.expected, ...(activity.alsoAccept ?? [])].map(normalizeOutput);
      const correct = accepted.includes(submitted);
      return { correct, parts: [correct], expected: activity.expected, submitted: response.text };
    }

    case 'order-lines': {
      if (response.kind !== 'order-lines') throw mismatch();
      const parts = activity.lines.map((_, position) =>
        inPlace(activity.interchangeable ?? [], response.order[position], position),
      );
      return {
        correct: response.order.length === activity.lines.length && parts.every(Boolean),
        parts,
        expected: activity.lines.join('\n'),
        submitted: response.order.map((index) => activity.lines[index] ?? '?').join('\n'),
      };
    }

    case 'fill-blanks': {
      if (response.kind !== 'fill-blanks') throw mismatch();
      const parts = activity.blanks.map((blank, position) =>
        blank.accepts.some(
          (accepted) =>
            normalizeToken(accepted) === normalizeToken(response.filled[position] ?? ''),
        ),
      );
      return {
        correct: parts.every(Boolean),
        parts,
        expected: activity.blanks.map((blank) => blank.accepts[0] ?? '').join(', '),
        submitted: response.filled.join(', '),
      };
    }

    case 'spot-the-bug': {
      if (response.kind !== 'spot-the-bug') throw mismatch();
      const correct = response.line === activity.faultLine;
      return {
        correct,
        parts: [correct],
        expected: `line ${activity.faultLine}`,
        submitted: `line ${response.line}`,
      };
    }

    case 'match-pairs': {
      if (response.kind !== 'match-pairs') throw mismatch();
      // `matched[i]` is the index of the right-hand item paired with left item
      // i, so the identity permutation is the correct answer.
      const parts = activity.pairs.map((_, index) => response.matched[index] === index);
      return {
        correct: response.matched.length === activity.pairs.length && parts.every(Boolean),
        parts,
        expected: activity.pairs.map((pair) => `${pair.left} → ${pair.right}`).join('; '),
        submitted: activity.pairs
          .map(
            (pair, index) =>
              `${pair.left} → ${activity.pairs[response.matched[index] ?? -1]?.right ?? '?'}`,
          )
          .join('; '),
      };
    }
  }
}

/**
 * Is the line the learner put here acceptable here?
 *
 * Right position, or in a group the author declared order-independent. Two
 * imports in either order are the same program, and marking one of them wrong
 * teaches the learner something false about the language.
 */
function inPlace(
  groups: readonly (readonly number[])[],
  placed: number | undefined,
  position: number,
): boolean {
  if (placed === undefined) return false;
  if (placed === position) return true;
  return groups.some((group) => group.includes(placed) && group.includes(position));
}

/**
 * Trailing whitespace is not a wrong answer.
 *
 * Line endings, a trailing newline and spaces at the end of a line are
 * artifacts of typing into a box, not claims about what the program prints.
 * Everything else — including a missing space *inside* a line, and letter
 * case — is left alone, because those are the differences that mean the
 * learner predicted something the program does not do.
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n+$/u, '');
}

/**
 * The same, for a single token typed into a gap.
 *
 * Surrounding whitespace goes; nothing inside does. `dict.get` and `dict .get`
 * are not the same expression.
 */
export function normalizeToken(text: string): string {
  return text.trim();
}

function mismatch(): Error {
  return new Error('Activity and response kinds diverged after the guard');
}
