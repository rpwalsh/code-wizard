// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Destructuring at the boundary: options, nested fields, and the rest.
 */

export function connect({ host, port = 5432, secure = false } = {}) {
  // The outer = {} is what lets connect() behave like connect({}).
  if (host === undefined) {
    throw new TypeError('host is required');
  }
  return `pg://${host}:${port}${secure ? '+tls' : ''}`;
}

export function splitUser(user) {
  const {
    name,
    contact: { email, phone = 'none' },
    ...rest
  } = user;

  // rest is a new object that never received name or contact — the input
  // is untouched, which is what makes this a split rather than a strip.
  return { name, contact: `${email} <${phone}>`, rest };
}

export function firstAndLast(items) {
  const first = items[0];
  const last = items.length === 0 ? undefined : items[items.length - 1];
  return { first, last, count: items.length };
}
