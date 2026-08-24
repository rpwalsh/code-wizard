// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TrajectoryPoint } from '@code-wizard/session';

interface TrajectoryProps {
  readonly points: readonly TrajectoryPoint[];
  readonly label: string;
}

/**
 * Thirty days of independent-coding ability, as one line.
 *
 * No axes, no grid, no gradient fill, no dots. The only thing worth reading
 * here is the shape, and everything else would compete with it. The scale is
 * fixed to 0–100 rather than fitted to the data, so a flat month looks flat
 * instead of being stretched into drama.
 */
export function Trajectory({ points, label }: TrajectoryProps) {
  if (points.length < 2) return null;

  /*
   * Nothing measured yet is not a flat line at zero.
   *
   * Drawing one is technically honest and reads as a bug: a new learner's
   * first sight of the product was a tall empty panel with a rule along the
   * bottom, which looks like a chart that failed to load rather than a chart
   * with nothing to say. The headline beside it already says "no measurements
   * yet", so this says nothing and takes up no room until there is a shape
   * worth looking at.
   */
  if (points.every((point) => point.score <= 0)) return null;

  const width = 100;
  const height = 100;
  const step = width / (points.length - 1);

  const coordinates = points.map((point, index) => ({
    x: index * step,
    y: height - Math.max(0, Math.min(100, point.score)),
  }));

  const path = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const head = coordinates.at(-1);
  const latest = points.at(-1);

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${points.length} days, currently ${latest?.score ?? 0}`}
    >
      <line className="spark__baseline" x1="0" y1={height} x2={width} y2={height} />
      <path className="spark__line" d={path} />
      {head ? <circle className="spark__head" cx={head.x} cy={head.y} r="1.6" /> : null}
    </svg>
  );
}
