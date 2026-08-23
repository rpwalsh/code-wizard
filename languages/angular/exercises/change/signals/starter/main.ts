// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Signals: values that know who read them, and a template that reads them.
 */

export interface ReadableSignal<T> {
  get: () => T;
}

export interface WritableSignal<T> extends ReadableSignal<T> {
  set: (next: T) => void;
}

export type SignalValue = string | number | boolean;

export function signal<T extends SignalValue>(initial: T): WritableSignal<T> {
  throw new Error('not implemented');
}

export function computed<T extends SignalValue>(fn: () => T): ReadableSignal<T> {
  throw new Error('not implemented');
}

export function effect(fn: () => void): { stop: () => void } {
  throw new Error('not implemented');
}

export function renderTemplate(
  template: string,
  values: Record<string, ReadableSignal<SignalValue>>,
): string {
  throw new Error('not implemented');
}
