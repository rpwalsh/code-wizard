// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A four-export assertion module. The exports are the contract.
 */

export class AssertionError extends Error {
  // name, expected, received
}

export function deepEqual(a, b) {
  throw new Error('not implemented');
}

export function expectEqual(received, expected) {
  throw new Error('not implemented');
}

export function expectThrows(type, fn) {
  throw new Error('not implemented');
}
