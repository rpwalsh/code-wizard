// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { MasteryDimension, SkillId } from '@code-retrainer/core';

/**
 * Practice that does not run code.
 *
 * The product's thesis is production: can you write this, unaided, and does it
 * pass. Nothing here changes that. What these add is the half of learning that
 * happens before you can produce anything — reading code and knowing what it
 * does, recognizing the right shape among four wrong ones, spotting the line
 * that is broken. A learner who cannot yet write a comprehension can very
 * often tell you what one evaluates to, and refusing to measure that means
 * refusing to teach anyone who is not already competent.
 *
 * Two things follow from that, and both are enforced rather than encouraged.
 *
 * **Activities are graded by comparison, never by judgment.** Every kind here
 * has a right answer that is decided by string or set equality against data
 * written by whoever authored the activity. There is no model in the loop,
 * nothing is scored on a curve, and the grader cannot be wrong in an
 * interesting way — it can only be given a wrong answer key, which a test can
 * catch. See `grade` in `grading.ts`.
 *
 * **Activities cannot make you fluent.** They award `knowledge`,
 * `recognition`, `recall` and `debugging`. They never award `application`,
 * `composition`, `transfer` or `independence`, because recognizing a correct
 * answer among four is not evidence that you could produce it from an empty
 * editor, and the day this file lets it count as such is the day the headline
 * number starts lying. That ceiling lives in `evidence.ts` and is a test, not
 * a convention.
 *
 * The practical consequence is the point: a language needs no runtime, no
 * compiler and no sandbox to be taught this way. Rust, Go, C# and the rest can
 * carry lessons, activities and measured progress on the day their content is
 * written, and gain exercises whenever a runtime lands behind them.
 */
export type ActivityKind =
  | 'multiple-choice'
  | 'predict-output'
  | 'order-lines'
  | 'fill-blanks'
  | 'spot-the-bug'
  | 'match-pairs';

/** Fields every activity carries, whatever its kind. */
interface ActivityCommon {
  /** Stable and namespaced, e.g. `rust.ownership.borrow-check.mc-1`. */
  readonly id: string;
  readonly language: string;
  readonly title: string;
  /** 1 (first encounter) to 5 (subtle). */
  readonly difficulty: number;
  readonly estimatedSeconds: number;
  readonly skills: readonly SkillId[];
  /** Markdown shown above the activity. */
  readonly prompt: string;
  /**
   * Shown once the answer is in, right or wrong.
   *
   * Required, and required to explain *why* rather than restate the answer. An
   * activity that says only "incorrect" has taught nothing and wasted the one
   * moment the learner was actually paying attention.
   */
  readonly explanation: string;
}

/**
 * Choose from a fixed list.
 *
 * `correct` may name more than one option, in which case the answer must match
 * the whole set — partial credit would make "select all that apply" a game of
 * picking the one you are sure of.
 */
export interface MultipleChoiceActivity extends ActivityCommon {
  readonly kind: 'multiple-choice';
  /** Optional code the question is about, shown above the options. */
  readonly code?: string;
  readonly options: readonly ActivityOption[];
  /** Indices into `options`. */
  readonly correct: readonly number[];
}

export interface ActivityOption {
  readonly text: string;
  /**
   * Why this particular wrong answer is tempting.
   *
   * Optional, but a distractor with a reason behind it is the difference
   * between a question that teaches and a question that filters. The three
   * wrong options are where the teaching is.
   */
  readonly why?: string;
}

/**
 * Read the code, say what it prints.
 *
 * The strongest thing on this list. Predicting output is real comprehension —
 * you cannot bluff it, and there is nothing to recognize — while still being
 * gradeable by comparing two strings.
 */
export interface PredictOutputActivity extends ActivityCommon {
  readonly kind: 'predict-output';
  readonly code: string;
  /** Exactly what the program writes. Compared after normalization. */
  readonly expected: string;
  /**
   * Other answers that are also right.
   *
   * For output whose form is genuinely unspecified — a set printed in some
   * order, a float rendered to a different precision. Not a place to accept
   * near-misses.
   */
  readonly alsoAccept?: readonly string[];
}

/**
 * Put shuffled lines back in order.
 *
 * Structure without syntax: the learner has all the pieces and has to know
 * what goes where, which is the step between reading code and writing it.
 */
export interface OrderLinesActivity extends ActivityCommon {
  readonly kind: 'order-lines';
  /** The correct program, one entry per line, in order. */
  readonly lines: readonly string[];
  /**
   * Groups of line indices whose internal order genuinely does not matter —
   * two independent imports, two unrelated assignments. Without this the
   * grader marks a correct program wrong, and a learner who is right and told
   * otherwise stops trusting the tool.
   */
  readonly interchangeable?: readonly (readonly number[])[];
  /** Lines that belong to no correct program. Optional but recommended. */
  readonly distractors?: readonly string[];
}

/**
 * Type the missing pieces of real code.
 *
 * Recall rather than recognition: nothing is offered to pick from.
 */
export interface FillBlanksActivity extends ActivityCommon {
  readonly kind: 'fill-blanks';
  /** The code with `{1}`, `{2}`, … marking the gaps. */
  readonly template: string;
  readonly blanks: readonly Blank[];
}

export interface Blank {
  /** The number used in the template, one-based. */
  readonly index: number;
  /** Every spelling that is correct. The first is the one shown as the answer. */
  readonly accepts: readonly string[];
  /** Shown beneath the gap before the answer is typed. */
  readonly hint?: string;
}

/**
 * Find the line that is wrong.
 *
 * Debugging measured directly. Locating a fault is a different skill from
 * writing correct code, it is the one people actually spend their days on, and
 * it is the only dimension here that a code exercise measures worse than an
 * activity does — an exercise tells you the tests failed, not that you knew
 * where to look.
 */
export interface SpotTheBugActivity extends ActivityCommon {
  readonly kind: 'spot-the-bug';
  readonly code: string;
  /** One-based line number of the fault. */
  readonly faultLine: number;
  /** What the line should have said. Shown afterwards. */
  readonly correction: string;
}

/**
 * Match each item on the left to one on the right.
 *
 * Terms to definitions, expressions to values, errors to causes. Graded as a
 * complete bijection, because getting three of five right by elimination is
 * not knowing four of them.
 */
export interface MatchPairsActivity extends ActivityCommon {
  readonly kind: 'match-pairs';
  readonly pairs: readonly MatchPair[];
}

export interface MatchPair {
  readonly left: string;
  readonly right: string;
}

export type Activity =
  | MultipleChoiceActivity
  | PredictOutputActivity
  | OrderLinesActivity
  | FillBlanksActivity
  | SpotTheBugActivity
  | MatchPairsActivity;

/**
 * What a learner submitted, one shape per kind.
 *
 * Kept separate from `Activity` and discriminated the same way, so a response
 * cannot be handed to the wrong grader without the compiler saying so.
 */
export type ActivityResponse =
  | { readonly kind: 'multiple-choice'; readonly selected: readonly number[] }
  | { readonly kind: 'predict-output'; readonly text: string }
  | { readonly kind: 'order-lines'; readonly order: readonly number[] }
  | { readonly kind: 'fill-blanks'; readonly filled: readonly string[] }
  | { readonly kind: 'spot-the-bug'; readonly line: number }
  | { readonly kind: 'match-pairs'; readonly matched: readonly number[] };

/**
 * The dimensions each kind is allowed to move.
 *
 * Deliberately narrow, and deliberately here rather than in the content: an
 * author writing a multiple-choice question cannot decide that theirs is worth
 * `independence`.
 */
export const dimensionsByKind: Readonly<Record<ActivityKind, readonly MasteryDimension[]>> =
  Object.freeze({
    'multiple-choice': ['knowledge', 'recognition'],
    'predict-output': ['knowledge', 'recognition'],
    'order-lines': ['recall', 'recognition'],
    'fill-blanks': ['recall'],
    'spot-the-bug': ['debugging', 'recognition'],
    'match-pairs': ['recognition'],
  });
