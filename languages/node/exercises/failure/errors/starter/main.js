// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Errors that carry their cause, and the three ways to await many.
 */

export function wrap(cause, message, code) {
  throw new Error('not implemented');
}

export function rootCause(error) {
  throw new Error('not implemented');
}

export async function settle(tasks) {
  throw new Error('not implemented');
}

export async function firstSuccess(tasks) {
  throw new Error('not implemented');
}
