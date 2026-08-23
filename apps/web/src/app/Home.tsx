// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { masteryDimensions } from '@code-retrainer/core';
import { slotLabel } from '@code-retrainer/curriculum';
import type { Exercise } from '@code-retrainer/exercises';
import type { Dashboard } from '@code-retrainer/session';

import type { Platform } from '../platform/index.ts';

import { formatDuration } from '../components/Complete.tsx';
import { Dependency } from '../components/Dependency.tsx';
import { Trajectory } from '../components/Trajectory.tsx';

interface HomeProps {
  readonly platform: Platform;
  readonly dashboard: Dashboard;
  readonly language: string;
  readonly languageTitle: string;
  readonly onOpen: (exercise: Exercise) => void;
  readonly onPractice: () => void;
}

/**
 * The home screen.
 *
 * One number, its direction, and what to do next. Everything a learner opening
 * the app at 8am actually needs, and nothing else — no greeting, no streak, no
 * celebration for showing up. They came here to work.
 */
export function Home({
  platform,
  dashboard,
  language,
  languageTitle,
  onOpen,
  onPractice,
}: HomeProps) {
  const { fluency, plan } = dashboard;
  const first = plan.items[0];
  const rest = plan.items.slice(1);

  const scheduled = new Set(plan.items.map((item) => item.exercise.id));
  const catalog = platform.catalog
    .all()
    .filter((exercise) => exercise.language === language)
    .sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title))
    .map((exercise) => ({ exercise, locked: !scheduled.has(exercise.id) }));

  // A language this build cannot execute still has its reading practice, and
  // the honest home page says so instead of showing an empty plan.
  if (catalog.length === 0) {
    return (
      <div className="home">
        <header className="reading">
          <h1 className="reading__language">{languageTitle}</h1>
          <p className="reading__caption">Practice-first in this build</p>
        </header>
        <section className="section">
          <p className="empty">
            This browser build cannot execute {languageTitle} — its exercises live in the desktop
            app, where a real toolchain does the judging. The activities work right here, and they
            are the best place to start anyway.
          </p>
          <button type="button" className="button button--primary" onClick={onPractice}>
            Open {languageTitle} practice
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="reading">
        <h1 className="reading__language">{languageTitle}</h1>
        <p className="reading__caption">Independent fluency</p>

        <div className="reading__figure">
          <span className="reading__score">{fluency.score.toFixed(1)}</span>
          {fluency.change === null ? (
            <span className="reading__change">
              {fluency.measuredSkills === 0
                ? 'no measurements yet'
                : `${fluency.measuredSkills} skills measured`}
            </span>
          ) : (
            <span className="reading__change">
              <strong>
                {fluency.change >= 0 ? '↑' : '↓'} {Math.abs(fluency.change).toFixed(1)}
              </strong>{' '}
              over {fluency.windowDays} days
            </span>
          )}
        </div>

        <Trajectory points={dashboard.trajectory} label="Fluency over 30 days" />
      </header>

      {first ? (
        <section className="section" aria-labelledby="continue-heading">
          <div className="section__head">
            <p className="label" id="continue-heading">
              Continue
            </p>
          </div>

          <button type="button" className="continue" onClick={() => onOpen(first.exercise)}>
            <span className="continue__row">
              <span className="continue__title">{first.exercise.title}</span>
              <span className="continue__meta numeral">
                {Math.round(first.estimatedSeconds / 60)} min
              </span>
            </span>
            <span className="continue__reason">{first.reason}</span>
            <span className="continue__go">Continue →</span>
          </button>
        </section>
      ) : null}

      <section className="section" aria-labelledby="today-heading">
        <div className="section__head">
          <p className="label" id="today-heading">
            Today
          </p>
          {dashboard.dueCount > 0 ? (
            <p className="label">{dashboard.dueCount} due for review</p>
          ) : null}
        </div>

        {rest.length === 0 ? (
          <p className="empty">
            {plan.items.length === 0
              ? 'Nothing is scheduled yet. Pick anything from the catalog below — the schedule builds itself once there is something to go on.'
              : 'That is the session.'}
          </p>
        ) : (
          <>
            <ol className="plan">
              {rest.map((item, index) => (
                <li key={item.exercise.id}>
                  <button
                    type="button"
                    className="plan__item"
                    onClick={() => onOpen(item.exercise)}
                  >
                    <span className="plan__index">{String(index + 2).padStart(2, '0')}</span>
                    <span>
                      <span className="plan__slot">{slotLabel(item.slot)}</span>
                      <span className="plan__title">{item.exercise.title}</span>
                      <span className="plan__why">{item.reason}</span>
                    </span>
                    <span className="plan__time">
                      ~{Math.round(item.estimatedSeconds / 60)} min
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="plan__total">
              <span>Estimated session</span>
              <span className="numeral">{formatDuration(plan.estimatedSeconds * 1000)}</span>
            </p>
          </>
        )}
      </section>

      <section className="section" aria-labelledby="dependency-heading">
        <div className="section__head">
          <p className="label" id="dependency-heading">
            Assistance dependency
          </p>
          <p className="section__note">Down is the direction that matters</p>
        </div>

        <Dependency points={dashboard.assistance} baseline={dashboard.baseline} />
      </section>

      <section className="section" aria-labelledby="dimensions-heading">
        <div className="section__head">
          <p className="label" id="dimensions-heading">
            Fluency dimensions
          </p>
        </div>

        {fluency.measuredSkills === 0 ? (
          <p className="empty">
            These appear once you have practiced something. Knowing a concept and being able to
            write it are different numbers, which is the whole point of measuring both.
          </p>
        ) : (
          <ul className="dimensions">
            {masteryDimensions.map((dimension) => {
              const value = fluency.dimensions[dimension];
              return (
                <li key={dimension} className="dimension">
                  <span className="dimension__name">{dimension}</span>
                  <span
                    className="bar"
                    role="meter"
                    aria-label={dimension}
                    aria-valuenow={Math.round(value * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span className="bar__fill" style={{ width: `${value * 100}%` }} />
                  </span>
                  <span className="dimension__value">{Math.round(value * 100)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="catalog-heading">
        <div className="section__head">
          <p className="label" id="catalog-heading">
            Catalog
          </p>
          <p className="label">{catalog.length} exercises</p>
        </div>

        <ul className="catalog">
          {catalog.map(({ exercise }) => (
            <li key={exercise.id}>
              <button type="button" className="catalog__row" onClick={() => onOpen(exercise)}>
                <span className="catalog__difficulty numeral">d{exercise.difficulty}</span>
                <span className="catalog__title">{exercise.title}</span>
                <span className="catalog__kind">{exercise.kind.replace(/-/g, ' ')}</span>
                <span className="catalog__time numeral">
                  {Math.round(exercise.estimatedSeconds / 60)}m
                </span>
              </button>
            </li>
          ))}
        </ul>

        {catalog.some((entry) => entry.locked) ? (
          <p className="empty">
            Exercises above your current level are still open — the schedule leaves them out, but
            nothing stops you trying one.
          </p>
        ) : null}
      </section>

      {dashboard.improvements.length > 0 ? (
        <section className="section" aria-labelledby="faster-heading">
          <div className="section__head">
            <p className="label" id="faster-heading">
              Getting faster
            </p>
          </div>
          <ul className="improvements">
            {dashboard.improvements.map((entry) => (
              <li key={entry.exerciseId} className="improvement">
                <span>{entry.title}</span>
                <span className="improvement__times">
                  {formatDuration(entry.fromMs)}
                  <span aria-hidden="true"> → </span>
                  <span className="visually-hidden"> down to </span>
                  <strong>{formatDuration(entry.toMs)}</strong>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
