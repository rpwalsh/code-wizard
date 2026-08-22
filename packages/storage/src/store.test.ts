import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import os from 'node:os';
import path from 'node:path';

import { makeMastery } from '@forge/core';
import type { Attempt } from '@forge/learning';
import { recordEvent, startAttempt } from '@forge/learning';
import { afterEach, describe, expect, it } from 'vitest';

import { LATEST_VERSION, SchemaTooNewError } from './schema.ts';
import type { StoredReview } from './store.ts';
import { ForgeStore } from './store.ts';

const temporary: string[] = [];

afterEach(() => {
  for (const directory of temporary.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function onDisk(): { store: ForgeStore; file: string } {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-store-'));
  temporary.push(directory);
  const file = path.join(directory, 'nested', 'progress.db');
  return { store: ForgeStore.open({ location: file }), file };
}

function attemptFixture(id = 'a1'): Attempt {
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

const review: StoredReview = {
  skillId: 'python.collections.dict',
  lastReviewedAt: '2026-03-01T10:00:00.000Z',
  dueAt: '2026-03-04T10:00:00.000Z',
  intervalDays: 3,
  streak: 2,
  lapses: 1,
};

describe('schema', () => {
  it('migrates a new database to the latest version', () => {
    const store = ForgeStore.openInMemory();
    expect(store.schemaVersion).toBe(LATEST_VERSION);
    store.close();
  });

  it('is idempotent when reopening an existing file', () => {
    const { store, file } = onDisk();
    store.setSetting('language', 'python');
    store.close();

    const reopened = ForgeStore.open({ location: file });
    expect(reopened.schemaVersion).toBe(LATEST_VERSION);
    expect(reopened.getSetting('language')).toBe('python');
    reopened.close();
  });

  it('creates the parent directory for the database file', () => {
    const { store, file } = onDisk();
    expect(fs.existsSync(path.dirname(file))).toBe(true);
    store.close();
  });

  it('refuses a database written by a newer build', () => {
    const { store, file } = onDisk();
    store.close();

    // Simulate a future Forge having upgraded this profile.
    const raw = new DatabaseSync(file);
    raw.exec(`PRAGMA user_version = ${LATEST_VERSION + 5}`);
    raw.close();

    expect(() => ForgeStore.open({ location: file })).toThrow(SchemaTooNewError);
  });
});

describe('settings', () => {
  it('round-trips and overwrites', () => {
    const store = ForgeStore.openInMemory();
    expect(store.getSetting('missing')).toBeNull();
    store.setSetting('theme', 'dark');
    store.setSetting('theme', 'light');
    expect(store.getSetting('theme')).toBe('light');
    store.close();
  });
});

describe('mastery', () => {
  it('round-trips every dimension', () => {
    const store = ForgeStore.openInMemory();
    store.saveMastery({
      skillId: 's',
      vector: makeMastery({ knowledge: 0.9, recall: 0.42, independence: 0.13 }),
      observations: 7,
      lastPracticedAt: '2026-03-01T10:00:00.000Z',
    });

    const loaded = store.getMastery('s');
    expect(loaded?.vector.knowledge).toBe(0.9);
    expect(loaded?.vector.recall).toBe(0.42);
    expect(loaded?.vector.independence).toBe(0.13);
    expect(loaded?.observations).toBe(7);
    expect(loaded?.lastPracticedAt).toBe('2026-03-01T10:00:00.000Z');
    store.close();
  });

  it('upserts rather than duplicating', () => {
    const store = ForgeStore.openInMemory();
    const base = {
      skillId: 's',
      vector: makeMastery({ recall: 0.1 }),
      observations: 1,
      lastPracticedAt: null,
    };
    store.saveMastery(base);
    store.saveMastery({ ...base, vector: makeMastery({ recall: 0.6 }), observations: 2 });

    expect(store.allMastery().size).toBe(1);
    expect(store.getMastery('s')?.vector.recall).toBe(0.6);
    store.close();
  });

  it('keeps a never-practised skill null rather than epoch', () => {
    const store = ForgeStore.openInMemory();
    store.saveMastery({
      skillId: 's',
      vector: makeMastery({}),
      observations: 0,
      lastPracticedAt: null,
    });
    expect(store.getMastery('s')?.lastPracticedAt).toBeNull();
    store.close();
  });
});

describe('reviews', () => {
  it('round-trips and reports what is due', () => {
    const store = ForgeStore.openInMemory();
    store.saveReview(review);
    store.saveReview({ ...review, skillId: 'later', dueAt: '2026-04-01T00:00:00.000Z' });

    expect(store.allReviews().size).toBe(2);
    const due = store.dueReviews(new Date('2026-03-10T00:00:00.000Z'));
    expect(due.map((state) => state.skillId)).toEqual([review.skillId]);
    store.close();
  });
});

describe('attempts', () => {
  it('round-trips an attempt with its event log intact', () => {
    const store = ForgeStore.openInMemory();
    const attempt = attemptFixture();
    store.saveAttempt(attempt);

    const loaded = store.getAttempt('a1');
    expect(loaded).toEqual(attempt);
    store.close();
  });

  it('preserves the exercise version the attempt was made against', () => {
    const store = ForgeStore.openInMemory();
    store.saveAttempt(attemptFixture());
    expect(store.getAttempt('a1')?.exerciseVersion).toBe(3);
    store.close();
  });

  it('round-trips the final files', () => {
    const store = ForgeStore.openInMemory();
    const attempt = { ...attemptFixture(), finalFiles: { 'main.py': 'print(1)\n' } };
    store.saveAttempt(attempt);
    expect(store.getAttempt('a1')?.finalFiles).toEqual({ 'main.py': 'print(1)\n' });
    store.close();
  });

  it('saving the same attempt twice does not duplicate its events', () => {
    const store = ForgeStore.openInMemory();
    const attempt = attemptFixture();
    store.saveAttempt(attempt);
    store.saveAttempt(attempt);

    expect(store.countAttempts()).toBe(1);
    expect(store.getAttempt('a1')?.events).toHaveLength(3);
    store.close();
  });

  it('lists attempts for one exercise, oldest first', () => {
    const store = ForgeStore.openInMemory();
    store.saveAttempt({ ...attemptFixture('later'), startedAt: '2026-03-05T10:00:00.000Z' });
    store.saveAttempt(attemptFixture('earlier'));
    store.saveAttempt({ ...attemptFixture('other'), exerciseId: 'python.other' });

    const found = store.attemptsFor('python.collections.dict-lookup');
    expect(found.map((attempt) => attempt.id)).toEqual(['earlier', 'later']);
    store.close();
  });

  it('supports a transaction nested inside another', () => {
    const store = ForgeStore.openInMemory();
    store.transaction(() => {
      store.setSetting('outer', 'yes');
      store.saveAttempt(attemptFixture());
    });
    expect(store.getSetting('outer')).toBe('yes');
    expect(store.countAttempts()).toBe(1);
    store.close();
  });

  it('rolls an inner transaction back without losing the outer one', () => {
    const store = ForgeStore.openInMemory();
    store.transaction(() => {
      store.setSetting('kept', 'yes');
      try {
        store.transaction(() => {
          store.setSetting('discarded', 'yes');
          throw new Error('inner failed');
        });
      } catch {
        // Handled: the outer transaction continues.
      }
      store.setSetting('also-kept', 'yes');
    });

    expect(store.getSetting('kept')).toBe('yes');
    expect(store.getSetting('also-kept')).toBe('yes');
    expect(store.getSetting('discarded')).toBeNull();
    store.close();
  });

  it('rolls back a failed transaction rather than half-writing', () => {
    const store = ForgeStore.openInMemory();
    store.saveAttempt(attemptFixture());

    expect(() =>
      store.transaction(() => {
        store.setSetting('half', 'written');
        throw new Error('interrupted');
      }),
    ).toThrow('interrupted');

    expect(store.getSetting('half')).toBeNull();
    // The attempt written before the failed transaction is untouched.
    expect(store.countAttempts()).toBe(1);
    store.close();
  });

  it('survives a close and reopen', () => {
    const { store, file } = onDisk();
    store.saveAttempt(attemptFixture());
    store.saveMastery({
      skillId: 's',
      vector: makeMastery({ recall: 0.5 }),
      observations: 3,
      lastPracticedAt: null,
    });
    store.close();

    const reopened = ForgeStore.open({ location: file });
    expect(reopened.countAttempts()).toBe(1);
    expect(reopened.getMastery('s')?.vector.recall).toBe(0.5);
    reopened.close();
  });
});

describe('export and import', () => {
  it('round-trips a whole profile into an empty store', () => {
    const source = ForgeStore.openInMemory();
    source.setSetting('language', 'python');
    source.saveMastery({
      skillId: 's',
      vector: makeMastery({ recall: 0.65 }),
      observations: 4,
      lastPracticedAt: '2026-03-01T10:00:00.000Z',
    });
    source.saveReview(review);
    source.saveAttempt(attemptFixture());

    const exported = source.exportAll();
    source.close();

    const target = ForgeStore.openInMemory();
    target.importAll(exported);

    expect(target.getSetting('language')).toBe('python');
    expect(target.getMastery('s')?.vector.recall).toBe(0.65);
    expect(target.allReviews().size).toBe(1);
    expect(target.getAttempt('a1')?.events).toHaveLength(3);
    target.close();
  });

  it('replaces existing data rather than merging', () => {
    const source = ForgeStore.openInMemory();
    source.setSetting('language', 'python');
    const exported = source.exportAll();
    source.close();

    const target = ForgeStore.openInMemory();
    target.saveAttempt(attemptFixture('stale'));
    target.importAll(exported);

    expect(target.countAttempts()).toBe(0);
    target.close();
  });

  it('refuses an unrecognised export', () => {
    const store = ForgeStore.openInMemory();
    expect(() =>
      store.importAll({
        format: 'something-else',
        schemaVersion: 1,
        exportedAt: '',
        settings: {},
        mastery: [],
        reviews: [],
        attempts: [],
      }),
    ).toThrow(/Not a Forge progress export/);
    store.close();
  });

  it('refuses an export from a newer schema', () => {
    const store = ForgeStore.openInMemory();
    expect(() =>
      store.importAll({
        format: 'forge-progress',
        schemaVersion: LATEST_VERSION + 1,
        exportedAt: '',
        settings: {},
        mastery: [],
        reviews: [],
        attempts: [],
      }),
    ).toThrow(/newer|understands/);
    store.close();
  });
});
