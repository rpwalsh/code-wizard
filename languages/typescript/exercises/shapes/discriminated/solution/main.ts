// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A result that carries its reason.
 *
 * The discriminant is `ok`, typed as the literals `true` and `false` rather
 * than as `boolean`, which is what lets a check on it narrow the union.
 */
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

export function parseAge(input: string): Result<number> {
  const trimmed = input.trim();
  const parsed = Number(trimmed);

  // `Number('')` is 0, which is a number and not what anyone meant by an
  // empty string, so the empty case is rejected explicitly.
  if (trimmed === '' || !Number.isFinite(parsed)) {
    return { ok: false, reason: 'not a number' };
  }
  if (!Number.isInteger(parsed)) {
    return { ok: false, reason: 'not a whole number' };
  }
  if (parsed < 0 || parsed > 150) {
    return { ok: false, reason: 'out of range' };
  }

  return { ok: true, value: parsed };
}

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function describe(result: Result<number>): string {
  switch (result.ok) {
    case true:
      return `age ${result.value}`;
    case false:
      return `failed: ${result.reason}`;
    default: {
      // Legal only while every case above is handled. Add a member to the
      // union and this line stops compiling, which is the whole point.
      const impossible: never = result;
      throw new Error(`unhandled result: ${String(impossible)}`);
    }
  }
}
