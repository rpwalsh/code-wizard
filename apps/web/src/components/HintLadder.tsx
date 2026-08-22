import type { Hint } from '@forge/exercises';

interface HintLadderProps {
  readonly revealed: readonly Hint[];
  readonly remaining: number;
  readonly allowed: boolean;
  readonly onReveal: () => void;
}

const LEVEL_LABEL: Record<Hint['level'], string> = {
  conceptual: 'Conceptual',
  structural: 'Structural',
  language: 'Language feature',
  syntax: 'Syntax',
  explicit: 'The answer',
};

/**
 * The hint ladder (spec §10).
 *
 * One hint at a time, in order, and always with the cost stated up front. The
 * point is not to withhold help — it is that a learner who takes the explicit
 * hint should know they took it, because the mastery model certainly does.
 */
export function HintLadder({ revealed, remaining, allowed, onReveal }: HintLadderProps) {
  if (!allowed) {
    return (
      <section className="panel hints" aria-labelledby="hints-heading">
        <h3 id="hints-heading">Hints</h3>
        <p className="muted">
          Closed-book practice. Hints are off in this mode — that is the point of it.
        </p>
      </section>
    );
  }

  return (
    <section className="panel hints" aria-labelledby="hints-heading">
      <h3 id="hints-heading">Hints</h3>

      {revealed.length === 0 ? (
        <p className="muted">
          Five hints, each more explicit than the last. Try without them first — how much help you
          needed is part of what gets measured.
        </p>
      ) : null}

      <ol className="hint-list">
        {revealed.map((hint) => (
          <li key={hint.level} className="hint">
            <p className="hint__level">{LEVEL_LABEL[hint.level]}</p>
            <p className="hint__text">{hint.text}</p>
          </li>
        ))}
      </ol>

      {remaining > 0 ? (
        <button type="button" className="button button--quiet" onClick={onReveal}>
          Reveal a hint
          <span className="muted"> ({remaining} left)</span>
        </button>
      ) : (
        <p className="muted">No hints left.</p>
      )}
    </section>
  );
}
