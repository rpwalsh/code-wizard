/**
 * Training modes (spec §9). The mode is not a cosmetic preference: it decides
 * what assistance exists, and therefore how much an attempt tells you about
 * the learner's independent ability.
 */
export const trainingModes = ['learn', 'practice', 'fluency', 'simulation'] as const;

export type TrainingMode = (typeof trainingModes)[number];

export interface ModeAffordances {
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
    hints: true,
    documentation: true,
    visibleTestSource: true,
    editorAutocomplete: true,
    solutionReveal: true,
    timer: false,
    evidenceWeight: 0.5,
  },
  practice: {
    hints: true,
    documentation: true,
    visibleTestSource: true,
    editorAutocomplete: true,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 0.8,
  },
  fluency: {
    hints: false,
    documentation: false,
    visibleTestSource: true,
    editorAutocomplete: false,
    solutionReveal: false,
    timer: true,
    evidenceWeight: 1,
  },
  simulation: {
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
