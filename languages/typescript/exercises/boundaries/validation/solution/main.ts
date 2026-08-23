// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Parsed JSON has this type and no other. Everything richer is proved, not cast.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly tags: string[];
}

export type ParseResult =
  | { readonly ok: true; readonly user: User }
  | { readonly ok: false; readonly error: string };

export type ParseManyResult =
  | { readonly ok: true; readonly users: User[]; readonly skipped: number }
  | { readonly ok: false; readonly error: string };

/** A plain object: typeof null is "object", hence the second clause. */
function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUser(value: JsonValue): value is User {
  if (!isRecord(value)) return false;

  return (
    typeof value['id'] === 'number' &&
    typeof value['name'] === 'string' &&
    typeof value['email'] === 'string' &&
    Array.isArray(value['tags']) &&
    // Array.isArray proves "array", not "array of strings"; this line is
    // the difference between the guard and a plausible imitation of one.
    value['tags'].every((tag): tag is string => typeof tag === 'string')
  );
}

export function parseUser(text: string): ParseResult {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch {
    return { ok: false, error: 'invalid json' };
  }

  if (!isUser(parsed)) {
    return { ok: false, error: 'not a user' };
  }
  return { ok: true, user: parsed };
}

export function parseUsers(text: string): ParseManyResult {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch {
    return { ok: false, error: 'invalid json' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'not an array' };
  }

  const users: User[] = [];
  let skipped = 0;
  for (const entry of parsed) {
    if (isUser(entry)) {
      users.push(entry);
    } else {
      skipped += 1;
    }
  }

  return { ok: true, users, skipped };
}
