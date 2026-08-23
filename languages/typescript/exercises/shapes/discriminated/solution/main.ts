// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Three kinds of payment, and a compiler that knows when one is forgotten.
 */

/**
 * The tag has to be a literal type on every member. Written as
 * `method: string` this union narrows nothing, because any string could
 * belong to any member and the compiler cannot tell them apart.
 */
export type Payment =
  | { method: 'card'; last4: string; amountCents: number }
  | { method: 'transfer'; reference: string; amountCents: number }
  | { method: 'credit'; amountCents: number };

export function describe(payment: Payment): string {
  switch (payment.method) {
    case 'card':
      // `last4` is a string here with no assertion and no optional chaining:
      // the switch told the compiler which member this is.
      return `card ending ${payment.last4}`;
    case 'transfer':
      return `transfer ref ${payment.reference}`;
    case 'credit':
      return 'store credit';
    default:
      return assertNever(payment);
  }
}

export function feeCents(payment: Payment): number {
  switch (payment.method) {
    case 'card':
      // Fees round up. Rounding down would process every payment under
      // fifty cents for nothing at all.
      return Math.ceil(payment.amountCents * 0.02);
    case 'transfer':
      return 30;
    case 'credit':
      return 0;
    default:
      return assertNever(payment);
  }
}

/**
 * Reachable only if the switch above is not exhaustive.
 *
 * In a branch that cannot happen the value's type is `never`, and `never`
 * is assignable to nothing — so a fourth payment method makes every switch
 * that forgot it fail to compile, naming the file and the line.
 */
export function assertNever(value: never): never {
  throw new Error(`unhandled: ${JSON.stringify(value)}`);
}

export function totalCents(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amountCents + feeCents(payment), 0);
}
