// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type {
  Diagnostic,
  ExecutionRequest,
  ExecutionResult,
  FormatRequest,
  FormatResult,
  LanguageMetadata,
  LanguageRuntime,
  LintRequest,
  LintResult,
  RuntimeDiagnosis,
  SkillMastery,
  TestRequest,
  TestResult,
} from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';
import { catalogFromBundle } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import type { ProgressSnapshot, ProgressStore, StoredReview } from '@code-retrainer/storage';

import type { DesktopBridge } from './bridge.ts';
import type { Platform, PlatformProgress } from './types.ts';

function bridge(): DesktopBridge {
  const found = (window as { codeRetrainerDesktop?: DesktopBridge }).codeRetrainerDesktop;
  if (!found) throw new Error('The desktop bridge is unavailable.');
  return found;
}

/**
 * A `LanguageRuntime` whose work happens in Electron's main process.
 *
 * Learner code must never run in the renderer: the renderer is a browser
 * window with the app's own state in it, and the main process is where the
 * real sandbox, timeouts and process-tree termination live.
 */
class BridgedRuntime implements LanguageRuntime {
  readonly #metadata: LanguageMetadata;

  constructor(metadata: LanguageMetadata) {
    this.#metadata = metadata;
  }

  metadata(): LanguageMetadata {
    return this.#metadata;
  }

  // Every call names its language, so one bridge serves fourteen runtimes.
  #language(): string {
    return this.#metadata.id;
  }

  doctor(): Promise<RuntimeDiagnosis> {
    return bridge().invoke('runtime:doctor', { language: this.#language() });
  }

  execute(request: ExecutionRequest): Promise<ExecutionResult> {
    return bridge().invoke('runtime:execute', { language: this.#language(), request });
  }

  test(request: TestRequest): Promise<TestResult> {
    return bridge().invoke('runtime:test', { language: this.#language(), request });
  }

  format(request: FormatRequest): Promise<FormatResult> {
    return bridge().invoke('runtime:format', { language: this.#language(), request });
  }

  lint(request: LintRequest): Promise<LintResult> {
    return bridge().invoke('runtime:lint', { language: this.#language(), request });
  }

  diagnose(request: LintRequest): Promise<readonly Diagnostic[]> {
    return bridge().invoke('runtime:diagnose', { language: this.#language(), request });
  }
}

/** A `ProgressStore` backed by the SQLite database in the main process. */
class BridgedStore implements ProgressStore {
  getSetting(key: string): Promise<string | null> {
    return bridge().invoke('store:getSetting', key);
  }

  setSetting(key: string, value: string): Promise<void> {
    return bridge().invoke('store:setSetting', { key, value });
  }

  getMastery(skillId: string): Promise<SkillMastery | null> {
    return bridge().invoke('store:getMastery', skillId);
  }

  async allMastery(): Promise<Map<string, SkillMastery>> {
    return new Map(await bridge().invoke('store:allMastery', undefined));
  }

  saveMastery(mastery: SkillMastery): Promise<void> {
    return bridge().invoke('store:saveMastery', mastery);
  }

  async allReviews(): Promise<Map<string, StoredReview>> {
    return new Map(await bridge().invoke('store:allReviews', undefined));
  }

  saveReview(review: StoredReview): Promise<void> {
    return bridge().invoke('store:saveReview', review);
  }

  dueReviews(at: Date): Promise<StoredReview[]> {
    return bridge().invoke('store:dueReviews', at.toISOString());
  }

  getAttempt(id: string): Promise<Attempt | null> {
    return bridge().invoke('store:getAttempt', id);
  }

  attemptsFor(exerciseId: string): Promise<Attempt[]> {
    return bridge().invoke('store:attemptsFor', exerciseId);
  }

  allAttempts(): Promise<Attempt[]> {
    return bridge().invoke('store:allAttempts', undefined);
  }

  saveAttempt(attempt: Attempt): Promise<void> {
    return bridge().invoke('store:saveAttempt', attempt);
  }

  countAttempts(): Promise<number> {
    return bridge().invoke('store:countAttempts', undefined);
  }

  exportAll(): Promise<ProgressSnapshot> {
    return bridge().invoke('store:exportAll', undefined);
  }

  importAll(snapshot: ProgressSnapshot): Promise<void> {
    return bridge().invoke('store:importAll', snapshot);
  }

  close(): Promise<void> {
    // The main process owns the database handle and closes it on quit.
    return Promise.resolve();
  }
}

export async function createDesktopPlatform(
  report: (progress: PlatformProgress) => void = () => {},
): Promise<Platform> {
  report({ stage: 'catalog', message: 'Loading exercises…' });
  // Already a ContentBundle: the main process built it from validated
  // exercises, so there is nothing left to narrow.
  const [bundle, languages] = await Promise.all([
    bridge().invoke('content:bundle', undefined),
    bridge()
      .invoke('runtime:languages', undefined)
      // An older main process without the channel still boots, with the one
      // language its preload advertises.
      .catch(() => [bridge().metadata]),
  ]);

  report({ stage: 'ready', message: 'Ready.' });

  return {
    kind: 'desktop',
    // One bridged runtime per language the main process holds. Adding a
    // language there is enough — nothing here names them.
    runtimes: new Map(
      languages.map((metadata) => [metadata.id, new BridgedRuntime(metadata)] as const),
    ),
    store: new BridgedStore(),
    catalog: catalogFromBundle(bundle),
    skillGraph: SkillGraph.from(bundle.skills),
    persistent: true,
  };
}
