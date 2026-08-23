// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Equality drills. */

/**
 * Absent means null or undefined, and nothing else.
 *
 * Written once so both callers agree. `value == null` is the idiomatic
 * shorthand for exactly this pair, and is the one place loose equality is
 * genuinely the right tool — which is also why swapping `===` for `==` here
 * cannot be detected by any input.
 */
function isAbsent(value) {
  return value === null || value === undefined;
}

export function isBlank(text) {
  if (isAbsent(text)) return true;
  return text.trim().length === 0;
}

export function orDefault(value, fallback) {
  // `??` and not `||`: a zero, an empty string and a false are real answers.
  return value ?? fallback;
}

export function sameValue(a, b) {
  return Object.is(a, b);
}

export function describe(value) {
  if (isAbsent(value)) return 'absent';
  if (value === '') return 'empty';
  if (value === 0) return 'zero';
  if (value === false) return 'false';
  return 'present';
}
