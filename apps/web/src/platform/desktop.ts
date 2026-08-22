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
} from '@forge/core';
import { SkillGraph } from '@forge/core';
import type { ContentBundle } from '@forge/exercises';
import { catalogFromBundle, parseBundle } from '@forge/exercises';
import type { Attempt } from '@forge/learning';
import type { ProgressSnapshot, ProgressStore, StoredReview } from '@forge/storage';

import type { Platform, PlatformProgress } from './types.ts';

/**
 * The surface Electron's preload script exposes.
 *
 * A single `invoke` rather than a method per operation: the channel list is
 * whitelisted in the preload, and keeping the bridge this narrow means the
 * renderer is never handed a Node capability it could be tricked into using.
 */
interface DesktopBridge {
  invoke(channel: string, payload?: unknown): Promise<unknown>;
  readonly metadata: LanguageMetadata;
}

function bridge(): DesktopBridge {
  const found = (window as { forgeDesktop?: DesktopBridge }).forgeDesktop;
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
  metadata(): LanguageMetadata {
    return bridge().metadata;
  }

  doctor(): Promise<RuntimeDiagnosis> {
    return bridge().invoke('runtime:doctor') as Promise<RuntimeDiagnosis>;
  }

  execute(request: ExecutionRequest): Promise<ExecutionResult> {
    return bridge().invoke('runtime:execute', request) as Promise<ExecutionResult>;
  }

  test(request: TestRequest): Promise<TestResult> {
    return bridge().invoke('runtime:test', request) as Promise<TestResult>;
  }

  format(request: FormatRequest): Promise<FormatResult> {
    return bridge().invoke('runtime:format', request) as Promise<FormatResult>;
  }

  lint(request: LintRequest): Promise<LintResult> {
    return bridge().invoke('runtime:lint', request) as Promise<LintResult>;
  }

  diagnose(request: LintRequest): Promise<readonly Diagnostic[]> {
    return bridge().invoke('runtime:diagnose', request) as Promise<readonly Diagnostic[]>;
  }
}

/** A `ProgressStore` backed by the SQLite database in the main process. */
class BridgedStore implements ProgressStore {
  #call<T>(channel: string, payload?: unknown): Promise<T> {
    return bridge().invoke(channel, payload) as Promise<T>;
  }

  getSetting(key: string): Promise<string | null> {
    return this.#call('store:getSetting', key);
  }

  setSetting(key: string, value: string): Promise<void> {
    return this.#call('store:setSetting', { key, value });
  }

  getMastery(skillId: string): Promise<SkillMastery | null> {
    return this.#call('store:getMastery', skillId);
  }

  async allMastery(): Promise<Map<string, SkillMastery>> {
    // Maps do not survive IPC structured clone in every Electron version, so
    // the bridge carries entries and the map is rebuilt here.
    return new Map(await this.#call<[string, SkillMastery][]>('store:allMastery'));
  }

  saveMastery(mastery: SkillMastery): Promise<void> {
    return this.#call('store:saveMastery', mastery);
  }

  async allReviews(): Promise<Map<string, StoredReview>> {
    return new Map(await this.#call<[string, StoredReview][]>('store:allReviews'));
  }

  saveReview(review: StoredReview): Promise<void> {
    return this.#call('store:saveReview', review);
  }

  dueReviews(at: Date): Promise<StoredReview[]> {
    return this.#call('store:dueReviews', at.toISOString());
  }

  getAttempt(id: string): Promise<Attempt | null> {
    return this.#call('store:getAttempt', id);
  }

  attemptsFor(exerciseId: string): Promise<Attempt[]> {
    return this.#call('store:attemptsFor', exerciseId);
  }

  allAttempts(): Promise<Attempt[]> {
    return this.#call('store:allAttempts');
  }

  saveAttempt(attempt: Attempt): Promise<void> {
    return this.#call('store:saveAttempt', attempt);
  }

  countAttempts(): Promise<number> {
    return this.#call('store:countAttempts');
  }

  exportAll(): Promise<ProgressSnapshot> {
    return this.#call('store:exportAll');
  }

  importAll(snapshot: ProgressSnapshot): Promise<void> {
    return this.#call('store:importAll', snapshot);
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
  const bundle = parseBundle((await bridge().invoke('content:bundle')) as ContentBundle);

  report({ stage: 'ready', message: 'Ready.' });

  return {
    kind: 'desktop',
    runtime: new BridgedRuntime(),
    store: new BridgedStore(),
    catalog: catalogFromBundle(bundle),
    skillGraph: SkillGraph.from(bundle.skills),
    persistent: true,
  };
}
