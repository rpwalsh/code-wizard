// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three shapes of "run these": fail fast, collect everything, and
 * collect everything without running everything at once.
 */

/** Start every task now; results in input order; one rejection rejects all. */
export function fetchAll(tasks) {
  throw new Error('not implemented');
}

/** Always resolves: { ok: true, value } or { ok: false, reason } per task. */
export function fetchSettled(tasks) {
  throw new Error('not implemented');
}

/** Like fetchSettled, but at most `limit` tasks in flight at once. */
export function fetchLimited(tasks, limit) {
  throw new Error('not implemented');
}
