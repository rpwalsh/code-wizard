// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Literal unions: types with exactly the inhabitants you meant.
 */

export type Level = 'debug' | 'info' | 'warn' | 'error';

// as const: the value is the type — readonly, four long, literal members.
// Without it this widens to string[] and isLevel loses its source of truth.
export const LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export function severity(level: Level): number {
  switch (level) {
    case 'debug':
      return 0;
    case 'info':
      return 1;
    case 'warn':
      return 2;
    case 'error':
      return 3;
    default: {
      // If a case above were missing, level would still have a type here,
      // and never refuses every type. Adding a level breaks this build —
      // which is the point.
      const exhaustive: never = level;
      return exhaustive;
    }
  }
}

export function atLeast(
  messages: readonly { level: Level; text: string }[],
  level: Level,
): { level: Level; text: string }[] {
  const cutoff = severity(level);
  return messages.filter((message) => severity(message.level) >= cutoff);
}

export function isLevel(value: string): value is Level {
  // Derived from LEVELS: a fifth level added there is accepted here
  // without edits. The widening cast is on the array, not the answer.
  return (LEVELS as readonly string[]).includes(value);
}
