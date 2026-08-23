// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * One temperature, two fields. The state lives above both.
 */

export interface PairState {
  readonly celsius: string;
  readonly fahrenheit: string;
}

export type Scale = 'celsius' | 'fahrenheit';

export function toFahrenheit(celsius: number): number {
  throw new Error('not implemented');
}

export function toCelsius(fahrenheit: number): number {
  throw new Error('not implemented');
}

export function convert(state: PairState, edited: Scale, text: string): PairState {
  throw new Error('not implemented');
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
  return null;
}

export function TemperaturePair({
  state,
  onEdit,
}: {
  state: PairState;
  onEdit: (scale: Scale, text: string) => void;
}) {
  return null;
}
