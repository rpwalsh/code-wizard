// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three shapes of "run these": fail fast, collect everything, and
 * collect everything without running everything at once.
 */

/** Failure reshaped into data, so the promise itself cannot reject. */
function settle(task) {
  return task().then(
    (value) => ({ ok: true, value }),
    (reason) => ({ ok: false, reason }),
  );
}

/** Start every task now; results in input order; one rejection rejects all. */
export function fetchAll(tasks) {
  // Calling every task before awaiting any is what makes this concurrent.
  return Promise.all(tasks.map((task) => task()));
}

/** Always resolves: { ok: true, value } or { ok: false, reason } per task. */
export function fetchSettled(tasks) {
  // Promise.all only fails fast because its inputs can reject; these cannot.
  return Promise.all(tasks.map(settle));
}

/** Like fetchSettled, but at most `limit` tasks in flight at once. */
export async function fetchLimited(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      // Claimed synchronously — no await between reading and advancing the
      // cursor, so two workers cannot take the same index.
      const index = next;
      next += 1;
      results[index] = await settle(tasks[index]);
    }
  }

  const workers = [];
  for (let count = 0; count < Math.min(limit, tasks.length); count += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return results;
}
