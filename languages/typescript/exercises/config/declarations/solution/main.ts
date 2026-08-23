// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The typed wrapper: declarations for the vendor's shapes, guards that
 * verify them, and the only import of vendor.ts in the codebase.
 */
import * as vendor from './vendor.ts';
import type { VendorShape } from './vendor.ts';

// These interfaces are a .d.ts with a pulse: the same claims a declaration
// file would make, kept honest by the guards below them.

export interface VendorUser {
  id: number;
  login: string;
  plan: 'free' | 'pro';
}

export interface VendorEvent {
  kind: string;
  at: string;
  payload: Record<string, string>;
}

function isRecord(value: VendorShape): value is { [key: string]: VendorShape } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isVendorUser(value: VendorShape): value is VendorUser {
  return (
    isRecord(value) &&
    typeof value['id'] === 'number' &&
    typeof value['login'] === 'string' &&
    // The literal union: declared by us, verified by us. 'legacy-gold'
    // stops here instead of spreading through the plan switch.
    (value['plan'] === 'free' || value['plan'] === 'pro')
  );
}

export function isVendorEvent(value: VendorShape): value is VendorEvent {
  if (!isRecord(value)) return false;
  if (typeof value['kind'] !== 'string' || typeof value['at'] !== 'string') return false;

  const payload = value['payload'];
  return (
    isRecord(payload) &&
    Object.values(payload).every((entry) => typeof entry === 'string')
  );
}

export function getUser(id: number): VendorUser {
  const raw = vendor.fetchUser(id);
  // A user lookup that returns garbage must stop the line, loudly, here.
  if (!isVendorUser(raw)) {
    throw new Error('vendor contract violation: user');
  }
  return raw;
}

export function recentEvents(since: string): VendorEvent[] {
  // A feed tolerates bad entries: deliver the forty-nine good ones.
  return vendor
    .listEvents()
    .filter(isVendorEvent)
    .filter((event) => event.at >= since);
}

export function planLabel(user: VendorUser): string {
  // The payoff: vendor data with a declared literal union gets the same
  // exhaustiveness safety as our own types.
  switch (user.plan) {
    case 'free':
      return 'Free plan';
    case 'pro':
      return 'Pro plan';
  }
}
