// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Array drills. */

export function activeNames(items) {
  return items.filter((item) => item.active).map((item) => item.name);
}

export function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function cheapestFirst(items) {
  // A copy first: sort changes the array it is called on, and returns it too,
  // which is what makes the mistake look like it worked.
  return [...items].sort((a, b) => a.price - b.price);
}

export function firstPriceOver(items, limit) {
  // `??` and not `||`: a price of zero is a real answer, and `||` would
  // turn it into null. find also gives undefined rather than null, which
  // vanishes entirely in JSON where null survives.
  return items.find((item) => item.price > limit)?.price ?? null;
}
