import type { TrainingMode } from '@forge/core';
import { trainingModes } from '@forge/core';
import { slotLabel } from '@forge/curriculum';
import type { Exercise } from '@forge/exercises';
import type { Dashboard } from '@forge/session';

import { formatDuration } from '../components/CompletionCard.tsx';
import type { Platform } from '../platform/index.ts';

interface HomeProps {
  readonly platform: Platform;
  readonly dashboard: Dashboard;
  readonly mode: TrainingMode;
  readonly onModeChange: (mode: TrainingMode) => void;
  readonly onOpen: (exercise: Exercise) => void;
}

/**
 * The home screen from spec §50.
 *
 * Information-dense and quiet: what to practise, what is weak, what has
 * improved. No streaks, no badges, no notifications — this is a gym, not a
 * mobile game (§29).
 */
export function Home({ platform, dashboard, mode, onModeChange, onOpen }: HomeProps) {
  const groups = groupPlan(dashboard);

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h2>Python — independent fluency</h2>
        </div>

        <label className="mode-select">
          <span>Mode</span>
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as TrainingMode)}
          >
            {trainingModes.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>
      </header>

      <p className="mode-explainer muted">{MODE_EXPLAINER[mode]}</p>

      {!platform.persistent ? (
        <p className="warning" role="alert">
          {platform.storageNote ?? 'Progress will not be saved in this browser.'}
        </p>
      ) : null}

      <section aria-labelledby="today-heading" className="home__section">
        <h3 id="today-heading">
          Today
          {dashboard.plan.items.length > 0 ? (
            <span className="muted">
              {' '}
              · about {formatDuration(dashboard.plan.estimatedSeconds * 1000)}
            </span>
          ) : null}
        </h3>

        {dashboard.plan.items.length === 0 ? (
          <p className="muted">
            Nothing is unlocked yet. That usually means the catalogue is still small — pick anything
            from the list below.
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.slot} className="slot">
            <h4 className="slot__heading">
              {group.items.length} × {slotLabel(group.slot)}
            </h4>
            <ul className="cards">
              {group.items.map((item) => (
                <li key={item.exercise.id}>
                  <button type="button" className="card" onClick={() => onOpen(item.exercise)}>
                    <span className="card__title">{item.exercise.title}</span>
                    <span className="card__meta">
                      d{item.exercise.difficulty} · {formatDuration(item.estimatedSeconds * 1000)}
                    </span>
                    <span className="card__reason muted">{item.reason}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="home__columns">
        <section aria-labelledby="weak-heading" className="home__section">
          <h3 id="weak-heading">Current weaknesses</h3>
          {dashboard.weaknesses.length === 0 ? (
            <p className="muted">
              Nothing measured yet. Weaknesses appear once you have practised a skill — an untouched
              skill is unexplored, not weak.
            </p>
          ) : (
            <ul className="stats">
              {dashboard.weaknesses.map((skill) => (
                <li key={skill.skillId} className="stat">
                  <span className="stat__name">{skill.name}</span>
                  <Meter value={skill.mastery} label={`${skill.name} mastery`} />
                  <span className="stat__value">{Math.round(skill.mastery * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="improve-heading" className="home__section">
          <h3 id="improve-heading">Recent improvement</h3>
          {dashboard.improvements.length === 0 ? (
            <p className="muted">Solve an exercise twice to see the difference.</p>
          ) : (
            <ul className="stats">
              {dashboard.improvements.map((entry) => (
                <li key={entry.exerciseId} className="stat stat--wide">
                  <span className="stat__name">{entry.title}</span>
                  <span className="stat__value">
                    {formatDuration(entry.fromMs)}
                    <span aria-hidden="true"> → </span>
                    <span className="visually-hidden"> improved to </span>
                    <strong>{formatDuration(entry.toMs)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {dashboard.independentCompletion !== null ? (
            <p className="headline">
              <span className="headline__label">Independent completion</span>
              <span className="headline__value">
                {Math.round(dashboard.independentCompletion * 100)}%
              </span>
            </p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="all-heading" className="home__section">
        <h3 id="all-heading">All exercises</h3>
        <ul className="catalog">
          {platform.catalog
            .all()
            .slice()
            .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
            .map((exercise) => (
              <li key={exercise.id}>
                <button type="button" className="catalog__row" onClick={() => onOpen(exercise)}>
                  <span className="catalog__difficulty">d{exercise.difficulty}</span>
                  <span className="catalog__title">{exercise.title}</span>
                  <span className="catalog__kind muted">{exercise.kind.replace(/-/g, ' ')}</span>
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function Meter({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <span
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="meter__fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

const MODE_EXPLAINER: Record<TrainingMode, string> = {
  learn: 'Everything available: hints, documentation, and the reference solution.',
  practice: 'Hints and documentation available, and the clock is running.',
  fluency: 'Closed book. No hints, no documentation, no autocomplete — write it from memory.',
  simulation: 'Interview conditions. No assistance, and the tests are not shown to you.',
};

function groupPlan(dashboard: Dashboard) {
  const order = [...new Set(dashboard.plan.items.map((item) => item.slot))];
  return order.map((slot) => ({
    slot,
    items: dashboard.plan.items.filter((item) => item.slot === slot),
  }));
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
