// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The application bar: identity on the left, navigation beside it, and the
 * session-wide controls — language, theme, training mode — on the right.
 *
 * The language selector lives here and not on any one screen, because the
 * choice scopes all of them: the plan, the map, the catalog and the
 * practice deck all answer for one language at a time.
 */
import type { TrainingMode } from '@code-wizard/core';
import { isTrainingMode, withdrawalLadder } from '@code-wizard/core';

import type { ThemeChoice } from '../ThemeSwitch.tsx';
import { ThemeSwitch } from '../ThemeSwitch.tsx';

export interface LanguageOption {
  readonly id: string;
  readonly title: string;
  /** False for course-only languages: practicable, but nothing runs here. */
  readonly runnable: boolean;
}

export type Section = 'home' | 'map' | 'practice';

interface TopBarProps {
  readonly section: Section | null;
  readonly onSection: (section: Section) => void;

  readonly languages: readonly LanguageOption[];
  readonly language: string;
  readonly onLanguage: (id: string) => void;

  readonly theme: ThemeChoice;
  readonly onTheme: (choice: ThemeChoice) => void;

  readonly mode: TrainingMode;
  readonly onMode: (mode: TrainingMode) => void;

  readonly onPalette: () => void;
  readonly onHandbook: () => void;
  /** True while an attempt is open: switching would discard it. */
  readonly languageLocked?: boolean;
  /**
   * Whether an attempt is open.
   *
   * Changing the mode remounts the workspace, because Learn and Fluency grade
   * differently and carrying revealed hints between them would corrupt the
   * record. That is right, and it must not be reachable by a stray click on a
   * dropdown while somebody is halfway through writing a solution — the same
   * reason the language picker locks.
   */
  readonly modeLocked?: boolean;
}

const SECTIONS: readonly { readonly id: Section; readonly name: string }[] = [
  { id: 'home', name: 'Today' },
  { id: 'map', name: 'Skill map' },
  { id: 'practice', name: 'Practice' },
];

export function TopBar({
  section,
  onSection,
  languages,
  language,
  onLanguage,
  theme,
  onTheme,
  mode,
  onMode,
  onPalette,
  onHandbook,
  languageLocked = false,
  modeLocked = false,
}: TopBarProps) {
  const practiceOnly = languages.some(
    (option) => option.id === language && !option.runnable,
  );

  return (
    <header className="topbar">
      <span className="wordmark">Code Wizard</span>

      <nav className="topbar__nav" aria-label="Sections">
        {SECTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="navlink"
            aria-current={section === entry.id ? 'true' : undefined}
            onClick={() => onSection(entry.id)}
          >
            {entry.name}
          </button>
        ))}
      </nav>

      <label className="language-picker">
        <span className="visually-hidden">Language</span>
        <select
          className="language-select"
          value={language}
          disabled={languageLocked}
          title={
            languageLocked
              ? 'Finish or leave this exercise before switching language'
              : undefined
          }
          onChange={(event) => onLanguage(event.target.value)}
        >
          {languages.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
              {option.runnable ? '' : ' — practice'}
            </option>
          ))}
        </select>
      </label>

      {practiceOnly ? (
        <p className="topbar__note">
          <strong>practice</strong> = reading and reasoning here; writing and running it needs
          the desktop app
        </p>
      ) : null}

      <span className="topbar__spacer" />

      <button
        type="button"
        className="button button--bare"
        onClick={onHandbook}
        aria-label="Open the handbook"
        title="Handbook"
      >
        ?
      </button>

      <button
        type="button"
        className="button button--bare"
        onClick={onPalette}
        aria-label="Open commands"
      >
        <kbd>Ctrl K</kbd>
      </button>

      <ThemeSwitch choice={theme} onChoose={onTheme} />

      <span className="mode-indicator" data-mode={mode}>
        <span className="mode-indicator__dot" aria-hidden="true" />
        <label>
          <span className="visually-hidden">Training mode</span>
          <select
            className="mode-select"
            value={mode}
            disabled={modeLocked}
            title={
              modeLocked ? 'Finish or leave this exercise before changing mode' : undefined
            }
            onChange={(event) => {
              const chosen = event.target.value;
              // Checked rather than asserted: the value comes back from the
              // DOM as a plain string, and a cast would only be a promise.
              if (isTrainingMode(chosen)) onMode(chosen);
            }}
          >
            {withdrawalLadder.map((rung) => (
              <option key={rung.mode} value={rung.mode} title={`Withdraws: ${rung.withdraws}`}>
                {rung.name}
              </option>
            ))}
          </select>
        </label>
      </span>
    </header>
  );
}
