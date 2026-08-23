// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * One temperature, two fields. The state lives above both.
 */

export interface PairState {
  readonly celsius: string;
  readonly fahrenheit: string;
}

export type Scale = 'celsius' | 'fahrenheit';

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function toFahrenheit(celsius: number): number {
  return round1((celsius * 9) / 5 + 32);
}

export function toCelsius(fahrenheit: number): number {
  return round1(((fahrenheit - 32) * 5) / 9);
}

export function convert(state: PairState, edited: Scale, text: string): PairState {
  const other: Scale = edited === 'celsius' ? 'fahrenheit' : 'celsius';

  // The field under the cursor keeps its raw text — reformatting it is how
  // inputs fight their users. Only the other field gets computed.
  const trimmed = text.trim();
  const value = Number(trimmed);
  const parses = trimmed !== '' && Number.isFinite(value);

  const converted = !parses
    ? ''
    : edited === 'celsius'
      ? String(toFahrenheit(value))
      : String(toCelsius(value));

  return { ...state, [edited]: text, [other]: converted };
}

export function TemperatureInput({
  scale,
  value,
  onTextChange,
}: {
  scale: Scale;
  value: string;
  onTextChange: (text: string) => void;
}) {
  const label = scale.charAt(0).toUpperCase() + scale.slice(1);
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onTextChange(event.target.value)} />
    </label>
  );
}

export function TemperaturePair({
  state,
  onEdit,
}: {
  state: PairState;
  onEdit: (scale: Scale, text: string) => void;
}) {
  // No state here at all — both fields are views of what the parent owns.
  return (
    <div>
      <TemperatureInput
        scale="celsius"
        value={state.celsius}
        onTextChange={(text) => onEdit('celsius', text)}
      />
      <TemperatureInput
        scale="fahrenheit"
        value={state.fahrenheit}
        onTextChange={(text) => onEdit('fahrenheit', text)}
      />
    </div>
  );
}
