// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { JsonObject, JsonValue, SkillMastery } from '@code-wizard/core';
import type { Attempt } from '@code-wizard/learning';

/**
 * Spaced-repetition state as stored. Structurally identical to the curriculum
 * package's `ReviewState`, but declared here so storage does not depend on the
 * scheduler — the two evolve for different reasons.
 */
export interface StoredReview {
  readonly skillId: string;
  readonly lastReviewedAt: string;
  readonly dueAt: string;
  readonly intervalDays: number;
  readonly streak: number;
  readonly lapses: number;
}

export interface ProgressSnapshot {
  readonly format: string;
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly settings: Readonly<Record<string, string>>;
  readonly mastery: readonly SkillMastery[];
  readonly reviews: readonly StoredReview[];
  readonly attempts: readonly Attempt[];
}

export const SNAPSHOT_FORMAT = 'code-wizard-progress';

/**
 * Everything the application needs from persistence.
 *
 * Async even where a backend is synchronous, because one of them is not: the
 * desktop build stores progress in SQLite and the web build stores it in
 * IndexedDB, and nothing above this interface may care which. That is the same
 * reasoning as `LanguageRuntime` applied to storage.
 */
export interface ProgressStore {
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  getMastery(skillId: string): Promise<SkillMastery | null>;
  allMastery(): Promise<Map<string, SkillMastery>>;
  saveMastery(mastery: SkillMastery): Promise<void>;

  allReviews(): Promise<Map<string, StoredReview>>;
  saveReview(review: StoredReview): Promise<void>;
  dueReviews(at: Date): Promise<StoredReview[]>;

  getAttempt(id: string): Promise<Attempt | null>;
  attemptsFor(exerciseId: string): Promise<Attempt[]>;
  allAttempts(): Promise<Attempt[]>;
  saveAttempt(attempt: Attempt): Promise<void>;
  countAttempts(): Promise<number>;

  /** Everything, for `.retrainerpack` export (spec §42). */
  exportAll(): Promise<ProgressSnapshot>;
  /** Replace everything. Refuses a foreign or newer snapshot. */
  importAll(snapshot: ProgressSnapshot): Promise<void>;

  close(): Promise<void>;
}

export class SnapshotFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotFormatError';
  }
}

/** Shared validation so every backend refuses the same things. */
export function assertImportable(snapshot: ProgressSnapshot, supportedVersion: number): void {
  if (snapshot.format !== SNAPSHOT_FORMAT) {
    throw new SnapshotFormatError(
      `Not a Code Wizard progress export (format: ${String(snapshot.format)}).`,
    );
  }
  if (snapshot.schemaVersion > supportedVersion) {
    throw new SnapshotFormatError(
      `Export is from schema version ${snapshot.schemaVersion}; this build understands ${supportedVersion}.`,
    );
  }
}

/**
 * Parsed JSON into a snapshot, or a refusal.
 *
 * This lives with the format rather than with whoever read the file, because
 * the shape is this package's to define and its consumers should not each
 * reinvent a guess at it. A file chosen by mistake is the likely case and is
 * refused here with a sentence a person can act on; a file from a newer build
 * is refused by `assertImportable` on the way in.
 *
 * The envelope is what gets checked. Walking every record would double the
 * schema in validation code that drifts from it — and the records inside a
 * well-formed envelope came from this application's own export.
 */
export function parseSnapshot(value: JsonValue): ProgressSnapshot {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SnapshotFormatError('That file is not a progress export.');
  }

  const missing = ['format', 'schemaVersion', 'exportedAt', 'settings'].filter(
    (key) => !(key in value),
  );
  if (missing.length > 0) {
    throw new SnapshotFormatError(
      `That file is not a progress export (missing: ${missing.join(', ')}).`,
    );
  }

  const settings = value['settings'];
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    throw new SnapshotFormatError('That export has no settings section.');
  }

  return {
    format: String(value['format']),
    schemaVersion: Number(value['schemaVersion']),
    exportedAt: String(value['exportedAt']),
    settings: Object.fromEntries(
      Object.entries(settings).map(([key, entry]) => [key, String(entry)]),
    ),
    mastery: trusted<SkillMastery>(
      records('mastery', value['mastery'] ?? null, ['skillId', 'vector', 'observations']),
    ),
    reviews: trusted<StoredReview>(
      records('reviews', value['reviews'] ?? null, ['skillId', 'dueAt', 'intervalDays']),
    ),
    attempts: trusted<Attempt>(
      records('attempts', value['attempts'] ?? null, ['id', 'exerciseId', 'startedAt']),
    ),
  };
}

/**
 * Validated records, admitted as their domain type.
 *
 * The one place in this codebase that reaches for `unknown`, and the one the
 * ban was written to permit: crossing from parsed JSON into a domain type
 * after checking it is exactly what `unknown` is for. Everything up to this
 * line is `JsonValue`, as the rule asks; the conversion happens once, here,
 * behind a name that says it is a trust boundary rather than a fact.
 *
 * What justifies the trust is stated and narrow: `records` has confirmed the
 * identifying keys, `parseSnapshot` has confirmed the envelope, and the file
 * was written by this application's own export.
 */
function trusted<T>(entries: readonly JsonObject[]): readonly T[] {
  // eslint-disable-next-line no-restricted-syntax -- the validated JSON-to-domain boundary, crossed once here rather than at every call site; see the comment above.
  return entries.map((entry) => entry as unknown as T);
}

/**
 * Every record in one collection, checked for the keys that identify it.
 *
 * Enough to catch the file that is JSON but not this — a package.json, some
 * other tool's export — without restating the whole schema here, where it
 * would drift out of step with the types it claims to describe.
 */
function records(
  name: string,
  value: JsonValue | null,
  required: readonly string[],
): readonly JsonObject[] {
  if (!Array.isArray(value)) {
    throw new SnapshotFormatError(`That export has no ${name} section.`);
  }

  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new SnapshotFormatError(`${name}[${index}] is not a record.`);
    }
    const missing = required.filter((key) => !(key in entry));
    if (missing.length > 0) {
      throw new SnapshotFormatError(`${name}[${index}] is missing: ${missing.join(', ')}.`);
    }
    return entry;
  });
}

/** Reviews due at or before `at`, most overdue first. */
export function selectDue(reviews: Iterable<StoredReview>, at: Date): StoredReview[] {
  return [...reviews]
    .filter((review) => Date.parse(review.dueAt) <= at.getTime())
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}
