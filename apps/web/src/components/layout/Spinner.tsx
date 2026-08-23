// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The indicator for work that takes long enough to doubt.
 *
 * Purely decorative, and marked so: every place this appears already has the
 * real message in a live region beside it, and a screen reader announcing
 * "image, loading spinner" after the sentence "Starting Python" has said the
 * same thing twice.
 *
 * It carries no percentage because none of the slow things here can honestly
 * report one — an interpreter unpacking itself in WebAssembly does not know
 * how far along it is, and a fake progress bar that stalls at ninety per cent
 * is worse than an honest circle.
 *
 * Motion is suppressed under `prefers-reduced-motion`, where it becomes a
 * slow pulse instead: something still has to say "working", or the reduced
 * motion setting turns into "no feedback at all".
 */
export function Spinner({
  size = 'medium',
  label,
}: {
  readonly size?: 'small' | 'medium' | 'large';
  /** Visible text beside the spinner. Omit when a caller renders its own. */
  readonly label?: string;
}) {
  const circle = <span className="spinner" data-size={size} aria-hidden="true" />;
  if (!label) return circle;

  return (
    <p className="spinner-row" role="status" aria-live="polite">
      {circle}
      <span>{label}</span>
    </p>
  );
}
