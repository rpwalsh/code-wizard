// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Literal unions: types with exactly the inhabitants you meant.
 */

export type Level = 'debug' | 'info' | 'warn' | 'error';

export const LEVELS = ['debug', 'info', 'warn', 'error'];

export function severity(level: Level): number {
  throw new Error('not implemented');
}

export function atLeast(
  messages: readonly { level: Level; text: string }[],
  level: Level,
): { level: Level; text: string }[] {
  throw new Error('not implemented');
}

export function isLevel(value: string): value is Level {
  throw new Error('not implemented');
}
