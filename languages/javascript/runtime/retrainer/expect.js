/**
 * Assertion helpers that carry structured expectation data.
 *
 * A thrown `Error` gives the harness one rendered string. These carry the
 * expected and received values as separate fields, so the test panel can show
 *
 *     Expected:
 *     [1, 2]
 *
 *     Received:
 *     undefined
 *
 * instead of a wall of stack trace. Deliberately the same shape as the Python
 * side, because the engine above the runtime must not be able to tell which
 * language produced a failure.
 */

const MAX = 240;

export class ExpectationError extends Error {
  constructor(message, { summary, expected, received, concept }) {
    super(message ?? summary);
    this.name = 'ExpectationError';
    // Read off the error by the harness. Namespaced so they cannot collide
    // with anything a learner attaches to an error of their own.
    this.retrainerMessage = message ?? null;
    this.retrainerExpected = expected ?? null;
    this.retrainerReceived = received ?? null;
    this.retrainerConcept = concept ?? null;
  }
}

/**
 * A short, stable rendering.
 *
 * `JSON.stringify` is not enough on its own: it turns `undefined` into nothing
 * at all and throws on a cycle, and both of those are exactly the values a
 * learner is most likely to produce by accident.
 */
export function render(value) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
  if (typeof value === 'bigint') return `${value}n`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Map) return `Map(${value.size}) ${shorten(JSON.stringify([...value]))}`;
  if (value instanceof Set) return `Set(${value.size}) ${shorten(JSON.stringify([...value]))}`;

  try {
    const text = JSON.stringify(value);
    return text === undefined ? String(value) : shorten(text);
  } catch {
    return shorten(String(value));
  }
}

function shorten(text) {
  return text.length <= MAX ? text : `${text.slice(0, MAX)}…`;
}

function fail(message, summary, expected, received, concept) {
  throw new ExpectationError(message, { summary, expected, received, concept });
}

/**
 * Deep structural equality.
 *
 * `===` is useless for the shapes exercises actually return, and comparing
 * `JSON.stringify` output silently calls `[1, 2]` equal to `{0: 1, 1: 2}` in
 * some shapes and disagrees about key order in others.
 */
export function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  }

  if (a instanceof Map && b instanceof Map) {
    return (
      a.size === b.size && [...a].every(([key, value]) => b.has(key) && equal(value, b.get(key)))
    );
  }
  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every((item) => b.has(item));
  }

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));
}

export function expectEqual(received, expected, options = {}) {
  if (equal(received, expected)) return;
  fail(
    options.message,
    'values are not equal',
    render(expected),
    render(received),
    options.concept,
  );
}

export function expectTrue(received, options = {}) {
  if (received) return;
  fail(options.message, 'expected a truthy value', 'truthy', render(received), options.concept);
}

export function expectFalse(received, options = {}) {
  if (!received) return;
  fail(options.message, 'expected a falsy value', 'falsy', render(received), options.concept);
}

export function expectClose(received, expected, options = {}) {
  const tolerance = options.tolerance ?? 1e-9;
  if (Math.abs(received - expected) <= tolerance) return;
  fail(
    options.message,
    `values differ by more than ${tolerance}`,
    render(expected),
    render(received),
    options.concept,
  );
}

/**
 * Assert that `call` throws, and return what it threw.
 *
 * `type` may be an error constructor or a string matched against the name, so
 * an exercise can require `TypeError` without importing anything.
 */
export function expectThrows(type, call, options = {}) {
  const wanted = typeof type === 'string' ? type : type.name;
  let result;
  try {
    result = call();
  } catch (error) {
    const name = error instanceof Error ? error.name : typeof error;
    const matches = typeof type === 'string' ? name === type : error instanceof type;
    if (matches) return error;
    fail(
      options.message,
      `expected ${wanted}`,
      `${wanted} to be thrown`,
      render(error),
      options.concept,
    );
  }
  fail(
    options.message,
    `expected ${wanted}`,
    `${wanted} to be thrown`,
    `returned ${render(result)} without throwing`,
    options.concept,
  );
}
