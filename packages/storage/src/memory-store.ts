import type { SkillMastery } from '@code-retrainer/core';
import type { Attempt } from '@code-retrainer/learning';

import type { ProgressSnapshot, ProgressStore, StoredReview } from './progress-store.ts';
import { assertImportable, selectDue, SNAPSHOT_FORMAT } from './progress-store.ts';
import { LATEST_VERSION } from './version.ts';

/**
 * An in-memory `ProgressStore`.
 *
 * Two real uses beyond testing: it is the fallback when a browser refuses
 * IndexedDB (private windows, blocked site data), and it is what makes a
 * "try it without saving anything" mode possible. A learner poking at the
 * hosted demo should not have storage written on their machine unless they
 * chose to keep going.
 */
export class MemoryProgressStore implements ProgressStore {
  readonly #settings = new Map<string, string>();
  readonly #mastery = new Map<string, SkillMastery>();
  readonly #reviews = new Map<string, StoredReview>();
  readonly #attempts = new Map<string, Attempt>();

  async getSetting(key: string): Promise<string | null> {
    return this.#settings.get(key) ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.#settings.set(key, value);
  }

  async getMastery(skillId: string): Promise<SkillMastery | null> {
    return this.#mastery.get(skillId) ?? null;
  }

  async allMastery(): Promise<Map<string, SkillMastery>> {
    return new Map(this.#mastery);
  }

  async saveMastery(mastery: SkillMastery): Promise<void> {
    this.#mastery.set(mastery.skillId, mastery);
  }

  async allReviews(): Promise<Map<string, StoredReview>> {
    return new Map(this.#reviews);
  }

  async saveReview(review: StoredReview): Promise<void> {
    this.#reviews.set(review.skillId, review);
  }

  async dueReviews(at: Date): Promise<StoredReview[]> {
    return selectDue(this.#reviews.values(), at);
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    return this.#attempts.get(id) ?? null;
  }

  async attemptsFor(exerciseId: string): Promise<Attempt[]> {
    return (await this.allAttempts()).filter((attempt) => attempt.exerciseId === exerciseId);
  }

  async allAttempts(): Promise<Attempt[]> {
    return [...this.#attempts.values()].sort(
      (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
    );
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    this.#attempts.set(attempt.id, attempt);
  }

  async countAttempts(): Promise<number> {
    return this.#attempts.size;
  }

  async exportAll(): Promise<ProgressSnapshot> {
    return {
      format: SNAPSHOT_FORMAT,
      schemaVersion: LATEST_VERSION,
      exportedAt: new Date().toISOString(),
      settings: Object.fromEntries(this.#settings),
      mastery: [...this.#mastery.values()],
      reviews: [...this.#reviews.values()],
      attempts: await this.allAttempts(),
    };
  }

  async importAll(snapshot: ProgressSnapshot): Promise<void> {
    assertImportable(snapshot, LATEST_VERSION);
    this.#settings.clear();
    this.#mastery.clear();
    this.#reviews.clear();
    this.#attempts.clear();
    for (const [key, value] of Object.entries(snapshot.settings)) this.#settings.set(key, value);
    for (const mastery of snapshot.mastery) this.#mastery.set(mastery.skillId, mastery);
    for (const review of snapshot.reviews) this.#reviews.set(review.skillId, review);
    for (const attempt of snapshot.attempts) this.#attempts.set(attempt.id, attempt);
  }

  async close(): Promise<void> {
    // Nothing to release.
  }
}
