import type { Exercise } from '@code-retrainer/exercises';
import type { FluencyHistory } from '@code-retrainer/learning';
import type { CompletionReport } from '@code-retrainer/session';

interface CompleteProps {
  readonly report: CompletionReport;
  readonly exercise: Exercise;
  readonly history: FluencyHistory | null;
  readonly onAgain: () => void;
  readonly onLeave: () => void;
}

/**
 * The payoff screen.
 *
 * Emotionally rewarding without being a slot machine: what you did, what
 * changed, and — where it is true — that you are measurably faster than you
 * were. The reward is the evidence, not a badge for turning up.
 */
export function Complete({ report, exercise, history, onAgain, onLeave }: CompleteProps) {
  const automatic = report.solved && report.independent;
  const faster = findImprovement(history);

  return (
    <section className="complete" aria-labelledby="complete-heading">
      <div>
        <p
          id="complete-heading"
          className={`complete__headline${report.solved ? '' : ' complete__headline--quiet'}`}
        >
          {report.solved ? 'Solved' : 'Attempt recorded'}
        </p>
        <p className="complete__figure">{formatDuration(report.durationMs)}</p>
      </div>

      <div className="complete__facts">
        <Fact label="Independent completion" value={report.independent ? '100%' : 'assisted'} />
        <Fact label="Hints" value={String(report.hintsUsed)} />
      </div>

      {automatic ? (
        <div className="automatic">
          <p className="automatic__word">Automatic</p>
          <p className="automatic__note">
            Solved with no hints, no documentation and no autocomplete. This skill is now eligible
            for spaced review.
          </p>
        </div>
      ) : null}

      {faster ? (
        <>
          <div className="complete__rule" />
          <div>
            <p className="label">You got faster</p>
            <div className="complete__facts" style={{ marginTop: 12 }}>
              <Fact label="Today" value={formatDuration(faster.now)} />
              <Fact label="Previous" value={formatDuration(faster.previous)} />
              <Fact label="Best" value={formatDuration(faster.best)} />
              <Fact
                label="Change"
                value={`−${Math.round((1 - faster.now / faster.previous) * 100)}%`}
              />
            </div>
          </div>
        </>
      ) : null}

      {report.changes.length > 0 ? (
        <>
          <div className="complete__rule" />
          <div>
            <p className="label">Skill impact</p>
            <ul className="impact" style={{ marginTop: 12 }}>
              {report.changes.map((change) => {
                const delta = (change.to - change.from) * 100;
                return (
                  <li key={change.dimension} className="impact__row">
                    <span className="dim">{change.dimension}</span>
                    <span className={`impact__delta impact__delta--${delta >= 0 ? 'up' : 'down'}`}>
                      {delta >= 0 ? '+' : '−'}
                      {Math.abs(delta).toFixed(1)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <p className="empty">
          Nothing moved. Reading the solution records the attempt but carries no evidence.
        </p>
      )}

      {report.reviewNotes.length > 0 ? (
        <>
          <div className="complete__rule" />
          <div>
            <p className="label">Tomorrow</p>
            <ul className="impact" style={{ marginTop: 12 }}>
              {report.reviewNotes.map((note) => (
                <li key={note} className="tomorrow">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {exercise.explanation ? (
        <details>
          <summary className="label" style={{ cursor: 'pointer' }}>
            Why it works
          </summary>
          <div className="prompt__body" style={{ marginTop: 12 }}>
            {exercise.explanation.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </details>
      ) : null}

      <div style={{ display: 'flex', gap: 8 }}>
        {report.solved ? (
          <button type="button" className="button button--primary" onClick={onAgain}>
            Try it again
          </button>
        ) : null}
        <button type="button" className="button" onClick={onLeave}>
          Done
        </button>
      </div>

      {report.solved ? (
        <p className="empty">
          Repeating it now, from an empty editor, is what turns understanding into recall.
        </p>
      ) : null}
    </section>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="fact">
      <span className="fact__key">{label}</span>
      <span className="fact__value">{value}</span>
    </div>
  );
}

/** Only a real comparison: two solved attempts, and this one was quicker. */
function findImprovement(
  history: FluencyHistory | null,
): { now: number; previous: number; best: number } | null {
  if (!history) return null;
  const solved = history.attempts.filter((summary) => summary.metrics.solved);
  if (solved.length < 2) return null;

  const now = solved.at(-1)?.metrics.totalMs;
  const previous = solved.at(-2)?.metrics.totalMs;
  if (now === undefined || previous === undefined || now >= previous) return null;

  return {
    now,
    previous,
    best: Math.min(...solved.map((summary) => summary.metrics.totalMs)),
  };
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}
