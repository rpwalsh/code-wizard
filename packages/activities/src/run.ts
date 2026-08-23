// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Activity } from './model.ts';

/**
 * A run: five to ten activities, three to five minutes, one sitting.
 *
 * The unit that makes practice a habit rather than a project. A curriculum is
 * two hundred lessons and nobody opens a two-hundred-lesson thing on a
 * Tuesday; a run is short enough that starting one is not a decision.
 *
 * Two deliberate departures from the app everyone will compare this to.
 *
 * **There are no hearts.** Losing a life for a wrong answer, running out, and
 * being locked out until a timer expires is a monetisation mechanic wearing
 * pedagogy's coat. Its actual effect is to punish exactly the learner who most
 * needs another go. Here a wrong answer costs nothing and instead **puts the
 * activity back into the queue**, a few items later, so you meet it again
 * inside the same run while the correction is still fresh. That is spacing,
 * it is the thing that genuinely works, and it happens to feel better too.
 *
 * **A run cannot be failed.** It ends when the queue is empty, and the queue
 * empties when everything in it has been answered correctly once. What varies
 * is how long it took and how many second attempts it needed, which is what
 * the summary reports.
 *
 * What this is not is a game. There is no score, no combo counter, no points
 * and nothing to collect. The only numbers kept are the ones a person
 * practicing an instrument would keep: what you got right unaided, what you
 * had to go back to, and how long it took. Those are useful the next morning.
 * A points total is not.
 */
export interface Run {
  readonly id: string;
  readonly language: string;
  /** The lesson or skill this run was drawn for, for the summary line. */
  readonly focus: string;
  readonly activities: readonly Activity[];
}

export interface RunState {
  readonly run: Run;
  /** Positions into `run.activities`, in the order they will be shown. */
  readonly queue: readonly number[];
  /** How many have been answered correctly at least once. */
  readonly cleared: readonly number[];
  /** Positions that have been got wrong at least once, in this run. */
  readonly missed: readonly number[];
  readonly answered: number;
  readonly correctFirstTime: number;
  readonly startedAt: string;
}

/** How far back a missed activity is pushed before it comes round again. */
const REQUEUE_DISTANCE = 3;

export function startRun(run: Run, startedAt: string): RunState {
  return {
    run,
    queue: run.activities.map((_, index) => index),
    cleared: [],
    missed: [],
    answered: 0,
    correctFirstTime: 0,
    startedAt,
  };
}

export function currentActivity(state: RunState): Activity | null {
  const next = state.queue[0];
  return next === undefined ? null : (state.run.activities[next] ?? null);
}

export function isFinished(state: RunState): boolean {
  return state.queue.length === 0;
}

/**
 * Advance the run by one answer.
 *
 * Pure, and returns a new state rather than mutating: the run is replayable
 * from its answers, which is what lets a session be reconstructed rather than
 * only summarized.
 */
export function answer(state: RunState, correct: boolean): RunState {
  const position = state.queue[0];
  if (position === undefined) return state;

  const rest = state.queue.slice(1);
  const firstAttempt = !state.missed.includes(position);

  if (correct) {
    return {
      ...state,
      queue: rest,
      cleared: [...state.cleared, position],
      answered: state.answered + 1,
      correctFirstTime: state.correctFirstTime + (firstAttempt ? 1 : 0),
    };
  }

  // Back into the queue, a few items later — near enough that the explanation
  // is still in mind, far enough that answering again is recall rather than
  // copying what was just on screen.
  const insertAt = Math.min(REQUEUE_DISTANCE, rest.length);
  return {
    ...state,
    queue: [...rest.slice(0, insertAt), position, ...rest.slice(insertAt)],
    missed: state.missed.includes(position) ? state.missed : [...state.missed, position],
    answered: state.answered + 1,
  };
}

export interface RunSummary {
  readonly focus: string;
  readonly total: number;
  /** Got right without ever getting it wrong. The number that means something. */
  readonly firstTime: number;
  readonly answered: number;
  readonly seconds: number;
  /** Nothing needed a second attempt. */
  readonly clean: boolean;
  /** What was missed, so the next run can be drawn from it. */
  readonly missed: readonly string[];
}

export function summarize(state: RunState, finishedAt: string): RunSummary {
  const total = state.run.activities.length;
  // What needed a second attempt is the useful signal in the whole run: it is
  // what the next session should be drawn from.
  const missed = state.missed
    .map((position) => state.run.activities[position]?.id)
    .filter((id): id is string => id !== undefined);

  return {
    focus: state.run.focus,
    total,
    firstTime: state.correctFirstTime,
    answered: state.answered,
    seconds: Math.max(0, Math.round((Date.parse(finishedAt) - Date.parse(state.startedAt)) / 1000)),
    clean: state.correctFirstTime === total,
    missed,
  };
}

/**
 * What the end of a run says.
 *
 * A reading, not a reward. Every line states what happened and what it implies
 * for the next session; none of them congratulate. Praise for work that was
 * not good makes praise worthless, and this is a tool for people who want to
 * know where they actually stand.
 *
 * Written here rather than in a component so the tone is one decision in one
 * place and can be read without opening the interface.
 */
export function verdict(summary: RunSummary): string {
  if (summary.clean) return 'All of them unaided. This material is holding.';
  if (summary.firstTime >= summary.total - 1) {
    return 'One needed a second look. Worth repeating tomorrow.';
  }
  if (summary.firstTime >= summary.total * 0.6) {
    return 'Most held. What you missed is what the next run is drawn from.';
  }
  if (summary.firstTime >= summary.total * 0.3) {
    return 'This is not settled yet. Same material again before moving on.';
  }
  return 'Mostly second attempts. Go back to the lesson before practicing this again.';
}
