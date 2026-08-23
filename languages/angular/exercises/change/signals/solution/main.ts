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

/** A reader is anything that must be woken when a value it read changes. */
interface Reader {
  wake: () => void;
  /** The signals this reader subscribed to on its last run. */
  sources: Set<Set<Reader>>;
}

// The one global the whole design rests on: who is running right now.
let currentReader: Reader | null = null;

/** Drop the reader's old subscriptions; a fresh run resubscribes honestly. */
function untrack(reader: Reader): void {
  for (const subscribers of reader.sources) {
    subscribers.delete(reader);
  }
  reader.sources.clear();
}

function runAs(reader: Reader, body: () => void): void {
  untrack(reader);
  const previous = currentReader;
  currentReader = reader;
  try {
    body();
  } finally {
    currentReader = previous;
  }
}

export function signal<T extends SignalValue>(initial: T): WritableSignal<T> {
  let value = initial;
  const subscribers = new Set<Reader>();

  return {
    get: () => {
      if (currentReader !== null) {
        subscribers.add(currentReader);
        currentReader.sources.add(subscribers);
      }
      return value;
    },
    set: (next: T) => {
      // An equal write wakes nobody — this is what keeps signal graphs cheap.
      if (Object.is(value, next)) return;
      value = next;
      for (const reader of [...subscribers]) {
        reader.wake();
      }
    },
  };
}

export function computed<T extends SignalValue>(fn: () => T): ReadableSignal<T> {
  let cached: T;
  let stale = true;
  const subscribers = new Set<Reader>();

  const reader: Reader = {
    sources: new Set(),
    wake: () => {
      stale = true;
      // Staleness propagates; recomputation waits for a read.
      for (const dependent of [...subscribers]) {
        dependent.wake();
      }
    },
  };

  return {
    get: () => {
      if (stale) {
        runAs(reader, () => {
          cached = fn();
        });
        stale = false;
      }
      if (currentReader !== null) {
        subscribers.add(currentReader);
        currentReader.sources.add(subscribers);
      }
      return cached;
    },
  };
}

export function effect(fn: () => void): { stop: () => void } {
  let stopped = false;
  const reader: Reader = {
    sources: new Set(),
    wake: () => {
      if (!stopped) runAs(reader, fn);
    },
  };

  runAs(reader, fn);

  return {
    stop: () => {
      stopped = true;
      untrack(reader);
    },
  };
}

export function renderTemplate(
  template: string,
  values: Record<string, ReadableSignal<SignalValue>>,
): string {
  return template.replace(/\{\{(\w+)\}\}/gu, (match, key: string) => {
    const source = values[key];
    if (source === undefined) {
      // undefined in the page is the worst way for a template to fail.
      throw new Error(`unknown template key: ${key}`);
    }
    return String(source.get());
  });
}
