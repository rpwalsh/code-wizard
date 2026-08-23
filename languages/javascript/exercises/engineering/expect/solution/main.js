// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A four-export assertion module. The exports are the contract.
 */

export class AssertionError extends Error {
  constructor(message, expected, received) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.received = received;
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepEqual(a, b) {
  // Object.is: NaN equals NaN, 0 does not equal -0 — the two places ===
  // answers wrong for a test framework.
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
    );
  }

  return false;
}

export function expectEqual(received, expected) {
  if (!deepEqual(received, expected)) {
    throw new AssertionError(
      `expected ${JSON.stringify(expected)} but received ${JSON.stringify(received)}`,
      expected,
      received,
    );
  }
}

export function expectThrows(type, fn) {
  let thrown = null;
  let completed = false;
  try {
    fn();
    completed = true;
  } catch (error) {
    thrown = error;
  }

  // Decided outside the try, so our own AssertionError cannot be caught
  // by our own catch — the classic test-framework trap.
  if (completed) {
    throw new AssertionError(`expected ${type.name} but nothing was thrown`, type.name, undefined);
  }
  if (!(thrown instanceof type)) {
    throw new AssertionError(
      `expected ${type.name} but ${thrown.constructor.name} was thrown`,
      type.name,
      thrown.constructor.name,
    );
  }
  return thrown;
}
