import type { ExperienceLevel } from '@forge/curriculum';
import { useState } from 'react';

interface OnboardingProps {
  readonly onChoose: (level: ExperienceLevel) => Promise<void>;
}

const CHOICES: readonly {
  level: ExperienceLevel;
  title: string;
  detail: string;
}[] = [
  {
    level: 'new-to-language',
    title: 'I program, but not in Python',
    detail: 'Fluent elsewhere. You know what a dictionary is; you look up how to write one.',
  },
  {
    level: 'rusty',
    title: 'I have written Python, a while ago',
    detail: 'It comes back when you see it, but not when you need it.',
  },
  {
    level: 'working-knowledge',
    title: 'I write Python regularly',
    detail: 'You want speed and recall, not concepts.',
  },
  {
    level: 'new-to-programming',
    title: 'I am new to programming',
    detail: 'Start from the beginning. Nothing is assumed.',
  },
];

/**
 * First run (spec §30).
 *
 * Asked once, because the alternative is worse in both directions: without a
 * starting point the recommender has no evidence and locks the entire graph,
 * and with a generous default an experienced engineer is marched through
 * material they already know.
 *
 * What the answer sets is deliberately narrow. Knowledge and recognition get
 * the declared prior; recall, speed and independence start at zero and have to
 * be earned. Saying you know Python is not evidence that you can write it.
 */
export function Onboarding({ onChoose }: OnboardingProps) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="onboarding">
      <div className="onboarding__inner">
        <p className="boot__mark">Forge</p>
        <h1 className="onboarding__question">How much Python have you written?</h1>
        <p className="onboarding__note">
          This only sets a starting point so the curriculum knows where to begin. Everything that
          gets measured, you will measure by writing code.
        </p>

        <ul className="onboarding__choices">
          {CHOICES.map((choice) => (
            <li key={choice.level}>
              <button
                type="button"
                className="onboarding__choice"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void onChoose(choice.level).finally(() => setBusy(false));
                }}
              >
                <span className="onboarding__choice-title">{choice.title}</span>
                <span className="onboarding__choice-detail">{choice.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
