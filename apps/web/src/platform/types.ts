import type { LanguageRuntime, SkillGraph } from '@forge/core';
import type { ExerciseCatalog } from '@forge/exercises';
import type { ProgressStore } from '@forge/storage';

/**
 * Everything the application needs from the machine it is running on.
 *
 * There are exactly two implementations — the browser and the desktop app —
 * and this interface is the only place the difference exists. Every screen,
 * every engine and every exercise is identical on both.
 */
export interface Platform {
  readonly kind: 'web' | 'desktop';
  readonly runtime: LanguageRuntime;
  readonly store: ProgressStore;
  readonly catalog: ExerciseCatalog;
  readonly skillGraph: SkillGraph;
  /**
   * True when progress survives closing the app. False in a private window or
   * a browser that blocks site data — the learner is told, rather than
   * discovering it later.
   */
  readonly persistent: boolean;
  readonly storageNote?: string;
  /** Warms the language runtime so the first exercise does not pay for it. */
  warmUp?(): Promise<void>;
}

export interface PlatformProgress {
  readonly stage: 'catalog' | 'storage' | 'runtime' | 'ready';
  readonly message: string;
}
