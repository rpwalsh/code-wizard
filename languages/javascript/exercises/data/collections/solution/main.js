// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Maps and Sets, for keys that come from data rather than from you.
 */

export function countBy(items, keyOf) {
  // A Map rather than an object: keys keep their type, so 1 and '1' stay
  // apart, and there is no inherited `constructor` to collide with.
  const counts = new Map();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

export function uniqueBy(items, keyOf) {
  const seen = new Set();
  const first = [];
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    first.push(item);
  }
  return first;
}

export function intersect(left, right) {
  // One pass, after one pass to build the set. The version that calls
  // right.includes(value) inside the loop scans the whole right list for
  // every element on the left.
  const wanted = new Set(right);
  const emitted = new Set();
  const both = [];

  for (const value of left) {
    if (!wanted.has(value) || emitted.has(value)) continue;
    emitted.add(value);
    both.push(value);
  }

  return both;
}

export function pluck(record, key) {
  // `key in record` would answer yes for 'toString' on an empty object.
  return Object.hasOwn(record, key) ? record[key] : undefined;
}
