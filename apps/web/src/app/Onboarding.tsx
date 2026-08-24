// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ExperienceLevel } from '@code-wizard/curriculum';
import { useState } from 'react';

import type { LanguageOption } from '../components/layout/TopBar.tsx';

interface OnboardingProps {
  readonly languages: readonly LanguageOption[];
  readonly onChoose: (language: string, level: ExperienceLevel) => Promise<void>;
}

const LEVELS: readonly {
  level: ExperienceLevel;
  title: (language: string) => string;
  detail: string;
}[] = [
  {
    level: 'new-to-language',
    title: (language) => `I program, but not in ${language}`,
    detail: 'Fluent elsewhere. You know the concepts; you look up the spelling.',
  },
  {
    level: 'rusty',
    title: (language) => `I have written ${language}, a while ago`,
    detail: 'It comes back when you see it, but not when you need it.',
  },
  {
    level: 'working-knowledge',
    title: (language) => `I write ${language} regularly`,
    detail: 'You want speed and recall, not concepts.',
  },
  {
    level: 'new-to-programming',
    title: () => 'I am new to programming',
    detail: 'Start from the beginning. Nothing is assumed.',
  },
];

/**
 * First run (spec §30), in two steps: which language, then how much of it.
 *
 * The language comes first because every later screen is scoped by it — the
 * plan, the map, the practice deck. Asking about Python specifically, as an
 * earlier version did, made a fourteen-language product introduce itself as
 * a one-language product wearing a big catalog.
 *
 * What the answer sets is deliberately narrow. Knowledge and recognition get
 * the declared prior; recall, speed and independence start at zero and have
 * to be earned. Saying you know a language is not evidence you can write it.
 */
export function Onboarding({ languages, onChoose }: OnboardingProps) {
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState<LanguageOption | null>(null);

  if (chosen === null) {
    return (
      <main className="onboarding">
        <div className="onboarding__inner">
          <p className="boot__mark">Code Wizard</p>
          <h1 className="onboarding__question">Which language are you here to get back?</h1>
          <p className="onboarding__note">
            You can switch at any time from the bar at the top — this only decides where today
            starts.
          </p>

          <ul className="onboarding__choices onboarding__choices--grid">
            {languages.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="onboarding__choice"
                  onClick={() => setChosen(option)}
                >
                  <span className="onboarding__choice-title">{option.title}</span>
                  <span className="onboarding__choice-detail">
                    {option.runnable
                      ? 'Exercises, lessons and activities'
                      : 'Activities here; exercises on the desktop app'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding">
      <div className="onboarding__inner">
        <p className="boot__mark">Code Wizard</p>
        <h1 className="onboarding__question">How much {chosen.title} have you written?</h1>
        <p className="onboarding__note">
          This only sets a starting point so the curriculum knows where to begin. Everything that
          gets measured, you will measure by writing code.
        </p>

        <ul className="onboarding__choices">
          {LEVELS.map((choice) => (
            <li key={choice.level}>
              <button
                type="button"
                className="onboarding__choice"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void onChoose(chosen.id, choice.level).finally(() => setBusy(false));
                }}
              >
                <span className="onboarding__choice-title">{choice.title(chosen.title)}</span>
                <span className="onboarding__choice-detail">{choice.detail}</span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="button button--bare" onClick={() => setChosen(null)}>
          ← Different language
        </button>
      </div>
    </main>
  );
}
