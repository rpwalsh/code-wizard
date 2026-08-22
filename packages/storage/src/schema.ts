import type { DatabaseSync } from 'node:sqlite';

import { LATEST_VERSION } from './version.ts';

export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly up: string;
}

/**
 * Migrations are append-only and never edited once shipped: a learner's
 * database is the only copy of their progress, and rewriting history here
 * would corrupt it on the next upgrade.
 */
export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial',
    up: `
      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) STRICT;

      CREATE TABLE mastery (
        skill_id          TEXT PRIMARY KEY,
        vector            TEXT NOT NULL,
        observations      INTEGER NOT NULL DEFAULT 0,
        last_practiced_at TEXT
      ) STRICT;

      CREATE TABLE reviews (
        skill_id         TEXT PRIMARY KEY,
        last_reviewed_at TEXT NOT NULL,
        due_at           TEXT NOT NULL,
        interval_days    INTEGER NOT NULL,
        streak           INTEGER NOT NULL DEFAULT 0,
        lapses           INTEGER NOT NULL DEFAULT 0
      ) STRICT;

      CREATE INDEX reviews_due_at ON reviews (due_at);

      CREATE TABLE attempts (
        id               TEXT PRIMARY KEY,
        exercise_id      TEXT NOT NULL,
        exercise_version INTEGER NOT NULL,
        mode             TEXT NOT NULL,
        started_at       TEXT NOT NULL,
        finished_at      TEXT,
        outcome          TEXT NOT NULL,
        final_files      TEXT
      ) STRICT;

      CREATE INDEX attempts_exercise ON attempts (exercise_id, started_at);

      CREATE TABLE attempt_events (
        attempt_id TEXT NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
        seq        INTEGER NOT NULL,
        type       TEXT NOT NULL,
        at         TEXT NOT NULL,
        payload    TEXT NOT NULL,
        PRIMARY KEY (attempt_id, seq)
      ) STRICT;
    `,
  },
];

// The migration list and the declared version must not drift apart.
if (migrations.at(-1)?.version !== LATEST_VERSION) {
  throw new Error(
    `LATEST_VERSION is ${LATEST_VERSION} but the last migration is ${String(migrations.at(-1)?.version)}.`,
  );
}

export { LATEST_VERSION };

export class SchemaTooNewError extends Error {
  constructor(found: number, supported: number) {
    super(
      `This progress database is at schema version ${found}, but this build only understands ${supported}. ` +
        'Update Forge rather than letting an older build write to it.',
    );
    this.name = 'SchemaTooNewError';
  }
}

/**
 * Bring a database up to the current schema.
 *
 * Each migration runs inside its own transaction and the version is bumped in
 * the same transaction, so an interrupted upgrade leaves the database at a
 * version that is actually true rather than half-applied (spec §47).
 */
export function migrate(database: DatabaseSync): number {
  database.exec('PRAGMA foreign_keys = ON');
  // WAL survives a crash mid-write, which is the failure this has to withstand.
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA synchronous = NORMAL');

  const current = readVersion(database);
  if (current > LATEST_VERSION) throw new SchemaTooNewError(current, LATEST_VERSION);

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    database.exec('BEGIN');
    try {
      database.exec(migration.up);
      database.exec(`PRAGMA user_version = ${migration.version}`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw new Error(
        `Migration ${migration.version} (${migration.name}) failed: ${String(error)}`,
        {
          cause: error,
        },
      );
    }
  }

  return readVersion(database);
}

function readVersion(database: DatabaseSync): number {
  const row = database.prepare('PRAGMA user_version').get() as
    { user_version?: number } | undefined;
  return row?.user_version ?? 0;
}
