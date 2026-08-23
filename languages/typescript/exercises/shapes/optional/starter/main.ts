// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Optional fields, taken literally: absent, present, and the difference.
 */

export interface Profile {
  readonly id: string;
  name: string;
  email?: string;
  age?: number;
}

export function describe(profile: Profile): string {
  throw new Error('not implemented');
}

export function withEmail(profile: Profile, email: string): Profile {
  throw new Error('not implemented');
}

export function clearEmail(profile: Profile): Profile {
  throw new Error('not implemented');
}

export function mergeProfiles(base: Profile, patch: Partial<Profile>): Profile {
  throw new Error('not implemented');
}
