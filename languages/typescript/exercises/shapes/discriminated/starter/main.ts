// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three kinds of payment, and a compiler that knows when one is forgotten.
 */

export type Payment = { method: 'card'; last4: string; amountCents: number };

export function describe(payment: Payment): string {
  throw new Error('not implemented');
}

export function feeCents(payment: Payment): number {
  throw new Error('not implemented');
}

export function assertNever(value: never): never {
  throw new Error('not implemented');
}

export function totalCents(payments: Payment[]): number {
  throw new Error('not implemented');
}
