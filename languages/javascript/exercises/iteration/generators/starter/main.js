// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Lazy sequences: an infinite source, the tools that tame it, and an
 * iterable of your own.
 */

export function* naturals() {
  throw new Error('not implemented');
}

export function* take(iterable, n) {
  throw new Error('not implemented');
}

export function* map(iterable, fn) {
  throw new Error('not implemented');
}

export function* chain(...iterables) {
  throw new Error('not implemented');
}

export class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}
