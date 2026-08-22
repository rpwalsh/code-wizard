/**
 * Claims a learner makes about what the machine will do, before it does it.
 *
 * The comparison lives here rather than in the UI because it decides whether
 * an attempt counts as evidence of understanding, and that must be the same
 * judgement in the browser, on the desktop and in a replay of an old attempt.
 */
export type Prediction =
  | { readonly about: 'output'; readonly predicted: string }
  | { readonly about: 'tests'; readonly predicted: 'pass' | 'fail' };

/**
 * Compare a predicted program output against what actually happened.
 *
 * Trailing whitespace and a missing final newline are typing, not
 * understanding, so they are normalised away. Everything else is exact: the
 * point of the exercise is that "roughly right" is how the habit of not
 * really knowing survives.
 */
export function matchesOutput(predicted: string, actual: string): boolean {
  return normalise(predicted) === normalise(actual);
}

function normalise(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
    .trimStart();
}

/** Whether a prediction about the run turned out to be right. */
export function isPredictionCorrect(
  prediction: Prediction,
  outcome: { readonly stdout: string } | { readonly green: boolean },
): boolean {
  if (prediction.about === 'output') {
    return 'stdout' in outcome && matchesOutput(prediction.predicted, outcome.stdout);
  }
  return 'green' in outcome && (prediction.predicted === 'pass') === outcome.green;
}
