// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The practice log: days practiced, and a daily minimum.
 *
 * A training log of the kind anyone learning an instrument or building
 * distance keeps, rather than a score. Fluency is largely a function of how
 * many days you showed up, so a count of those days is genuinely informative —
 * it is the one statistic here that predicts the others.
 *
 * **The headline number is the total, and the total never goes down.** This
 * matters more than it sounds. The people this tool is for are often out of
 * work and looking, and a big number that resets to zero because they missed a
 * Tuesday is a punishment aimed squarely at someone who is already having a
 * hard month. The consecutive run is still counted, because it is real
 * information about momentum, but it is shown second and its lapse is never
 * announced. Nothing here is ever framed as something lost.
 *
 * The rest of the design follows from the same idea.
 *
 * **The daily minimum is one run.** Three minutes. A target you can meet on
 * your worst day is a target you keep; one that needs a good day gets
 * abandoned in week three, and then the app itself becomes something to avoid.
 *
 * **Days, not minutes.** There is no way to make any number here go up by
 * staying longer, so it never becomes a reason to keep going while tired and
 * learning nothing.
 *
 * **Nobody else is in it.** No leaderboards, no league, no comparison to other
 * learners, no notion of falling behind. This is self-directed practice, and
 * the only useful comparison is to the same person last month.
 */
export interface PracticeLog {
  /** Every day the minimum was met, ever. Only ever increases. */
  readonly daysPracticed: number;
  /** Consecutive days ending today, or ending yesterday if today is untouched. */
  readonly currentRun: number;
  /** The longest consecutive run ever reached. Never goes down. */
  readonly longestRun: number;
  /** `YYYY-MM-DD` of the last day the minimum was met, or null. */
  readonly lastMetOn: string | null;
  /** Runs completed today, against the minimum. */
  readonly today: number;
  /** Runs per day that counts as showing up. */
  readonly dailyMinimum: number;
}

export const DEFAULT_MINIMUM = 1;

export function newPracticeLog(dailyMinimum: number = DEFAULT_MINIMUM): PracticeLog {
  return {
    daysPracticed: 0,
    currentRun: 0,
    longestRun: 0,
    lastMetOn: null,
    today: 0,
    dailyMinimum,
  };
}

/**
 * The calendar day a timestamp falls on, in the learner's own zone.
 *
 * Local rather than UTC on purpose. A day practiced is the day you
 * experienced, and telling someone in Auckland that their Tuesday evening
 * session landed on Monday is the sort of small wrongness that makes a number
 * feel arbitrary.
 */
export function dayOf(at: Date): string {
  const year = at.getFullYear();
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return dayOf(new Date(year ?? 1970, (month ?? 1) - 1, (date ?? 1) - 1));
}

/**
 * Record one completed run.
 *
 * The day counts at the moment the minimum is met, not on every run, so a
 * second run the same day is worth doing and inflates nothing.
 */
export function recordRun(log: PracticeLog, at: Date): PracticeLog {
  const today = dayOf(at);
  const carried = carryForward(log, today);
  const runs = carried.today + 1;

  if (runs < carried.dailyMinimum || carried.lastMetOn === today) {
    return { ...carried, today: runs };
  }

  const currentRun = carried.lastMetOn === previousDay(today) ? carried.currentRun + 1 : 1;
  return {
    ...carried,
    today: runs,
    daysPracticed: carried.daysPracticed + 1,
    currentRun,
    longestRun: Math.max(carried.longestRun, currentRun),
    lastMetOn: today,
  };
}

/**
 * The log as it stands right now, with a missed day already applied.
 *
 * Call this before showing anything. A consecutive run stored on Friday and
 * read on Sunday is not still seven, and discovering that only after finishing
 * a session would be an unpleasant little surprise at the wrong moment.
 *
 * Note what does *not* change here: `daysPracticed` and `longestRun` are
 * untouched by a missed day, because they are records of things that actually
 * happened and no amount of time passing makes them less true.
 */
export function carryForward(log: PracticeLog, today: string): PracticeLog {
  if (log.lastMetOn === today) return log;

  const alive = log.lastMetOn === previousDay(today);
  return { ...log, today: 0, currentRun: alive ? log.currentRun : 0 };
}

export function minimumMet(log: PracticeLog): boolean {
  return log.today >= log.dailyMinimum;
}

/**
 * The line shown beside the number.
 *
 * Plain, never escalating, and never mournful. "You are on fire!!!" at four
 * days is how a counter becomes something you resent; "you lost your streak!"
 * is how an app becomes something you close. This states a fact and stops.
 */
export function practiceLine(log: PracticeLog): string {
  if (log.daysPracticed === 0) return 'No practice logged yet.';
  const days = log.daysPracticed === 1 ? '1 day' : `${log.daysPracticed} days`;
  if (minimumMet(log)) {
    return log.currentRun > 1
      ? `${days} practiced — ${log.currentRun} in a row.`
      : `${days} practiced.`;
  }
  return `${days} practiced.`;
}
