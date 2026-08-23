// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Values, bindings and strings. */

export function divide(top, bottom) {
  // No guard. Infinity and NaN are the answers here, not errors.
  return top / bottom;
}

export function isWholeNumber(value) {
  // `value % 1 === 0` says yes to Infinity, which is the case that matters.
  return Number.isInteger(value);
}

export function addItem(basket, item) {
  basket.push(item);
  return basket;
}

export function describeBasket(basket) {
  if (basket.length === 0) return 'empty';
  const noun = basket.length === 1 ? 'item' : 'items';
  return `${basket.length} ${noun}: ${basket.join(', ')}`;
}
