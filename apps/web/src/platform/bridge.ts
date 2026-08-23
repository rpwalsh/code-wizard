// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type {
  Diagnostic,
  ExecutionRequest,
  ExecutionResult,
  FormatRequest,
  FormatResult,
  LanguageMetadata,
  LintRequest,
  LintResult,
  RuntimeDiagnosis,
  SkillMastery,
  TestRequest,
  TestResult,
} from '@code-retrainer/core';
import type { ContentBundle } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import type { ProgressSnapshot, StoredReview } from '@code-retrainer/storage';

/**
 * The desktop IPC contract, written once and shared by both sides.
 *
 * A channel map rather than a `string`-keyed bag: the preload validates
 * against the same list the renderer calls through, and neither side can send
 * a payload the other does not expect without the compiler noticing.
 */
export interface DesktopChannels {
  'content:bundle': { payload: void; result: ContentBundle };

  /**
   * Every runtime the main process holds.
   *
   * The renderer builds one bridged runtime per entry, so adding a language
   * to the main process is enough — nothing here enumerates them by name.
   */
  'runtime:languages': { payload: void; result: LanguageMetadata[] };

  /*
   * Every runtime call carries the language it is for. The desktop build has
   * fourteen runtimes and one IPC channel each; without the id the main
   * process would have to guess which one a request meant, which is how a
   * Rust exercise ends up being run by the Python interpreter.
   */
  'runtime:doctor': { payload: { language: string }; result: RuntimeDiagnosis };
  'runtime:execute': {
    payload: { language: string; request: ExecutionRequest };
    result: ExecutionResult;
  };
  'runtime:test': { payload: { language: string; request: TestRequest }; result: TestResult };
  'runtime:format': {
    payload: { language: string; request: FormatRequest };
    result: FormatResult;
  };
  'runtime:lint': { payload: { language: string; request: LintRequest }; result: LintResult };
  'runtime:diagnose': {
    payload: { language: string; request: LintRequest };
    result: readonly Diagnostic[];
  };

  'store:getSetting': { payload: string; result: string | null };
  'store:setSetting': { payload: { key: string; value: string }; result: void };
  'store:getMastery': { payload: string; result: SkillMastery | null };
  // Maps do not survive structured clone across every Electron version, so
  // these carry entries and the renderer rebuilds the map.
  'store:allMastery': { payload: void; result: [string, SkillMastery][] };
  'store:saveMastery': { payload: SkillMastery; result: void };
  'store:allReviews': { payload: void; result: [string, StoredReview][] };
  'store:saveReview': { payload: StoredReview; result: void };
  'store:dueReviews': { payload: string; result: StoredReview[] };
  'store:getAttempt': { payload: string; result: Attempt | null };
  'store:attemptsFor': { payload: string; result: Attempt[] };
  'store:allAttempts': { payload: void; result: Attempt[] };
  'store:saveAttempt': { payload: Attempt; result: void };
  'store:countAttempts': { payload: void; result: number };
  'store:exportAll': { payload: void; result: ProgressSnapshot };
  'store:importAll': { payload: ProgressSnapshot; result: void };
}

export type DesktopChannel = keyof DesktopChannels;

export type PayloadOf<C extends DesktopChannel> = DesktopChannels[C]['payload'];
export type ResultOf<C extends DesktopChannel> = DesktopChannels[C]['result'];

/** Every channel name, for the preload's whitelist. */
export const DESKTOP_CHANNELS: readonly DesktopChannel[] = [
  'content:bundle',
  'runtime:languages',
  'runtime:doctor',
  'runtime:execute',
  'runtime:test',
  'runtime:format',
  'runtime:lint',
  'runtime:diagnose',
  'store:getSetting',
  'store:setSetting',
  'store:getMastery',
  'store:allMastery',
  'store:saveMastery',
  'store:allReviews',
  'store:saveReview',
  'store:dueReviews',
  'store:getAttempt',
  'store:attemptsFor',
  'store:allAttempts',
  'store:saveAttempt',
  'store:countAttempts',
  'store:exportAll',
  'store:importAll',
];

/** The surface Electron's preload script exposes to the renderer. */
export interface DesktopBridge {
  invoke<C extends DesktopChannel>(channel: C, payload: PayloadOf<C>): Promise<ResultOf<C>>;
  /**
   * The default language's metadata, kept for the boot screen before the
   * full list has been fetched. Everything else asks `runtime:languages`.
   */
  readonly metadata: LanguageMetadata;
}
