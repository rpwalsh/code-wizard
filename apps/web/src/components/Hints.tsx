// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Hint, HintLevel } from '@code-retrainer/exercises';

interface HintsProps {
  readonly revealed: readonly Hint[];
  readonly remaining: number;
  readonly allowed: boolean;
  readonly onReveal: () => void;
}

const LADDER: readonly { level: HintLevel; label: string }[] = [
  { level: 'conceptual', label: 'Concept' },
  { level: 'structural', label: 'Structure' },
  { level: 'language', label: 'Language' },
  { level: 'syntax', label: 'Syntax' },
  { level: 'explicit', label: 'Answer' },
];

/**
 * The hint ladder as a set of rungs, not four boxes shouting at once.
 *
 * The whole ladder is visible from the start, so the learner can see what is
 * on offer and choose how far down to go; only the rungs they open show text.
 * The cost line is honest measurement rather than a scold — the mastery model
 * really does weight an assisted solve differently, and saying so quietly is
 * better than hiding it and surprising them later.
 */
export function Hints({ revealed, remaining, allowed, onReveal }: HintsProps) {
  if (!allowed) {
    return (
      <section>
        <p className="label">Hints</p>
        <p className="empty" style={{ marginTop: 8 }}>
          Closed book. That is the point of this mode.
        </p>
      </section>
    );
  }

  const openLevels = new Set(revealed.map((hint) => hint.level));
  const nextIndex = revealed.length;

  return (
    <section>
      <div className="section__head" style={{ marginBottom: 0 }}>
        <p className="label">Hints</p>
        <p className="label numeral">
          {revealed.length} / {revealed.length + remaining}
        </p>
      </div>

      <ol className="hints__ladder">
        {LADDER.slice(0, revealed.length + remaining).map((rung, index) => {
          const open = openLevels.has(rung.level);
          const isNext = index === nextIndex;
          const hint = revealed.find((candidate) => candidate.level === rung.level);

          return (
            <li key={rung.level}>
              <button
                type="button"
                className={`rung${open ? ' rung--open' : ''}`}
                disabled={!isNext}
                onClick={onReveal}
                aria-expanded={open}
              >
                <span className="rung__mark" aria-hidden="true">
                  {open ? '●' : '○'}
                </span>
                <span>{rung.label}</span>
              </button>
              {hint ? <p className="rung__text">{hint.text}</p> : null}
            </li>
          );
        })}
      </ol>

      {revealed.length > 0 ? (
        <p className="hints__cost">Independent completion for this attempt: reduced.</p>
      ) : null}
    </section>
  );
}
