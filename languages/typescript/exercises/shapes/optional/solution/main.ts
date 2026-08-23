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
  const parts = [`${profile.name} (${profile.id})`];
  // !== undefined, not truthiness: "" is a present value and must print.
  if (profile.email !== undefined) {
    parts.push(profile.email);
  }
  if (profile.age !== undefined) {
    parts.push(`age ${profile.age}`);
  }
  return parts.join(', ');
}

export function withEmail(profile: Profile, email: string): Profile {
  return { ...profile, email };
}

export function clearEmail(profile: Profile): Profile {
  // Rest destructuring removes the key; assigning undefined would leave a
  // ghost field that still enumerates and survives spreads.
  const { email, ...rest } = profile;
  void email;
  return rest;
}

export function mergeProfiles(base: Profile, patch: Partial<Profile>): Profile {
  // Chosen and documented: undefined-in-patch means "no change", never
  // "erase". A bare double spread would let it erase.
  const merged: Profile = { ...base };
  for (const key of Object.keys(patch) as (keyof Profile)[]) {
    const value = patch[key];
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}
