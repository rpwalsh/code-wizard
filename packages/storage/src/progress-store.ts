import type { SkillMastery } from '@forge/core';
import type { Attempt } from '@forge/learning';

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

export const SNAPSHOT_FORMAT = 'forge-progress';

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

  /** Everything, for `.forgepack` export (spec §42). */
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
      `Not a Forge progress export (format: ${String(snapshot.format)}).`,
    );
  }
  if (snapshot.schemaVersion > supportedVersion) {
    throw new SnapshotFormatError(
      `Export is from schema version ${snapshot.schemaVersion}; this build understands ${supportedVersion}.`,
    );
  }
}

/** Reviews due at or before `at`, most overdue first. */
export function selectDue(reviews: Iterable<StoredReview>, at: Date): StoredReview[] {
  return [...reviews]
    .filter((review) => Date.parse(review.dueAt) <= at.getTime())
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}
