// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Reading columns back out of SQLite with the types still enforced.
 *
 * `node:sqlite` hands back a row as a bag of values whose types it cannot know
 * statically. Casting the whole row to a row interface asserts a shape that
 * nothing checked; reading each column narrows it instead, and says which
 * column was wrong when the schema and the code disagree.
 */
export type SqlValue = null | number | bigint | string | Uint8Array;

export type SqlRow = Record<string, SqlValue>;

export class SqlColumnError extends Error {
  constructor(column: string, expected: string, actual: SqlValue) {
    super(`Column "${column}" should be ${expected}, found ${describe(actual)}.`);
    this.name = 'SqlColumnError';
  }
}

function describe(value: SqlValue): string {
  if (value === null) return 'NULL';
  if (value instanceof Uint8Array) return 'a blob';
  return typeof value;
}

export function text(row: SqlRow, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') throw new SqlColumnError(column, 'text', value ?? null);
  return value;
}

export function optionalText(row: SqlRow, column: string): string | null {
  const value = row[column];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new SqlColumnError(column, 'text or NULL', value);
  return value;
}

export function integer(row: SqlRow, column: string): number {
  const value = row[column];
  if (typeof value === 'number') return value;
  // SQLite returns large integers as bigint; every count and interval Code Wizard
  // stores is comfortably inside Number's safe range.
  if (typeof value === 'bigint') return Number(value);
  throw new SqlColumnError(column, 'an integer', value ?? null);
}
