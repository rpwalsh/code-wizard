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

export function isUser(value: JsonValue): value is User {
  throw new Error('not implemented');
}

export function parseUser(text: string): ParseResult {
  throw new Error('not implemented');
}

export function parseUsers(text: string): ParseManyResult {
  throw new Error('not implemented');
}
