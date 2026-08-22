import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { MasteryVector, SkillMastery, TrainingMode } from '@forge/core';
import { makeMastery, masteryDimensions } from '@forge/core';
import type { Attempt, AttemptEvent, AttemptOutcome } from '@forge/learning';

import type { ProgressSnapshot, ProgressStore, StoredReview } from './progress-store.ts';
import { assertImportable, SNAPSHOT_FORMAT } from './progress-store.ts';
import { LATEST_VERSION, migrate } from './schema.ts';

export interface StoreOptions {
  /** Path to the database file, or `:memory:` for a throwaway store. */
  readonly location: string;
}

/**
 * Local persistence for the desktop build (spec §26).
 *
 * Exercise *content* is version-controlled and lives on disk; only what the
 * learner did lives here. Nothing in this database is sent anywhere (§34).
 *
 * The methods are async to satisfy `ProgressStore`, not because SQLite is:
 * the web build's IndexedDB backend genuinely is, and the application above
 * must not be able to tell the difference.
 */
export class SqliteProgressStore implements ProgressStore {
  readonly #database: DatabaseSync;
  readonly schemaVersion: number;
  #transactionDepth = 0;

  private constructor(database: DatabaseSync, schemaVersion: number) {
    this.#database = database;
    this.schemaVersion = schemaVersion;
  }

  static open(options: StoreOptions): SqliteProgressStore {
    if (options.location !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(options.location)), { recursive: true });
    }
    const database = new DatabaseSync(options.location);
    try {
      return new SqliteProgressStore(database, migrate(database));
    } catch (error) {
      // A refused or failed migration must not leave the file handle open;
      // on Windows that keeps the database locked against every later attempt.
      database.close();
      throw error;
    }
  }

  static openInMemory(): SqliteProgressStore {
    return SqliteProgressStore.open({ location: ':memory:' });
  }

  async close(): Promise<void> {
    this.#database.close();
  }

  /**
   * Run `body` in a transaction, rolling back if it throws.
   *
   * Re-entrant: SQLite has no nested transactions, so an inner call uses a
   * savepoint. Without this, any method that writes atomically could not be
   * called from another one that does — which is exactly what `importAll`
   * needs to do.
   */
  transaction<T>(body: () => T): T {
    const nested = this.#transactionDepth > 0;
    const savepoint = `forge_sp_${this.#transactionDepth}`;

    this.#database.exec(nested ? `SAVEPOINT ${savepoint}` : 'BEGIN');
    this.#transactionDepth += 1;
    try {
      const result = body();
      this.#database.exec(nested ? `RELEASE ${savepoint}` : 'COMMIT');
      return result;
    } catch (error) {
      this.#database.exec(nested ? `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}` : 'ROLLBACK');
      throw error;
    } finally {
      this.#transactionDepth -= 1;
    }
  }

  // -- settings -----------------------------------------------------------

  async getSetting(key: string): Promise<string | null> {
    const row = this.#database.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      { value: string } | undefined;
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.#writeSetting(key, value);
  }

  #writeSetting(key: string, value: string): void {
    this.#database
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ' +
          'ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      )
      .run(key, value);
  }

  // -- mastery ------------------------------------------------------------

  async saveMastery(mastery: SkillMastery): Promise<void> {
    this.#writeMastery(mastery);
  }

  #writeMastery(mastery: SkillMastery): void {
    this.#database
      .prepare(
        'INSERT INTO mastery (skill_id, vector, observations, last_practiced_at) ' +
          'VALUES (?, ?, ?, ?) ON CONFLICT (skill_id) DO UPDATE SET ' +
          'vector = excluded.vector, observations = excluded.observations, ' +
          'last_practiced_at = excluded.last_practiced_at',
      )
      .run(
        mastery.skillId,
        serialiseVector(mastery.vector),
        mastery.observations,
        mastery.lastPracticedAt,
      );
  }

  async getMastery(skillId: string): Promise<SkillMastery | null> {
    const row = this.#database.prepare('SELECT * FROM mastery WHERE skill_id = ?').get(skillId) as
      MasteryRow | undefined;
    return row ? toMastery(row) : null;
  }

  async allMastery(): Promise<Map<string, SkillMastery>> {
    const rows = this.#database.prepare('SELECT * FROM mastery').all() as unknown as MasteryRow[];
    return new Map(rows.map((row) => [row.skill_id, toMastery(row)]));
  }

  // -- reviews ------------------------------------------------------------

  async saveReview(review: StoredReview): Promise<void> {
    this.#writeReview(review);
  }

  #writeReview(review: StoredReview): void {
    this.#database
      .prepare(
        'INSERT INTO reviews (skill_id, last_reviewed_at, due_at, interval_days, streak, lapses) ' +
          'VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (skill_id) DO UPDATE SET ' +
          'last_reviewed_at = excluded.last_reviewed_at, due_at = excluded.due_at, ' +
          'interval_days = excluded.interval_days, streak = excluded.streak, ' +
          'lapses = excluded.lapses',
      )
      .run(
        review.skillId,
        review.lastReviewedAt,
        review.dueAt,
        review.intervalDays,
        review.streak,
        review.lapses,
      );
  }

  async allReviews(): Promise<Map<string, StoredReview>> {
    const rows = this.#database.prepare('SELECT * FROM reviews').all() as unknown as ReviewRow[];
    return new Map(rows.map((row) => [row.skill_id, toReview(row)]));
  }

  async dueReviews(at: Date): Promise<StoredReview[]> {
    const rows = this.#database
      .prepare('SELECT * FROM reviews WHERE due_at <= ? ORDER BY due_at ASC')
      .all(at.toISOString()) as unknown as ReviewRow[];
    return rows.map(toReview);
  }

  // -- attempts -----------------------------------------------------------

  /**
   * Write an attempt and its events atomically. An attempt whose events were
   * only half written would silently change the metrics derived from it.
   */
  async saveAttempt(attempt: Attempt): Promise<void> {
    this.#writeAttempt(attempt);
  }

  #writeAttempt(attempt: Attempt): void {
    this.transaction(() => {
      this.#database
        .prepare(
          'INSERT INTO attempts ' +
            '(id, exercise_id, exercise_version, mode, started_at, finished_at, outcome, final_files) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET ' +
            'finished_at = excluded.finished_at, outcome = excluded.outcome, ' +
            'final_files = excluded.final_files',
        )
        .run(
          attempt.id,
          attempt.exerciseId,
          attempt.exerciseVersion,
          attempt.mode,
          attempt.startedAt,
          attempt.finishedAt,
          attempt.outcome,
          attempt.finalFiles ? JSON.stringify(attempt.finalFiles) : null,
        );

      // Events are append-only, so replacing them wholesale is safe and keeps
      // the write idempotent when an in-progress attempt is saved repeatedly.
      this.#database.prepare('DELETE FROM attempt_events WHERE attempt_id = ?').run(attempt.id);
      const insert = this.#database.prepare(
        'INSERT INTO attempt_events (attempt_id, seq, type, at, payload) VALUES (?, ?, ?, ?, ?)',
      );
      for (const [index, event] of attempt.events.entries()) {
        const { type, at, ...payload } = event;
        insert.run(attempt.id, index, type, at, JSON.stringify(payload));
      }
    });
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    const row = this.#database.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as
      AttemptRow | undefined;
    return row ? this.#hydrate(row) : null;
  }

  async attemptsFor(exerciseId: string): Promise<Attempt[]> {
    const rows = this.#database
      .prepare('SELECT * FROM attempts WHERE exercise_id = ? ORDER BY started_at ASC')
      .all(exerciseId) as unknown as AttemptRow[];
    return rows.map((row) => this.#hydrate(row));
  }

  async allAttempts(): Promise<Attempt[]> {
    const rows = this.#database
      .prepare('SELECT * FROM attempts ORDER BY started_at ASC')
      .all() as unknown as AttemptRow[];
    return rows.map((row) => this.#hydrate(row));
  }

  async countAttempts(): Promise<number> {
    const row = this.#database.prepare('SELECT COUNT(*) AS n FROM attempts').get() as { n: number };
    return row.n;
  }

  #hydrate(row: AttemptRow): Attempt {
    const events = this.#database
      .prepare('SELECT type, at, payload FROM attempt_events WHERE attempt_id = ? ORDER BY seq ASC')
      .all(row.id) as unknown as { type: string; at: string; payload: string }[];

    return {
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseVersion: row.exercise_version,
      mode: row.mode as TrainingMode,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      outcome: row.outcome as AttemptOutcome,
      events: events.map(
        (event) =>
          ({
            type: event.type,
            at: event.at,
            ...(JSON.parse(event.payload) as object),
          }) as AttemptEvent,
      ),
      ...(row.final_files
        ? { finalFiles: JSON.parse(row.final_files) as Record<string, string> }
        : {}),
    };
  }

  // -- portability (spec §42) ---------------------------------------------

  async exportAll(): Promise<ProgressSnapshot> {
    const settings = this.#database.prepare('SELECT key, value FROM settings').all() as unknown as {
      key: string;
      value: string;
    }[];

    return {
      format: SNAPSHOT_FORMAT,
      schemaVersion: this.schemaVersion,
      exportedAt: new Date().toISOString(),
      settings: Object.fromEntries(settings.map((row) => [row.key, row.value])),
      mastery: [...(await this.allMastery()).values()],
      reviews: [...(await this.allReviews()).values()],
      attempts: await this.allAttempts(),
    };
  }

  async importAll(snapshot: ProgressSnapshot): Promise<void> {
    assertImportable(snapshot, LATEST_VERSION);

    this.transaction(() => {
      this.#database.exec(
        'DELETE FROM attempt_events; DELETE FROM attempts; DELETE FROM reviews; ' +
          'DELETE FROM mastery; DELETE FROM settings;',
      );
      for (const [key, value] of Object.entries(snapshot.settings)) {
        this.#writeSetting(key, value);
      }
      for (const mastery of snapshot.mastery) this.#writeMastery(mastery);
      for (const review of snapshot.reviews) this.#writeReview(review);
      for (const attempt of snapshot.attempts) this.#writeAttempt(attempt);
    });
  }
}

interface MasteryRow {
  skill_id: string;
  vector: string;
  observations: number;
  last_practiced_at: string | null;
}

interface ReviewRow {
  skill_id: string;
  last_reviewed_at: string;
  due_at: string;
  interval_days: number;
  streak: number;
  lapses: number;
}

interface AttemptRow {
  id: string;
  exercise_id: string;
  exercise_version: number;
  mode: string;
  started_at: string;
  finished_at: string | null;
  outcome: string;
  final_files: string | null;
}

function serialiseVector(vector: MasteryVector): string {
  // Dimension order is fixed by `masteryDimensions`, so the JSON is stable and
  // two identical vectors always produce identical text.
  return JSON.stringify(
    Object.fromEntries(masteryDimensions.map((dimension) => [dimension, vector[dimension]])),
  );
}

function toMastery(row: MasteryRow): SkillMastery {
  let parsed: Partial<Record<string, number>> = {};
  try {
    parsed = JSON.parse(row.vector) as Partial<Record<string, number>>;
  } catch {
    // A corrupt vector must not take the whole profile down with it; a reset
    // skill is recoverable, an unopenable database is not.
    parsed = {};
  }
  return {
    skillId: row.skill_id,
    vector: makeMastery(parsed),
    observations: row.observations,
    lastPracticedAt: row.last_practiced_at,
  };
}

function toReview(row: ReviewRow): StoredReview {
  return {
    skillId: row.skill_id,
    lastReviewedAt: row.last_reviewed_at,
    dueAt: row.due_at,
    intervalDays: row.interval_days,
    streak: row.streak,
    lapses: row.lapses,
  };
}
