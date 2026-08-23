// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { describe, expect, it } from 'vitest';

import { describeProgressStoreContract } from './conformance.ts';
import { MemoryProgressStore } from './memory-store.ts';
import { parseSnapshot, SNAPSHOT_FORMAT, SnapshotFormatError } from './progress-store.ts';

describeProgressStoreContract('MemoryProgressStore', async () => new MemoryProgressStore());

/**
 * The import boundary.
 *
 * A learner moving to a new machine picks a file out of a folder, and the
 * likeliest mistake is picking the wrong one. Every refusal here should name
 * what was wrong in a sentence they can act on.
 */
describe('parseSnapshot', () => {
  const good = {
    format: SNAPSHOT_FORMAT,
    schemaVersion: 1,
    exportedAt: '2026-08-23T00:00:00.000Z',
    settings: { 'preferences.theme': 'dark' },
    mastery: [{ skillId: 'python.syntax.names', vector: {}, observations: 3 }],
    reviews: [{ skillId: 'python.syntax.names', dueAt: '2026-08-24', intervalDays: 1 }],
    attempts: [{ id: 'a1', exerciseId: 'python.syntax.names', startedAt: '2026-08-23' }],
  };

  it('accepts a well-formed export', () => {
    const parsed = parseSnapshot(good);
    expect(parsed.format).toBe(SNAPSHOT_FORMAT);
    expect(parsed.settings['preferences.theme']).toBe('dark');
    expect(parsed.mastery).toHaveLength(1);
  });

  it('refuses something that is not an object', () => {
    expect(() => parseSnapshot([1, 2, 3])).toThrow(SnapshotFormatError);
    expect(() => parseSnapshot('nope')).toThrow(SnapshotFormatError);
    expect(() => parseSnapshot(null)).toThrow(SnapshotFormatError);
  });

  it('names the missing envelope fields', () => {
    expect(() => parseSnapshot({ format: SNAPSHOT_FORMAT })).toThrow(/schemaVersion/);
  });

  it('refuses a collection that is not an array', () => {
    expect(() => parseSnapshot({ ...good, attempts: 'lots' })).toThrow(/attempts/);
  });

  it('names the record that is malformed, and where', () => {
    const broken = { ...good, mastery: [good.mastery[0], { skillId: 'x' }] };
    expect(() => parseSnapshot(broken)).toThrow(/mastery\[1\].*vector/);
  });

  it('refuses another tool JSON that happens to parse', () => {
    // The realistic accident: a package.json chosen from the same folder.
    expect(() => parseSnapshot({ name: 'my-app', version: '1.0.0' })).toThrow(SnapshotFormatError);
  });
});
