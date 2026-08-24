// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { LanguageRuntime, SkillGraph } from '@code-wizard/core';
import type { ExerciseCatalog } from '@code-wizard/exercises';
import type { ProgressStore } from '@code-wizard/storage';

/**
 * Everything the application needs from the machine it is running on.
 *
 * There are exactly two implementations — the browser and the desktop app —
 * and this interface is the only place the difference exists. Every screen,
 * every engine and every exercise is identical on both.
 */
export interface Platform {
  readonly kind: 'web' | 'desktop';
  /**
   * The languages this build can actually execute.
   *
   * A registry rather than one runtime, because the browser is no longer a
   * one-language environment: CPython arrives as WebAssembly, and JavaScript,
   * TypeScript, React and Angular need nothing at all, since the page is
   * already a JavaScript engine.
   *
   * A language absent here is a language this build cannot run. The catalog
   * is filtered against it rather than the other way round, so nothing is
   * offered that would fail when opened.
   */
  readonly runtimes: ReadonlyMap<string, LanguageRuntime>;
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
  /** Warms the heaviest runtime so the first exercise does not pay for it. */
  warmUp?(): Promise<void>;
}

export interface PlatformProgress {
  readonly stage: 'catalog' | 'storage' | 'runtime' | 'ready';
  readonly message: string;
}
