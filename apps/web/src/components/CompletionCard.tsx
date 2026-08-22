import type { CompletionReport } from '@forge/session';

interface CompletionCardProps {
  readonly report: CompletionReport;
  readonly explanation?: string;
  readonly onNext: () => void;
}

/**
 * What just changed, and why (spec §47 explainability).
 *
 * The learner is told the actual arithmetic rather than being handed a badge:
 * which dimensions moved, in which direction, and the plain-language reason
 * for each. If the numbers went down, it says so.
 */
export function CompletionCard({ report, explanation, onNext }: CompletionCardProps) {
  return (
    <section className="panel completion" aria-labelledby="completion-heading" role="status">
      <h3 id="completion-heading">{report.solved ? 'Solved' : 'Attempt recorded'}</h3>

      <p className="completion__summary">
        {formatDuration(report.durationMs)}
        {' · '}
        {report.independent
          ? 'no assistance'
          : `${report.hintsUsed} hint${report.hintsUsed === 1 ? '' : 's'}`}
      </p>

      {report.changes.length > 0 ? (
        <>
          <h4>What moved</h4>
          <ul className="changes">
            {report.changes.map((change) => (
              <li key={change.dimension} className="change">
                <span className="change__name">{change.dimension}</span>
                <span className="change__values">
                  {percent(change.from)}
                  <span aria-hidden="true"> → </span>
                  <span className="visually-hidden"> to </span>
                  <strong className={change.to > change.from ? 'up' : 'down'}>
                    {percent(change.to)}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">
          Nothing moved. Reading the solution records the attempt but carries no evidence.
        </p>
      )}

      {report.reasons.length > 0 ? (
        <>
          <h4>Why</h4>
          <ul className="reasons">
            {report.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      ) : null}

      {report.reviewNotes.length > 0 ? (
        <>
          <h4>Next review</h4>
          <ul className="reasons">
            {report.reviewNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}

      {explanation ? (
        <details className="explanation">
          <summary>Why the solution works</summary>
          <div className="explanation__body">
            {explanation.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </details>
      ) : null}

      <button type="button" className="button" onClick={onNext}>
        Back to today
      </button>
    </section>
  );
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}
