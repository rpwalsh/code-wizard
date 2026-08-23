// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The untyped vendor, as installed. Everything it exports is typed as the
 * loose JSON it really is — this file is what a library without types
 * looks like to your compiler, and nothing outside main.ts should ever
 * import it.
 */

export type VendorShape =
  | string
  | number
  | boolean
  | null
  | VendorShape[]
  | { [key: string]: VendorShape };

const users: Record<number, VendorShape> = {
  1: { id: 1, login: 'ada', plan: 'pro' },
  2: { id: 2, login: 'bo', plan: 'free' },
  // The vendor lies sometimes: plan is a value your declaration never met.
  3: { id: 3, login: 'cy', plan: 'legacy-gold' },
};

const events: VendorShape[] = [
  { kind: 'login', at: '2026-08-20T10:00:00Z', payload: { ip: '10.0.0.1' } },
  { kind: 'upgrade', at: '2026-08-21T09:30:00Z', payload: {} },
  // Malformed: payload values must be strings.
  { kind: 'billing', at: '2026-08-22T08:00:00Z', payload: { amount: 42 } },
  { kind: 'logout', at: '2026-08-23T18:12:00Z', payload: { ip: '10.0.0.1' } },
  // Malformed: no timestamp at all.
  { kind: 'ghost', payload: {} },
];

export function fetchUser(id: number): VendorShape {
  return users[id] ?? null;
}

export function listEvents(): VendorShape[] {
  return events;
}
