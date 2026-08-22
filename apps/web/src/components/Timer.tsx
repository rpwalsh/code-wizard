import type { Exercise } from '@code-retrainer/exercises';
import { timeBudgetSeconds } from '@code-retrainer/exercises';

import { formatDuration } from './Complete.tsx';

/** What the learner has chosen to see. Off is a real option, and the default. */
export type TimerMode = 'off' | 'elapsed' | 'budget';

export const timerModes: readonly TimerMode[] = Object.freeze(['off', 'elapsed', 'budget']);

export function isTimerMode(value: string): value is TimerMode {
  return timerModes.some((mode) => mode === value);
}

/**
 * The clock, and how much of it there is.
 *
 * Off by default and switchable at any moment, because a timer is useful to
 * someone deliberately training speed and corrosive to someone stuck on a
 * concept — and only they know which of those they are right now.
 *
 * The budget comes from the exercise's own difficulty, so a twenty-minute
 * problem does not tick against the same allowance as a sixty-second drill.
 * Running over changes the wording and nothing else: it does not turn red, it
 * does not stop anything, and it never reaches grading. Being slow is
 * information, and information does not need a colour to be heard.
 */
export function Timer({
  mode,
  elapsedMs,
  exercise,
}: {
  readonly mode: TimerMode;
  readonly elapsedMs: number;
  readonly exercise: Exercise;
}) {
  if (mode === 'off') return null;

  if (mode === 'elapsed') {
    return (
      <output className="timer" aria-label="Time on this exercise">
        {formatDuration(elapsedMs)}
      </output>
    );
  }

  const budgetMs = timeBudgetSeconds(exercise) * 1000;
  const remainingMs = budgetMs - elapsedMs;
  const over = remainingMs < 0;

  return (
    <output
      className="timer timer--budget"
      data-state={over ? 'over' : remainingMs < budgetMs * 0.15 ? 'close' : 'within'}
      aria-label={
        over
          ? `${formatDuration(-remainingMs)} over the ${formatDuration(budgetMs)} allowance`
          : `${formatDuration(remainingMs)} of ${formatDuration(budgetMs)} remaining`
      }
    >
      <span className="timer__figure">{formatDuration(Math.abs(remainingMs))}</span>
      <span className="timer__unit">{over ? 'over' : `of ${formatDuration(budgetMs)}`}</span>
    </output>
  );
}
