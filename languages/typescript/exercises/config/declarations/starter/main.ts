// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The typed wrapper: declarations for the vendor's shapes, guards that
 * verify them, and the only import of vendor.ts in the codebase.
 */
import * as vendor from './vendor.ts';
import type { VendorShape } from './vendor.ts';

// Declare VendorUser and VendorEvent here.

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

export function isVendorUser(value: VendorShape): value is VendorUser {
  throw new Error('not implemented');
}

export function isVendorEvent(value: VendorShape): value is VendorEvent {
  throw new Error('not implemented');
}

export function getUser(id: number): VendorUser {
  throw new Error('not implemented');
}

export function recentEvents(since: string): VendorEvent[] {
  throw new Error('not implemented');
}

export function planLabel(user: VendorUser): string {
  throw new Error('not implemented');
}
