// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Training modes. The mode is not a cosmetic preference: it decides what
 * assistance exists, and therefore how much an attempt tells you about the
 * learner's independent ability.
 *
 * Listed in withdrawal order — each rung removes something the one before it
 * offered, and nothing is ever added back. That ordering is the product: the
 * goal is not to solve exercises, it is to still be able to solve them once
 * the assistance is gone.
 *
 *   learn       every affordance available, including the answer
 *   practice    the answer withdrawn, everything else available
 *   drafting    hints, documentation and autocomplete withdrawn
 *   blank-page  the starter code withdrawn — produce it from nothing
 *   simulation  the tests withdrawn too; you decide when it is correct
 */
export const trainingModes = ['learn', 'practice', 'fluency', 'blank-page', 'simulation'] as const;

export type TrainingMode = (typeof trainingModes)[number];

/** Whether a string from outside — a URL, a form, stored state — names a mode. */
export function isTrainingMode(value: string): value is TrainingMode {
  return trainingModes.some((mode) => mode === value);
}

/**
 * The rung a mode sits on, from 0 (fully assisted) upward.
 *
 * Deliberately derived from the declaration order above rather than written
 * out again, so the ladder cannot disagree with itself.
 */
export function rungOf(mode: TrainingMode): number {
  return trainingModes.indexOf(mode);
}

/** The next rung up, or null at the top. */
export function nextRung(mode: TrainingMode): TrainingMode | null {
  return trainingModes[rungOf(mode) + 1] ?? null;
}

export interface ModeAffordances {
  /**
   * Whether the exercise's starter code is placed in the editor.
   *
   * Withdrawing it is the sharpest rung on the ladder. Reading a skeleton and
   * filling in a gap is recognition; producing the whole shape from an empty
   * file is the thing that actually degraded.
   */
  readonly starterCode: boolean;
  readonly hints: boolean;
  readonly documentation: boolean;
  readonly visibleTestSource: boolean;
  readonly editorAutocomplete: boolean;
  readonly solutionReveal: boolean;
  readonly timer: boolean;
  /**
   * How much this mode's outcomes count toward the `independence` dimension.
   * A success in Learn mode is real, but it is weaker evidence of independent
   * fluency than the same success in Fluency mode.
   */
  readonly evidenceWeight: number;
}

const AFFORDANCES: Readonly<Record<TrainingMode, ModeAffordances>> = Object.freeze({
  learn: {
    starterCode: true,
    hints: true,
    documentation: true,
    visibleTestSource: true,
    editorAutocomplete: true,
    solutionReveal: true,
    timer: false,
    evidenceWeight: 0.5,
  },
  practice: {
    starterCode: true,
    hints: true,
    documentation: true,
    visibleTestSource: true,
    editorAutocomplete: true,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 0.8,
  },
  fluency: {
    starterCode: true,
    hints: false,
    documentation: false,
    visibleTestSource: true,
    editorAutocomplete: false,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 1,
  },
  'blank-page': {
    starterCode: false,
    hints: false,
    documentation: false,
    // The tests stay readable: they are the specification, not a hint. Taking
    // them away as well is a different exercise, and it is the next rung.
    visibleTestSource: true,
    editorAutocomplete: false,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 1,
  },
  simulation: {
    starterCode: false,
    hints: false,
    documentation: false,
    visibleTestSource: false,
    editorAutocomplete: false,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 1,
  },
});

export function affordancesFor(mode: TrainingMode): ModeAffordances {
  return AFFORDANCES[mode];
}

/** True when the mode offers no assistance of any kind. */
export function isClosedBook(mode: TrainingMode): boolean {
  const affordances = AFFORDANCES[mode];
  return !affordances.hints && !affordances.documentation && !affordances.editorAutocomplete;
}

/** How a mode is named and described where the learner chooses one. */
export interface ModeDescription {
  readonly mode: TrainingMode;
  readonly name: string;
  /** What this rung withdraws, in the learner's terms. */
  readonly withdraws: string;
}

const DESCRIPTIONS: Readonly<Record<TrainingMode, ModeDescription>> = Object.freeze({
  learn: { mode: 'learn', name: 'Learn', withdraws: 'Nothing. Everything is available.' },
  practice: { mode: 'practice', name: 'Practice', withdraws: 'The solution.' },
  fluency: { mode: 'fluency', name: 'Fluency', withdraws: 'Hints, documentation, autocomplete.' },
  'blank-page': {
    mode: 'blank-page',
    name: 'Blank page',
    withdraws: 'The starter code. An empty file and the tests.',
  },
  simulation: {
    mode: 'simulation',
    name: 'Simulation',
    withdraws: 'The tests. You decide when it is right.',
  },
});

export function describeMode(mode: TrainingMode): ModeDescription {
  return DESCRIPTIONS[mode];
}

/** The ladder, in order, for a mode picker to render. */
export const withdrawalLadder: readonly ModeDescription[] = Object.freeze(
  trainingModes.map((mode) => DESCRIPTIONS[mode]),
);
