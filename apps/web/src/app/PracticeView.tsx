// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ActivityGrade, PracticeLog, RunState } from '@code-retrainer/activities';
import {
  answer,
  carryForward,
  currentActivity,
  dayOf,
  isFinished,
  newPracticeLog,
  practiceLine,
  recordRun,
  startRun,
  summarize,
  verdict,
} from '@code-retrainer/activities';
import type { JsonValue } from '@code-retrainer/core';
import type { ProgressStore } from '@code-retrainer/storage';
import { useEffect, useMemo, useState } from 'react';

import { ActivityCard } from '../components/ActivityCard.tsx';
import type { CurriculumActivities } from '../platform/activities.ts';
import { drawRun, fetchActivities } from '../platform/activities.ts';

const RUN_SIZE = 6;
const LOG_KEY = 'practice.log';
const SEEN_KEY = 'practice.seen';

/**
 * Practice: short sessions of reading and answering, for every language.
 *
 * This is the half of the product that does not need a runtime. Sixteen
 * curricula have content here and one of them has an interpreter behind it,
 * which is the whole point — you can start on Rust or SQL today and the code
 * exercises arrive later.
 *
 * It is also the half that has to be pleasant enough to open on a Tuesday. The
 * measures kept are the ones a person practicing an instrument keeps: days
 * showed up, what held, what needed a second look. There is no score, no
 * league table and nobody else in it.
 */
export function PracticeView({
  store,
  language,
}: {
  readonly store: ProgressStore;
  readonly language?: string;
}) {
  const [sets, setSets] = useState<readonly CurriculumActivities[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);

  // Read from the store, which is asynchronous — so these start empty and
  // fill in. An empty practice log renders as "no practice logged yet",
  // which is also the truth on a first visit.
  const [log, setLog] = useState<PracticeLog>(() => newPracticeLog());
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    let canceled = false;
    void fetchActivities().then(
      (loaded) => {
        if (!canceled) setSets(loaded);
      },
      (error: Error) => {
        if (!canceled) setFailure(error.message);
      },
    );
    return () => {
      canceled = true;
    };
  }, []);

  // A run stored yesterday and read today is not still today's, so the log
  // is carried forward as it loads and the number on screen is never stale.
  useEffect(() => {
    let canceled = false;
    void readLog(store).then((stored) => {
      if (!canceled) setLog(carryForward(stored, dayOf(new Date())));
    });
    void readSeen(store).then((ids) => {
      if (!canceled) setSeen(new Set(ids));
    });
    return () => {
      canceled = true;
    };
  }, [store]);

  const begin = (set: CurriculumActivities): void => {
    const activities = drawRun(set, RUN_SIZE, seen);
    setFinishedAt(null);
    setRun(
      startRun(
        { id: `${set.id}-${Date.now()}`, language: set.id, focus: set.title, activities },
        new Date().toISOString(),
      ),
    );
  };

  const record = (result: ActivityGrade): void => {
    setRun((current) => {
      if (!current) return current;
      const activity = currentActivity(current);
      if (activity) {
        setSeen((previous) => {
          const next = new Set(previous).add(activity.id);
          writeSeen(store, [...next]);
          return next;
        });
      }

      const advanced = answer(current, result.correct);
      if (isFinished(advanced)) {
        setFinishedAt(new Date().toISOString());
        setLog((entry) => {
          const updated = recordRun(carryForward(entry, dayOf(new Date())), new Date());
          writeLog(store, updated);
          return updated;
        });
      }
      return advanced;
    });
  };

  if (failure) {
    return (
      <main className="practice" id="main">
        <p className="notice notice--error" role="alert">
          {failure}
        </p>
      </main>
    );
  }

  if (!sets) {
    return (
      <main className="practice" id="main" aria-busy="true">
        <p className="practice__status" role="status">
          Loading activities…
        </p>
      </main>
    );
  }

  if (run && finishedAt) {
    const summary = summarize(run, finishedAt);
    return (
      <main className="practice" id="main">
        <section className="summary glass">
          <p className="summary__eyebrow">{summary.focus}</p>
          <p className="summary__verdict">{verdict(summary)}</p>
          <dl className="summary__figures">
            <div>
              <dt>Unaided</dt>
              <dd className="numeral">
                {summary.firstTime}/{summary.total}
              </dd>
            </div>
            <div>
              <dt>Answers given</dt>
              <dd className="numeral">{summary.answered}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd className="numeral">{formatDuration(summary.seconds)}</dd>
            </div>
          </dl>
          <div className="summary__actions">
            <button type="button" className="button button--primary" onClick={() => setRun(null)}>
              Done
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (run) {
    const activity = currentActivity(run);
    const done = run.run.activities.length - new Set(run.queue).size;
    if (activity) {
      return (
        <main className="practice" id="main">
          <div className="practice__progress">
            <div className="practice__bar">
              <span style={{ width: `${(done / run.run.activities.length) * 100}%` }} />
            </div>
            <button type="button" className="button button--bare" onClick={() => setRun(null)}>
              Stop
            </button>
          </div>
          {/* Keyed by id and by how many have cleared, so returning to a
              requeued activity presents a fresh card rather than the one still
              showing its explanation. */}
          <ActivityCard
            key={`${activity.id}-${run.cleared.length}`}
            activity={activity}
            onAnswered={record}
          />
        </main>
      );
    }
  }

  return (
    <Chooser sets={sets} log={log} seen={seen} onBegin={begin} {...(language ? { language } : {})} />
  );
}

function Chooser({
  sets,
  log,
  seen,
  onBegin,
  language,
}: {
  readonly sets: readonly CurriculumActivities[];
  readonly log: PracticeLog;
  readonly seen: ReadonlySet<string>;
  readonly onBegin: (set: CurriculumActivities) => void;
  readonly language?: string;
}) {
  // The app-wide language leads the list; everything else follows
  // alphabetically, still one click away.
  const ordered = useMemo(
    () =>
      [...sets].sort(
        (a, b) =>
          Number(b.id === language) - Number(a.id === language) || a.title.localeCompare(b.title),
      ),
    [sets, language],
  );

  return (
    <main className="practice" id="main">
      <header className="practice__head">
        <h1 className="practice__title">Practice</h1>
        <p className="practice__lede">
          Short sessions of reading and answering — no editor, no runtime. Six questions, a few
          minutes. Every language has both these and written exercises; this is the half that
          needs nothing installed.
        </p>
        <p className="practice__log numeral">{practiceLine(log)}</p>
      </header>

      <ul className="practice__list">
        {ordered.map((set) => {
          const done = set.activities.filter((activity) => seen.has(activity.id)).length;
          return (
            <li key={set.id}>
              <button type="button" className="practice__card glass" onClick={() => onBegin(set)}>
                <span className="practice__card-title">{set.title}</span>
                <span className="practice__card-count numeral">
                  {done}/{set.activities.length}
                </span>
                <span className="practice__card-summary">{set.summary}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/**
 * Persistence, through the same store as everything else.
 *
 * Not localStorage. A practice log kept there would survive a reload and
 * nothing else: it would not travel with an export, would not come back from
 * an import, and would sit somewhere other than the attempts it belongs
 * beside. The store is IndexedDB in the browser and SQLite on the desktop,
 * and both outlive the window being closed.
 *
 * Reads stay deliberately forgiving. Anything unreadable is treated as "no
 * history" rather than an error: losing a practice count is a shrug, and a
 * screen that refuses to load because of one is not.
 */
async function readLog(store: ProgressStore): Promise<PracticeLog> {
  try {
    const raw = await store.getSetting(LOG_KEY);
    if (!raw) return newPracticeLog();
    const parsed = JSON.parse(raw) as JsonValue;
    return isLog(parsed) ? parsed : newPracticeLog();
  } catch {
    return newPracticeLog();
  }
}

function isLog(value: JsonValue): value is PracticeLog & JsonValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return (
    typeof value['daysPracticed'] === 'number' &&
    typeof value['currentRun'] === 'number' &&
    typeof value['today'] === 'number'
  );
}

function writeLog(store: ProgressStore, log: PracticeLog): void {
  void store.setSetting(LOG_KEY, JSON.stringify(log)).catch(() => {
    // A browser refusing storage is not a reason to stop practicing.
  });
}

async function readSeen(store: ProgressStore): Promise<readonly string[]> {
  try {
    const raw = await store.getSetting(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JsonValue;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeSeen(store: ProgressStore, ids: readonly string[]): void {
  void store.setSetting(SEEN_KEY, JSON.stringify(ids)).catch(() => {
    // As above.
  });
}
