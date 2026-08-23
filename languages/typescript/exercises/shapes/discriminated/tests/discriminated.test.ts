// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: each member described, and each fee charged. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { describe, feeCents, totalCents, type Payment } from '../main.ts';

const card: Payment = { method: 'card', last4: '4242', amountCents: 2500 };
const transfer: Payment = { method: 'transfer', reference: 'ABC-1', amountCents: 9000 };
const credit: Payment = { method: 'credit', amountCents: 500 };

test(
  'each member describes itself with its own fields',
  () => {
    expectEqual(describe(card), 'card ending 4242');
    expectEqual(describe(transfer), 'transfer ref ABC-1');
    expectEqual(describe(credit), 'store credit');
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'a card is charged two per cent',
  () => {
    expectEqual(feeCents(card), 50);
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'a transfer is charged a flat thirty',
  () => {
    expectEqual(feeCents(transfer), 30);
    // Flat means flat: ten times the amount, the same fee.
    expectEqual(feeCents({ method: 'transfer', reference: 'X', amountCents: 90_000 }), 30);
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'store credit is free',
  () => {
    expectEqual(feeCents(credit), 0);
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'the total is every amount plus every fee',
  () => {
    // 2500 + 50, 9000 + 30, 500 + 0
    expectEqual(totalCents([card, transfer, credit]), 12_080);
  },
  { concept: 'typescript.shapes.discriminated' },
);

test(
  'an empty list totals nothing',
  () => {
    expectEqual(totalCents([]), 0);
  },
  { concept: 'typescript.shapes.discriminated' },
);
