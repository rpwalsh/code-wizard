// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Lazy sequences: an infinite source, the tools that tame it, and an
 * iterable of your own.
 */

export function* naturals() {
  // Runs only when a consumer asks; infinity is data here, not a hang.
  let n = 0;
  while (true) yield n++;
}

export function* take(iterable, n) {
  // The guard sits before the loop and after each yield, so the source is
  // never pulled for a value nobody will receive — take(anything, 0) pulls
  // nothing at all.
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

export function* map(iterable, fn) {
  for (const value of iterable) {
    yield fn(value);
  }
}

export function* chain(...iterables) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

export class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  // A generator method: every for...of calls this afresh, which is why a
  // Range survives being iterated twice when a bare generator would not.
  *[Symbol.iterator]() {
    for (let value = this.start; value < this.end; value += 1) {
      yield value;
    }
  }
}
