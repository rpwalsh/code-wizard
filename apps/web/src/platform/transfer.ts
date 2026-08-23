// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Moving progress between machines.
 *
 * Everything is stored locally and nothing is synced, which is the privacy
 * property this product is built on — and the direct cost of it is that a
 * second computer starts empty. A file is the honest answer: the learner
 * holds their own history, moves it when they want to, and no service is
 * involved on either end.
 *
 * The snapshot is the store's own export format, so the same file restores
 * into the browser build and the desktop build alike.
 */
import type { JsonValue } from '@code-retrainer/core';
import type { ProgressStore } from '@code-retrainer/storage';
import { parseSnapshot } from '@code-retrainer/storage';

/** A filename that sorts by date and says what it is. */
function suggestedName(at: Date): string {
  const stamp = at.toISOString().slice(0, 10);
  return `code-retrainer-progress-${stamp}.json`;
}

/**
 * Write the learner's whole history to a file they choose.
 *
 * A blob URL and a synthetic click: the file never leaves the machine, which
 * is the point. The URL is revoked immediately — it names memory, and a page
 * that leaks one per export holds every past snapshot alive.
 */
export async function exportProgress(store: ProgressStore, now = new Date()): Promise<string> {
  const snapshot = await store.exportAll();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const name = suggestedName(now);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }

  return name;
}

/**
 * Read a snapshot back, replacing what is here.
 *
 * Deliberately a replace rather than a merge: two histories of the same
 * exercise cannot be reconciled without inventing an order for them, and an
 * invented order would show up as fluency the learner never demonstrated.
 * The caller is expected to have said so out loud before calling this.
 */
export async function importProgress(store: ProgressStore, file: File): Promise<void> {
  const text = await file.text();

  // Parsed here so a malformed file fails with "that is not a snapshot"
  // rather than something from deep inside the store.
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  // The storage package owns the format, so it owns the check: parseSnapshot
  // refuses anything that is not an export, and the store then refuses one
  // from a newer build.
  await store.importAll(parseSnapshot(parsed));
}

/** Ask the browser for a file, resolving to null when the picker is dismissed. */
export function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    });
    // A dismissed picker fires no change event in most browsers; the promise
    // simply never settles, and the command quietly does nothing — which is
    // what a canceled file dialog should do.
    document.body.append(input);
    input.click();
  });
}
