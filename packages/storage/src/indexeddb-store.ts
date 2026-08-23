// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillMastery } from '@code-retrainer/core';
import type { Attempt } from '@code-retrainer/learning';

import { MemoryProgressStore } from './memory-store.ts';
import type { ProgressSnapshot, ProgressStore, StoredReview } from './progress-store.ts';
import { assertImportable, selectDue, SNAPSHOT_FORMAT } from './progress-store.ts';
import { LATEST_VERSION } from './version.ts';

/**
 * What may be written to a store.
 *
 * IndexedDB serialises with structured clone, which accepts a wider set than
 * JSON — but everything Code Retrainer stores is plain data, and naming that keeps the
 * write path checked.
 */
type StorableRecord = string | SkillMastery | StoredReview | Attempt;

interface StoreReplacement {
  readonly store: string;
  readonly records: readonly (readonly [IDBValidKey, StorableRecord])[];
}

const DATABASE_NAME = 'code-retrainer-progress';
const DATABASE_VERSION = 1;

const STORES = {
  settings: 'settings',
  mastery: 'mastery',
  reviews: 'reviews',
  attempts: 'attempts',
} as const;

/**
 * Persistence for the web build.
 *
 * IndexedDB rather than localStorage because attempts carry their whole event
 * log and localStorage is a synchronous ~5MB string bucket. Everything stays
 * on the visitor's machine; the hosted site is static files and never sees any
 * of this (spec §34).
 */
export class IndexedDbProgressStore implements ProgressStore {
  readonly #database: IDBDatabase;

  private constructor(database: IDBDatabase) {
    this.#database = database;
  }

  static async open(name = DATABASE_NAME): Promise<IndexedDbProgressStore> {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const upgraded = request.result;
        for (const store of Object.values(STORES)) {
          if (!upgraded.objectStoreNames.contains(store)) upgraded.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      request.onblocked = () =>
        reject(new Error('Another Code Retrainer tab is holding an older database version open.'));
    });
    return new IndexedDbProgressStore(database);
  }

  /**
   * Open persistent storage, or fall back to memory.
   *
   * A private window, cleared site data, or a browser configured to block site
   * data all make IndexedDB throw. Losing progress is bad; refusing to run at
   * all is worse, so the caller is told which one it got and can say so.
   */
  static async openOrFallBack(
    name = DATABASE_NAME,
  ): Promise<{ store: ProgressStore; persistent: boolean; reason?: string }> {
    if (typeof indexedDB === 'undefined') {
      return {
        store: new MemoryProgressStore(),
        persistent: false,
        reason: 'This browser does not expose IndexedDB.',
      };
    }
    try {
      return { store: await IndexedDbProgressStore.open(name), persistent: true };
    } catch (error) {
      return {
        store: new MemoryProgressStore(),
        persistent: false,
        reason: `Storage is unavailable (${String(error)}). Progress will be lost when you close the tab.`,
      };
    }
  }

  // -- primitives ---------------------------------------------------------

  #read<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return this.#request<T | undefined>(store, 'readonly', (objectStore) => objectStore.get(key));
  }

  #readAll<T>(store: string): Promise<T[]> {
    return this.#request<T[]>(store, 'readonly', (objectStore) => objectStore.getAll());
  }

  #write<T extends StorableRecord>(
    store: string,
    key: IDBValidKey,
    value: T,
  ): Promise<IDBValidKey> {
    return this.#request<IDBValidKey>(store, 'readwrite', (objectStore) =>
      objectStore.put(value, key),
    );
  }

  #request<T>(
    store: string,
    mode: IDBTransactionMode,
    body: (objectStore: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const transaction = this.#database.transaction(store, mode);
      const request = body(transaction.objectStore(store));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error(`IndexedDB ${mode} failed`));
      transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
    });
  }

  /** Clear and repopulate several stores in one transaction. */
  #replaceAll(entries: readonly StoreReplacement[]) {
    return new Promise<void>((resolve, reject) => {
      const names = entries.map((entry) => entry.store);
      const transaction = this.#database.transaction(names, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Import failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Import aborted'));

      for (const entry of entries) {
        const objectStore = transaction.objectStore(entry.store);
        objectStore.clear();
        for (const [key, value] of entry.records) objectStore.put(value, key);
      }
    });
  }

  // -- ProgressStore ------------------------------------------------------

  async getSetting(key: string): Promise<string | null> {
    return (await this.#read<string>(STORES.settings, key)) ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.#write(STORES.settings, key, value);
  }

  async getMastery(skillId: string): Promise<SkillMastery | null> {
    return (await this.#read<SkillMastery>(STORES.mastery, skillId)) ?? null;
  }

  async allMastery(): Promise<Map<string, SkillMastery>> {
    const records = await this.#readAll<SkillMastery>(STORES.mastery);
    return new Map(records.map((record) => [record.skillId, record]));
  }

  async saveMastery(mastery: SkillMastery): Promise<void> {
    await this.#write(STORES.mastery, mastery.skillId, mastery);
  }

  async allReviews(): Promise<Map<string, StoredReview>> {
    const records = await this.#readAll<StoredReview>(STORES.reviews);
    return new Map(records.map((record) => [record.skillId, record]));
  }

  async saveReview(review: StoredReview): Promise<void> {
    await this.#write(STORES.reviews, review.skillId, review);
  }

  async dueReviews(at: Date): Promise<StoredReview[]> {
    return selectDue(await this.#readAll<StoredReview>(STORES.reviews), at);
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    return (await this.#read<Attempt>(STORES.attempts, id)) ?? null;
  }

  async attemptsFor(exerciseId: string): Promise<Attempt[]> {
    return (await this.allAttempts()).filter((attempt) => attempt.exerciseId === exerciseId);
  }

  async allAttempts(): Promise<Attempt[]> {
    const records = await this.#readAll<Attempt>(STORES.attempts);
    return records.sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    // The whole attempt, event log included, is one record: IndexedDB writes it
    // atomically, which is the guarantee the SQLite backend gets from a
    // transaction.
    await this.#write(STORES.attempts, attempt.id, attempt);
  }

  async countAttempts(): Promise<number> {
    return this.#request<number>(STORES.attempts, 'readonly', (objectStore) => objectStore.count());
  }

  async exportAll(): Promise<ProgressSnapshot> {
    const settingKeys = await this.#request<IDBValidKey[]>(
      STORES.settings,
      'readonly',
      (objectStore) => objectStore.getAllKeys(),
    );
    const settingValues = await this.#readAll<string>(STORES.settings);

    return {
      format: SNAPSHOT_FORMAT,
      schemaVersion: LATEST_VERSION,
      exportedAt: new Date().toISOString(),
      settings: Object.fromEntries(
        settingKeys.map((key, index) => [String(key), settingValues[index] ?? '']),
      ),
      mastery: [...(await this.allMastery()).values()],
      reviews: [...(await this.allReviews()).values()],
      attempts: await this.allAttempts(),
    };
  }

  async importAll(snapshot: ProgressSnapshot): Promise<void> {
    assertImportable(snapshot, LATEST_VERSION);
    await this.#replaceAll([
      {
        store: STORES.settings,
        records: Object.entries(snapshot.settings),
      },
      {
        store: STORES.mastery,
        records: snapshot.mastery.map((record) => [record.skillId, record]),
      },
      {
        store: STORES.reviews,
        records: snapshot.reviews.map((record) => [record.skillId, record]),
      },
      {
        store: STORES.attempts,
        records: snapshot.attempts.map((record) => [record.id, record]),
      },
    ]);
  }

  async close(): Promise<void> {
    this.#database.close();
  }
}
