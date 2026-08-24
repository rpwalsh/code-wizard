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
  // typeof null is 'object' and an array is an object too, so both have to
  // be excluded before this can claim to be a record.
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: Json, path: string, problems: string[]): string | undefined {
  if (typeof value !== 'string') {
    problems.push(`${path}: expected a string`);
    return undefined;
  }
  return value;
}

export function parseUser(value: Json): Parsed<User> {
  const problems: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, problems: ['expected an object'] };
  }

  const id = value['id'];
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    problems.push('id: expected an integer');
  }

  const name = asString(value['name'] ?? null, 'name', problems);

  // Optional means absent, not present-and-null. `'email' in value` is the
  // question; reading the value cannot tell the two apart.
  let email: string | undefined;
  if ('email' in value) {
    email = asString(value['email'] ?? null, 'email', problems);
  }

  const rawRoles = value['roles'];
  let roles: string[] = [];
  if (!Array.isArray(rawRoles)) {
    problems.push('roles: expected an array');
  } else {
    roles = rawRoles
      .map((entry, index) => asString(entry, `roles[${index}]`, problems))
      .filter((entry): entry is string => entry !== undefined);
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    // Built explicitly rather than cast: every field here has been checked,
    // and the optional one is omitted rather than set to undefined.
    value: { id: id as number, name: name as string, roles, ...(email === undefined ? {} : { email }) },
  };
}

export function parseUsers(value: Json): Parsed<User[]> {
  if (!Array.isArray(value)) return { ok: false, problems: ['expected an array'] };

  const users: User[] = [];
  const problems: string[] = [];

  for (const [index, entry] of value.entries()) {
    const parsed = parseUser(entry);
    if (parsed.ok) users.push(parsed.value);
    // Prefixed with the index, so a problem in the tenth record says so
    // rather than reporting "name: expected a string" about nothing.
    else problems.push(...parsed.problems.map((problem) => `[${index}] ${problem}`));
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, value: users };
}
