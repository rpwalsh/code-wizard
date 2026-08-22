/**
 * Light, dark, or whatever the machine already decided.
 *
 * Three states rather than two. "System" is the default and is not a fudge:
 * someone whose display already shifts at dusk should not have to shift this
 * as well, and a two-state switch forces them to pick a side and then be wrong
 * for half the day.
 *
 * The choice is written to the document root, where the stylesheet reads it,
 * and persisted by the caller. Nothing here talks to storage — a component
 * that both renders and persists is a component you cannot test.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

export const themeChoices: readonly ThemeChoice[] = Object.freeze(['system', 'light', 'dark']);

export function isThemeChoice(value: string): value is ThemeChoice {
  return themeChoices.some((choice) => choice === value);
}

/**
 * Put the choice where CSS can see it.
 *
 * "System" removes the attribute rather than setting it to anything, so the
 * media query is what decides — which is the only way the page keeps following
 * the machine after the user changes it.
 */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', choice);
}

const LABELS: Readonly<Record<ThemeChoice, string>> = Object.freeze({
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
});

export function ThemeSwitch({
  choice,
  onChoose,
}: {
  readonly choice: ThemeChoice;
  readonly onChoose: (choice: ThemeChoice) => void;
}) {
  return (
    <div className="theme-switch" role="group" aria-label="Appearance">
      {themeChoices.map((candidate) => (
        <button
          key={candidate}
          type="button"
          className="theme-switch__option"
          aria-pressed={candidate === choice}
          onClick={() => onChoose(candidate)}
        >
          {LABELS[candidate]}
        </button>
      ))}
    </div>
  );
}
