// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { AssistancePoint, BaselineComparison } from '@code-wizard/session';

/**
 * How much help the learner needed, over time, against where they started.
 *
 * For someone rebuilding fundamentals after years of assisted development,
 * this is the only chart that answers the actual question. Fluency going up is
 * pleasant; this line going down is the point. It is drawn falling-is-good and
 * labeled that way, because a chart that requires a caption to read correctly
 * will be read incorrectly.
 *
 * Gaps are gaps. Days with no practice draw nothing rather than dropping to
 * zero, because zero dependency on a day you did not turn up is a lie shaped
 * like good news.
 */
export function Dependency({
  points,
  baseline,
}: {
  readonly points: readonly AssistancePoint[];
  readonly baseline: BaselineComparison | null;
}) {
  const measured = points.filter(
    (point): point is AssistancePoint & { dependency: number } => point.dependency !== null,
  );

  if (measured.length < 2) {
    return (
      <p className="empty">
        This appears once you have practiced over a few days. It tracks how often you reached for a
        hint, the documentation, or the answer — and the useful direction is down.
      </p>
    );
  }

  const width = 100;
  const height = 100;
  const step = width / Math.max(1, points.length - 1);

  // Segments rather than one path: a break in practice must not be drawn as a
  // straight line implying days that never happened.
  const segments: string[] = [];
  let current: string[] = [];

  points.forEach((point, index) => {
    if (point.dependency === null) {
      if (current.length > 1) segments.push(current.join(' '));
      current = [];
      return;
    }
    const x = (index * step).toFixed(2);
    const y = (point.dependency * height).toFixed(2);
    current.push(`${current.length === 0 ? 'M' : 'L'}${x} ${y}`);
  });
  if (current.length > 1) segments.push(current.join(' '));

  const latest = measured.at(-1);
  const first = measured[0];
  const direction =
    latest && first && latest.dependency < first.dependency
      ? 'down'
      : latest && first && latest.dependency > first.dependency
        ? 'up'
        : 'flat';

  return (
    <div className="dependency">
      <svg
        className="spark spark--dependency"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Assistance dependency: currently ${Math.round(
          (latest?.dependency ?? 0) * 100,
        )} percent of attempts used help`}
      >
        <line className="spark__baseline" x1="0" y1={height} x2={width} y2={height} />
        {segments.map((segment) => (
          <path key={segment} className="spark__line spark__line--dependency" d={segment} />
        ))}
      </svg>

      <p className="dependency__reading" data-direction={direction}>
        <strong>{Math.round((latest?.dependency ?? 0) * 100)}%</strong> of recent attempts used a
        hint, the documentation, or the answer.
      </p>

      {baseline ? <BaselineLine comparison={baseline} /> : null}
    </div>
  );
}

/**
 * The comparison that is always against yourself and never against anyone else.
 *
 * Stated in plain language rather than as a delta badge, because "you need
 * less help than you did" is the sentence someone came here to be able to say,
 * and a number in a colored pill does not say it.
 */
function BaselineLine({ comparison }: { readonly comparison: BaselineComparison }) {
  const change = comparison.independenceChange;
  const points = Math.round(Math.abs(change) * 100);
  const faster = comparison.speedChangeMs !== null && comparison.speedChangeMs < 0;

  if (points === 0) {
    return (
      <p className="dependency__baseline">
        Level with your first sessions on independence
        {faster ? ', though you are getting there faster' : ''}.
      </p>
    );
  }

  return (
    <p className="dependency__baseline" data-direction={change > 0 ? 'down' : 'up'}>
      {change > 0 ? (
        <>
          You solve <strong>{points} points</strong> more of these unaided than in your first
          sessions
          {faster ? ', and faster' : ''}.
        </>
      ) : (
        <>
          You are leaning on help <strong>{points} points</strong> more than in your first sessions.
        </>
      )}
    </p>
  );
}
