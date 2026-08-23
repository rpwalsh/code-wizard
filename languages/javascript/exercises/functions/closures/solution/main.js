// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three closures: a counter, a run-once wrapper, and a cache.
 */

export function makeCounter(start = 0) {
  // Fresh per call — this line is why two counters cannot share state.
  let value = start;
  return {
    next: () => value++,
    peek: () => value,
  };
}

export function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

export function memoize(fn) {
  // A Map, not an object: object keys are strings, and 1 and '1' must not
  // collide. Map.has also caches an undefined result honestly.
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}
