import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

import { attemptFixture, describeProgressStoreContract } from './conformance.ts';
import { SchemaTooNewError } from './schema.ts';
import { SqliteProgressStore } from './sqlite-store.ts';
import { LATEST_VERSION } from './version.ts';

describeProgressStoreContract('SqliteProgressStore', async () =>
  SqliteProgressStore.openInMemory(),
);

const temporary: string[] = [];

afterEach(() => {
  for (const directory of temporary.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function onDisk(): { store: SqliteProgressStore; file: string } {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'code-retrainer-store-'));
  temporary.push(directory);
  const file = path.join(directory, 'nested', 'progress.db');
  return { store: SqliteProgressStore.open({ location: file }), file };
}

describe('SQLite specifics', () => {
  it('migrates a new database to the latest version', async () => {
    const store = SqliteProgressStore.openInMemory();
    expect(store.schemaVersion).toBe(LATEST_VERSION);
    await store.close();
  });

  it('is idempotent when reopening an existing file', async () => {
    const { store, file } = onDisk();
    await store.setSetting('language', 'python');
    await store.close();

    const reopened = SqliteProgressStore.open({ location: file });
    expect(reopened.schemaVersion).toBe(LATEST_VERSION);
    expect(await reopened.getSetting('language')).toBe('python');
    await reopened.close();
  });

  it('creates the parent directory for the database file', async () => {
    const { store, file } = onDisk();
    expect(fs.existsSync(path.dirname(file))).toBe(true);
    await store.close();
  });

  it('refuses a database written by a newer build', async () => {
    const { store, file } = onDisk();
    await store.close();

    // Simulate a future Code Retrainer having upgraded this profile.
    const raw = new DatabaseSync(file);
    raw.exec(`PRAGMA user_version = ${LATEST_VERSION + 5}`);
    raw.close();

    expect(() => SqliteProgressStore.open({ location: file })).toThrow(SchemaTooNewError);
  });

  it('supports a transaction nested inside another', async () => {
    const store = SqliteProgressStore.openInMemory();
    await store.setSetting('outer', 'yes');
    store.transaction(() => {
      void store.saveAttempt(attemptFixture());
    });
    expect(await store.getSetting('outer')).toBe('yes');
    expect(await store.countAttempts()).toBe(1);
    await store.close();
  });

  it('rolls an inner transaction back without losing the outer one', async () => {
    const store = SqliteProgressStore.openInMemory();
    store.transaction(() => {
      void store.setSetting('kept', 'yes');
      try {
        store.transaction(() => {
          void store.setSetting('discarded', 'yes');
          throw new Error('inner failed');
        });
      } catch {
        // Handled: the outer transaction continues.
      }
      void store.setSetting('also-kept', 'yes');
    });

    expect(await store.getSetting('kept')).toBe('yes');
    expect(await store.getSetting('also-kept')).toBe('yes');
    expect(await store.getSetting('discarded')).toBeNull();
    await store.close();
  });

  it('survives a close and reopen', async () => {
    const { store, file } = onDisk();
    await store.saveAttempt(attemptFixture());
    await store.close();

    const reopened = SqliteProgressStore.open({ location: file });
    expect(await reopened.countAttempts()).toBe(1);
    await reopened.close();
  });
});
