// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Errors that carry their cause, and the three ways to await many.
 */

export function wrap(cause, message, code) {
  // The options object is the second argument. Passing the cause as a bare
  // second argument silently produces an error with no cause at all.
  const error = new Error(message, { cause });
  error.code = code;
  return error;
}

export function rootCause(error) {
  // A loop rather than recursion, so the cycle guard is a set rather than a
  // depth counter. Two layers that wrap each other in a retry produce a real
  // cycle, and an error handler that hangs is worse than the error.
  const seen = new Set();
  let current = error;

  while (current && current.cause && !seen.has(current.cause)) {
    seen.add(current);
    current = current.cause;
  }

  return current;
}

export async function settle(tasks) {
  // allSettled, because the caller wants the report rather than the first
  // disappointment. It never rejects, so there is nothing to catch here.
  const results = await Promise.allSettled(tasks.map((task) => task()));

  const values = [];
  const failures = [];
  for (const result of results) {
    if (result.status === 'fulfilled') values.push(result.value);
    else failures.push(result.reason.message);
  }

  return { values, failures };
}

export async function firstSuccess(tasks) {
  try {
    return await Promise.any(tasks.map((task) => task()));
  } catch (error) {
    // Promise.any rejects with an AggregateError, whose own message says
    // nothing useful. The reasons are in `errors`, in the order given.
    // Testing the type rather than probing for the property: an empty task
    // list rejects with an AggregateError carrying no errors at all, and
    // that is still the aggregate case rather than a single failure.
    const reasons = error instanceof AggregateError ? error.errors : [error];
    throw new Error(reasons.map((reason) => reason.message).join('; '));
  }
}
