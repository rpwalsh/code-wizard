// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { makeMastery } from '@code-wizard/core';
import type { Attempt } from '@code-wizard/learning';
import { recordEvent, startAttempt } from '@code-wizard/learning';
import { describe, expect, it } from 'vitest';

import type { ProgressStore, StoredReview } from './progress-store.ts';
import { SNAPSHOT_FORMAT } from './progress-store.ts';
import { LATEST_VERSION } from './version.ts';

export function attemptFixture(id = 'a1'): Attempt {
  let attempt = startAttempt({
    id,
    exerciseId: 'python.collections.dict-lookup',
    exerciseVersion: 3,
    mode: 'fluency',
    startedAt: '2026-03-01T10:00:00.000Z',
  });
  attempt = recordEvent(attempt, {
    type: 'test',
    at: '2026-03-01T10:00:30.000Z',
    passed: 2,
    failed: 3,
    errored: 0,
    green: false,
  });
  attempt = recordEvent(attempt, {
    type: 'hint',
    at: '2026-03-01T10:01:00.000Z',
    level: 'structural',
  });
  attempt = recordEvent(attempt, {
    type: 'test',
    at: '2026-03-01T10:02:00.000Z',
    passed: 5,
    failed: 0,
    errored: 0,
    green: true,
  });
  return attempt;
}

export const reviewFixture: StoredReview = {
  skillId: 'python.collections.dict',
  lastReviewedAt: '2026-03-01T10:00:00.000Z',
  dueAt: '2026-03-04T10:00:00.000Z',
  intervalDays: 3,
  streak: 2,
  lapses: 1,
};

/**
 * The `ProgressStore` contract, run against every backend.
 *
 * The desktop build stores progress in SQLite and the web build stores it in
 * IndexedDB. If those two ever disagree about what "saved" means, a learner
 * who exports from one and imports into the other silently loses something.
 * One suite, three implementations, is the only way to know they agree.
 */
export function describeProgressStoreContract(
  name: string,
  createStore: () => Promise<ProgressStore>,
): void {
  describe(`${name} — ProgressStore contract`, () => {
    async function withStore(body: (store: ProgressStore) => Promise<void>): Promise<void> {
      const store = await createStore();
      try {
        await body(store);
      } finally {
        await store.close();
      }
    }

    it('returns null for a setting that was never written', async () => {
      await withStore(async (store) => {
        expect(await store.getSetting('missing')).toBeNull();
      });
    });

    it('overwrites a setting rather than duplicating it', async () => {
      await withStore(async (store) => {
        await store.setSetting('theme', 'dark');
        await store.setSetting('theme', 'light');
        expect(await store.getSetting('theme')).toBe('light');
      });
    });

    it('round-trips every mastery dimension', async () => {
      await withStore(async (store) => {
        await store.saveMastery({
          skillId: 's',
          vector: makeMastery({ knowledge: 0.9, recall: 0.42, independence: 0.13 }),
          observations: 7,
          lastPracticedAt: '2026-03-01T10:00:00.000Z',
        });

        const loaded = await store.getMastery('s');
        expect(loaded?.vector.knowledge).toBe(0.9);
        expect(loaded?.vector.recall).toBe(0.42);
        expect(loaded?.vector.independence).toBe(0.13);
        expect(loaded?.observations).toBe(7);
        expect(loaded?.lastPracticedAt).toBe('2026-03-01T10:00:00.000Z');
      });
    });

    it('upserts mastery rather than duplicating it', async () => {
      await withStore(async (store) => {
        const base = {
          skillId: 's',
          vector: makeMastery({ recall: 0.1 }),
          observations: 1,
          lastPracticedAt: null,
        };
        await store.saveMastery(base);
        await store.saveMastery({ ...base, vector: makeMastery({ recall: 0.6 }), observations: 2 });

        expect((await store.allMastery()).size).toBe(1);
        expect((await store.getMastery('s'))?.vector.recall).toBe(0.6);
      });
    });

    it('keeps a never-practiced skill null rather than epoch', async () => {
      await withStore(async (store) => {
        await store.saveMastery({
          skillId: 's',
          vector: makeMastery({}),
          observations: 0,
          lastPracticedAt: null,
        });
        expect((await store.getMastery('s'))?.lastPracticedAt).toBeNull();
      });
    });

    it('reports which reviews are due, most overdue first', async () => {
      await withStore(async (store) => {
        await store.saveReview(reviewFixture);
        await store.saveReview({
          ...reviewFixture,
          skillId: 'very-overdue',
          dueAt: '2026-01-01T00:00:00.000Z',
        });
        await store.saveReview({
          ...reviewFixture,
          skillId: 'later',
          dueAt: '2026-04-01T00:00:00.000Z',
        });

        expect((await store.allReviews()).size).toBe(3);
        const due = await store.dueReviews(new Date('2026-03-10T00:00:00.000Z'));
        expect(due.map((state) => state.skillId)).toEqual(['very-overdue', reviewFixture.skillId]);
      });
    });

    it('round-trips an attempt with its event log intact', async () => {
      await withStore(async (store) => {
        const attempt = attemptFixture();
        await store.saveAttempt(attempt);
        expect(await store.getAttempt('a1')).toEqual(attempt);
      });
    });

    it('preserves the exercise version the attempt was made against', async () => {
      await withStore(async (store) => {
        await store.saveAttempt(attemptFixture());
        expect((await store.getAttempt('a1'))?.exerciseVersion).toBe(3);
      });
    });

    it('round-trips the final files', async () => {
      await withStore(async (store) => {
        await store.saveAttempt({
          ...attemptFixture(),
          finalFiles: { 'main.py': 'print(1)\n' },
        });
        expect((await store.getAttempt('a1'))?.finalFiles).toEqual({ 'main.py': 'print(1)\n' });
      });
    });

    it('saving the same attempt twice does not duplicate it or its events', async () => {
      await withStore(async (store) => {
        const attempt = attemptFixture();
        await store.saveAttempt(attempt);
        await store.saveAttempt(attempt);

        expect(await store.countAttempts()).toBe(1);
        expect((await store.getAttempt('a1'))?.events).toHaveLength(3);
      });
    });

    it('lists attempts for one exercise, oldest first', async () => {
      await withStore(async (store) => {
        await store.saveAttempt({
          ...attemptFixture('later'),
          startedAt: '2026-03-05T10:00:00.000Z',
        });
        await store.saveAttempt(attemptFixture('earlier'));
        await store.saveAttempt({ ...attemptFixture('other'), exerciseId: 'python.other' });

        const found = await store.attemptsFor('python.collections.dict-lookup');
        expect(found.map((attempt) => attempt.id)).toEqual(['earlier', 'later']);
      });
    });

    it('round-trips a whole profile through export and import', async () => {
      const source = await createStore();
      await source.setSetting('language', 'python');
      await source.saveMastery({
        skillId: 's',
        vector: makeMastery({ recall: 0.65 }),
        observations: 4,
        lastPracticedAt: '2026-03-01T10:00:00.000Z',
      });
      await source.saveReview(reviewFixture);
      await source.saveAttempt(attemptFixture());
      const snapshot = await source.exportAll();
      await source.close();

      expect(snapshot.format).toBe(SNAPSHOT_FORMAT);

      await withStore(async (target) => {
        await target.importAll(snapshot);
        expect(await target.getSetting('language')).toBe('python');
        expect((await target.getMastery('s'))?.vector.recall).toBe(0.65);
        expect((await target.allReviews()).size).toBe(1);
        expect((await target.getAttempt('a1'))?.events).toHaveLength(3);
      });
    });

    it('replaces existing data on import rather than merging', async () => {
      const source = await createStore();
      await source.setSetting('language', 'python');
      const snapshot = await source.exportAll();
      await source.close();

      await withStore(async (target) => {
        await target.saveAttempt(attemptFixture('stale'));
        await target.importAll(snapshot);
        expect(await target.countAttempts()).toBe(0);
      });
    });

    it('refuses an unrecognized export', async () => {
      await withStore(async (store) => {
        await expect(
          store.importAll({
            format: 'something-else',
            schemaVersion: 1,
            exportedAt: '',
            settings: {},
            mastery: [],
            reviews: [],
            attempts: [],
          }),
        ).rejects.toThrow(/Not a Code Wizard progress export/);
      });
    });

    it('refuses an export from a newer schema', async () => {
      await withStore(async (store) => {
        await expect(
          store.importAll({
            format: SNAPSHOT_FORMAT,
            schemaVersion: LATEST_VERSION + 1,
            exportedAt: '',
            settings: {},
            mastery: [],
            reviews: [],
            attempts: [],
          }),
        ).rejects.toThrow(/understands/);
      });
    });
  });
}
