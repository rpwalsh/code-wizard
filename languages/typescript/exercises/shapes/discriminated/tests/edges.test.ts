// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: rounding at the bottom, and the branch that must not run. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { assertNever, describe, feeCents, totalCents, type Payment } from '../main.ts';

test(
  'a fee below a cent still costs a cent',
  () => {
    // Two per cent of 10 is 0.2. Rounding down charges nothing, which makes
    // every small payment free; rounding to nearest does the same. Fees
    // round up.
    expectEqual(feeCents({ method: 'card', last4: '0000', amountCents: 10 }), 1);
    expectEqual(feeCents({ method: 'card', last4: '0000', amountCents: 1 }), 1);
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'a zero card payment costs nothing to process',
  () => {
    // The one case where rounding up must not invent a fee out of nothing.
    expectEqual(feeCents({ method: 'card', last4: '0000', amountCents: 0 }), 0);
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'a fee landing exactly on a cent is not rounded past it',
  () => {
    // Two per cent of 50 is exactly 1. Ceiling must not push it to 2.
    expectEqual(feeCents({ method: 'card', last4: '0000', amountCents: 50 }), 1);
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'assertNever refuses whatever reached it',
  () => {
    // Called here through a deliberate cast, which is the only way to reach
    // it: in real code the compiler guarantees it is unreachable, and this
    // test exists so the message is checked rather than assumed.
    const impossible = { method: 'voucher', amountCents: 100 } as unknown as never;

    let message = '';
    try {
      assertNever(impossible);
    } catch (error) {
      message = (error as Error).message;
    }

    expectTrue(message.startsWith('unhandled: '));
    expectTrue(message.includes('voucher'));
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'an unknown method reaches assertNever rather than returning nothing',
  () => {
    // The runtime half of exhaustiveness. The compiler stops a *known*
    // fourth method from being forgotten, but data arriving from a database
    // written by an older version of the code carries whatever it carries.
    // A switch whose default is missing returns undefined here and charges
    // nobody, silently, which is the bug this pattern exists to prevent.
    const stale = { method: 'voucher', amountCents: 100 } as unknown as Payment;

    let described = '';
    try {
      describe(stale);
      described = 'returned instead of throwing';
    } catch (error) {
      described = (error as Error).message;
    }
    expectTrue(described.startsWith('unhandled: '));

    let charged = '';
    try {
      feeCents(stale);
      charged = 'returned instead of throwing';
    } catch (error) {
      charged = (error as Error).message;
    }
    expectTrue(charged.startsWith('unhandled: '));
  },
  { concept: 'typescript.shapes.exhaustive' },
);

test(
  'describe reads only the fields its own member has',
  () => {
    // A transfer has no last4 and a card has no reference. If either
    // description leaked the other's field this would show it.
    expectEqual(describe({ method: 'transfer', reference: 'Z-9', amountCents: 1 }), 'transfer ref Z-9');
    expectTrue(!describe({ method: 'card', last4: '1111', amountCents: 1 }).includes('undefined'));
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'one payment totals the same as the pair of its parts',
  () => {
    const single: Payment = { method: 'card', last4: '4242', amountCents: 1000 };
    expectEqual(totalCents([single]), 1000 + feeCents(single));
  },
  { concept: 'typescript.shapes.discriminated' },
);
