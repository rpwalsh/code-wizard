// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The line where JSON stops being unknown and starts being a type.
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type Parsed<T> = { ok: true; value: T } | { ok: false; problems: string[] };

export type User = {
  id: number;
  name: string;
  email?: string;
  roles: string[];
};

export function isRecord(value: Json): value is { [key: string]: Json } {
  throw new Error('not implemented');
}

export function asString(value: Json, path: string, problems: string[]): string | undefined {
  throw new Error('not implemented');
}

export function parseUser(value: Json): Parsed<User> {
  throw new Error('not implemented');
}

export function parseUsers(value: Json): Parsed<User[]> {
  throw new Error('not implemented');
}
