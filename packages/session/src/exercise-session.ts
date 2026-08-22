import type {
  ExecutionResult,
  LanguageRuntime,
  SkillGraph,
  TestResult,
  TraceResult,
  TrainingMode,
} from '@code-retrainer/core';
import type { Prediction } from '@code-retrainer/core';
import {
  affordancesFor,
  headlineMastery,
  isGreen,
  isPredictionCorrect,
} from '@code-retrainer/core';
import type { Demonstration, DemonstrationResult } from '@code-retrainer/curriculum';
import { creditDemonstration, judgeDemonstration } from '@code-retrainer/curriculum';
import type { Exercise, Hint } from '@code-retrainer/exercises';
import { attemptWorkspace, orderedHints, testVisibility } from '@code-retrainer/exercises';
import type { Attempt, MasteryChange } from '@code-retrainer/learning';
import {
  abandonAttempt,
  applyObservation,
  attachFinalFiles,
  computeMetrics,
  emptyMastery,
  gradeAttempt,
  gradingContext,
  recordEvent,
  reinforceRetention,
  startAttempt,
} from '@code-retrainer/learning';
import type { ProgressStore, StoredReview } from '@code-retrainer/storage';
import { scheduleNext } from '@code-retrainer/curriculum';

export interface SessionDependencies {
  readonly runtime: LanguageRuntime;
  readonly store: ProgressStore;
  readonly skillGraph: SkillGraph;
  /**
   * Which skills another exercise trains.
   *
   * Needed to tell transfer from repetition: solving something new only counts
   * as transfer if its skills were practised elsewhere first.
   */
  readonly skillsOf?: (exerciseId: string) => readonly string[];
  /**
   * Present when this sitting is a claim being tested rather than practice.
   *
   * A demonstration is graded like any other attempt — the evidence is real
   * either way — and then judged a second time, more strictly, to decide
   * whether the shortcut the learner asked for is granted.
   */
  readonly demonstration?: Demonstration;
  /** Injected so tests are deterministic and history is reproducible. */
  readonly clock?: () => Date;
  readonly newId?: () => string;
}

export interface SessionFile {
  readonly path: string;
  readonly contents: string;
  readonly readOnly: boolean;
  readonly hidden: boolean;
}

export type SessionActivity = 'idle' | 'running' | 'testing' | 'tracing';

export interface CompletionReport {
  readonly solved: boolean;
  readonly durationMs: number;
  readonly independent: boolean;
  readonly hintsUsed: number;
  /** What moved, and why, in the learner's language. */
  readonly changes: readonly MasteryChange[];
  readonly reasons: readonly string[];
  readonly reviewNotes: readonly string[];
  /** How the claim went, when this sitting was a demonstration. */
  readonly demonstration: DemonstrationResult | null;
}

export interface SessionState {
  readonly exercise: Exercise;
  readonly mode: TrainingMode;
  readonly files: readonly SessionFile[];
  readonly activity: SessionActivity;
  readonly lastRun: ExecutionResult | null;
  readonly lastTests: TestResult | null;
  readonly lastTrace: TraceResult | null;
  /** False when the language runtime cannot record a trace at all. */
  readonly tracingAvailable: boolean;
  /** Hints the learner has chosen to reveal, in order. */
  readonly revealedHints: readonly Hint[];
  readonly remainingHints: number;
  readonly solved: boolean;
  readonly completion: CompletionReport | null;
  /** True when the mode forbids hints entirely (spec §9). */
  readonly hintsAllowed: boolean;
  readonly documentationAllowed: boolean;
  /** A claim the learner has made and not yet had judged. */
  readonly pendingPrediction: Prediction | null;
  /** Every prediction this attempt has had judged, oldest first. */
  readonly predictions: readonly PredictionRecord[];
}

/** A judged prediction, as the workspace shows it back. */
export interface PredictionRecord {
  readonly about: Prediction['about'];
  readonly predicted: string;
  readonly correct: boolean;
}

/**
 * One learner, one exercise, one sitting.
 *
 * This is where the engines finally meet: it owns the editable files, drives
 * the language runtime, records every event onto an attempt, and — when the
 * tests go green — grades that attempt, moves the mastery vectors, schedules
 * the spaced repetition, and persists all of it.
 *
 * Deliberately free of any UI framework. The desktop and web builds render it
 * differently; neither should be able to change what an attempt *means*.
 */
export class ExerciseSession {
  readonly #deps: Required<Pick<SessionDependencies, 'clock' | 'newId'>> & SessionDependencies;
  readonly #listeners = new Set<(state: SessionState) => void>();
  readonly #editable = new Map<string, string>();
  readonly #hints: readonly Hint[];

  #attempt: Attempt;
  #snapshot: SessionState | null = null;
  /** A claim awaiting the run that will judge it. */
  #pending: { readonly prediction: Prediction; readonly at: string } | null = null;
  #activity: SessionActivity = 'idle';
  #lastRun: ExecutionResult | null = null;
  #lastTests: TestResult | null = null;
  #lastTrace: TraceResult | null = null;
  #revealed = 0;
  #completion: CompletionReport | null = null;

  private constructor(
    readonly exercise: Exercise,
    readonly mode: TrainingMode,
    dependencies: SessionDependencies,
  ) {
    this.#deps = {
      clock: () => new Date(),
      newId: () => `attempt-${Math.random().toString(36).slice(2, 10)}`,
      ...dependencies,
    };
    this.#hints = orderedHints(exercise);

    this.#loadStartingFiles();

    this.#attempt = startAttempt({
      id: this.#deps.newId(),
      exerciseId: exercise.id,
      exerciseVersion: exercise.version,
      mode,
      startedAt: this.#deps.clock().toISOString(),
    });
  }

  static begin(
    exercise: Exercise,
    mode: TrainingMode,
    dependencies: SessionDependencies,
  ): ExerciseSession {
    return new ExerciseSession(exercise, mode, dependencies);
  }

  // -- observation --------------------------------------------------------

  /**
   * The current state, as a value that only changes when something did.
   *
   * Cached deliberately. An observer that compares snapshots by identity — a
   * React `useSyncExternalStore` subscriber, say — sees a freshly built object
   * as a change, and rebuilding one per read means it sees a change on every
   * render and never stops re-rendering. The cache is cleared by `#emit`, so
   * "changed" means an actual mutation rather than an actual read.
   */
  get state(): SessionState {
    this.#snapshot ??= this.#buildState();
    return this.#snapshot;
  }

  #buildState(): SessionState {
    const affordances = affordancesFor(this.mode);
    return {
      exercise: this.exercise,
      mode: this.mode,
      files: this.#files(),
      activity: this.#activity,
      lastRun: this.#lastRun,
      lastTests: this.#lastTests,
      lastTrace: this.#lastTrace,
      tracingAvailable: this.#deps.runtime.trace !== undefined,
      revealedHints: this.#hints.slice(0, this.#revealed),
      remainingHints: affordances.hints ? this.#hints.length - this.#revealed : 0,
      solved: this.#attempt.outcome === 'solved',
      completion: this.#completion,
      pendingPrediction: this.#pending?.prediction ?? null,
      predictions: this.#attempt.events
        .filter((event) => event.type === 'prediction')
        .map((event) => ({
          about: event.about,
          predicted: event.predicted,
          correct: event.correct,
        })),
      hintsAllowed: affordances.hints,
      documentationAllowed: affordances.documentation,
    };
  }

  get attempt(): Attempt {
    return this.#attempt;
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit(): void {
    // Invalidate first: a listener reading `state` must see the new value.
    this.#snapshot = null;
    const snapshot = this.state;
    for (const listener of this.#listeners) listener(snapshot);
  }

  #files(): SessionFile[] {
    const tests = this.exercise.tests.map((test) => ({
      path: test.path,
      contents: test.contents,
      readOnly: true,
      hidden: test.visibility === 'hidden',
    }));

    const editable = [...this.#editable].map(([path, contents]) => ({
      path,
      contents,
      readOnly: false,
      hidden: false,
    }));

    // Hidden tests are materialised for the runtime but never listed for the
    // learner, and in Simulation mode no test source is shown at all (§9).
    const visibleTests = affordancesFor(this.mode).visibleTestSource
      ? tests.filter((file) => !file.hidden)
      : [];

    return [...editable, ...visibleTests];
  }

  // -- editing ------------------------------------------------------------

  updateFile(path: string, contents: string): void {
    if (!this.#editable.has(path)) {
      throw new Error(`"${path}" is not editable in this exercise.`);
    }
    if (this.#editable.get(path) === contents) return;
    this.#editable.set(path, contents);
    this.#emit();
  }

  /** Discard edits and start over from whatever this mode starts you with. */
  resetFiles(): void {
    this.#loadStartingFiles();
    this.#emit();
  }

  /**
   * What sits in the editor at the start.
   *
   * The paths always come from the exercise even when the contents do not:
   * blank page withdraws the skeleton, not the file the tests import.
   */
  #loadStartingFiles(): void {
    const withStarter = affordancesFor(this.mode).starterCode;
    for (const file of this.exercise.starter.files) {
      this.#editable.set(file.path, withStarter ? file.contents : '');
    }
  }

  #workspace() {
    const base = attemptWorkspace(this.exercise);
    return {
      ...base,
      files: base.files.map((file) =>
        this.#editable.has(file.path)
          ? { ...file, contents: this.#editable.get(file.path) ?? file.contents }
          : file,
      ),
    };
  }

  // -- actions ------------------------------------------------------------

  /**
   * Commit to what the machine will do, before finding out.
   *
   * Nothing is recorded yet: a prediction only means something once the run
   * it describes has happened, so it is held until then. Predicting again
   * before running replaces the claim rather than stacking up two.
   */
  predict(prediction: Prediction): void {
    this.#pending = { prediction, at: this.#now() };
    this.#emit();
  }

  /** Withdraw an unjudged prediction. */
  clearPrediction(): void {
    if (!this.#pending) return;
    this.#pending = null;
    this.#emit();
  }

  /**
   * Judge a held prediction against what actually happened.
   *
   * The event carries the time the claim was made, not the time it was
   * judged, so a replay puts it where it belongs: before the run.
   */
  #resolvePrediction(
    about: Prediction['about'],
    outcome: { readonly stdout: string } | { readonly green: boolean },
  ): void {
    const held = this.#pending;
    if (!held || held.prediction.about !== about) return;
    this.#pending = null;
    this.#record({
      type: 'prediction',
      at: held.at,
      about,
      predicted: held.prediction.predicted,
      correct: isPredictionCorrect(held.prediction, outcome),
    });
  }

  async run(): Promise<ExecutionResult> {
    return this.#busy('running', async () => {
      const result = await this.#deps.runtime.execute({
        workspace: this.#workspace(),
        ...(this.exercise.timeoutMs ? { limits: { timeoutMs: this.exercise.timeoutMs } } : {}),
      });

      this.#lastRun = result;
      this.#resolvePrediction('output', { stdout: result.stdout });
      this.#record({
        type: 'run',
        at: this.#now(),
        failed: result.outcome !== 'completed' || (result.exitCode ?? 0) !== 0,
      });
      return result;
    });
  }

  async runTests(): Promise<TestResult> {
    return this.#busy('testing', async () => {
      const result = await this.#deps.runtime.test({
        workspace: this.#workspace(),
        visibility: testVisibility(this.exercise),
        ...(this.exercise.timeoutMs ? { limits: { timeoutMs: this.exercise.timeoutMs } } : {}),
      });

      this.#lastTests = result;
      const green = isGreen(result);
      // Judged before the test event is recorded, so the log reads in the
      // order the learner lived it: claim, then verdict.
      this.#resolvePrediction('tests', { green });
      this.#record({
        type: 'test',
        at: this.#now(),
        passed: result.passed,
        failed: result.failed,
        errored: result.errored,
        green,
      });

      // `recordEvent` closes the attempt on a green run, which is the signal
      // to grade it. Everything that follows is bookkeeping the learner sees.
      if (green) await this.#finish();
      else await this.#persist();

      return result;
    });
  }

  /**
   * Record what the program actually did.
   *
   * Deliberately not counted as assistance. A hint tells the learner what to
   * write; a trace shows them what their own code did, which is the thing the
   * platform is trying to teach them to do for themselves. Charging for it
   * would push them back toward guessing.
   */
  async trace(target?: { test?: string }): Promise<TraceResult> {
    const runtime = this.#deps.runtime;
    if (!runtime.trace) {
      throw new Error(`${runtime.metadata().displayName} cannot record a trace.`);
    }

    return this.#busy('tracing', async () => {
      const result = await runtime.trace!({
        workspace: this.#workspace(),
        ...(target?.test ? { test: target.test } : {}),
        ...(this.exercise.timeoutMs ? { limits: { timeoutMs: this.exercise.timeoutMs * 3 } } : {}),
      });
      this.#lastTrace = result;
      this.#record({ type: 'trace', at: this.#now() });
      return result;
    });
  }

  /**
   * Reveal the next hint down the ladder.
   *
   * One at a time and in order, because the *deepest* hint reached is what the
   * grading uses: letting a learner jump straight to the explicit hint would
   * be indistinguishable from being unable to start.
   */
  async revealNextHint(): Promise<Hint | null> {
    if (!affordancesFor(this.mode).hints) {
      throw new Error(`Hints are disabled in ${this.mode} mode.`);
    }
    const hint = this.#hints[this.#revealed];
    if (!hint) return null;

    this.#revealed += 1;
    this.#record({ type: 'hint', at: this.#now(), level: hint.level });
    await this.#persist();
    return hint;
  }

  async lookUpDocumentation(query: string): Promise<void> {
    if (!affordancesFor(this.mode).documentation) {
      throw new Error(`Documentation is closed in ${this.mode} mode.`);
    }
    this.#record({ type: 'documentation', at: this.#now(), query });
    await this.#persist();
  }

  /** Give up and read the reference solution. Zeroes the attempt's evidence. */
  async revealSolution(): Promise<Record<string, string>> {
    if (!affordancesFor(this.mode).solutionReveal) {
      throw new Error(`The solution cannot be revealed in ${this.mode} mode.`);
    }
    this.#record({ type: 'solution-revealed', at: this.#now() });
    await this.#persist();
    return Object.fromEntries(
      this.exercise.solution.files.map((file) => [file.path, file.contents]),
    );
  }

  pause(): void {
    this.#record({ type: 'paused', at: this.#now() });
  }

  resume(): void {
    this.#record({ type: 'resumed', at: this.#now() });
  }

  /** Leave without solving. The attempt is still graded if tests were run. */
  async abandon(): Promise<CompletionReport | null> {
    if (this.#attempt.outcome !== 'in-progress') return this.#completion;
    this.#attempt = abandonAttempt(this.#attempt, this.#now());
    return this.#finish();
  }

  // -- internals ----------------------------------------------------------

  #now(): string {
    return this.#deps.clock().toISOString();
  }

  #record(event: Parameters<typeof recordEvent>[1]): void {
    if (this.#attempt.outcome !== 'in-progress') return;
    this.#attempt = recordEvent(this.#attempt, event);
    this.#emit();
  }

  async #busy<T>(activity: SessionActivity, body: () => Promise<T>): Promise<T> {
    if (this.#activity !== 'idle') {
      throw new Error('Another run is already in progress.');
    }
    this.#activity = activity;
    this.#emit();
    try {
      return await body();
    } finally {
      this.#activity = 'idle';
      this.#emit();
    }
  }

  async #persist(): Promise<void> {
    this.#attempt = attachFinalFiles(this.#attempt, Object.fromEntries(this.#editable));
    await this.#deps.store.saveAttempt(this.#attempt);
  }

  /**
   * Close the attempt: grade it, move mastery, reschedule reviews, save.
   *
   * Ordering matters. Retention is reinforced from the same observation that
   * moved the other dimensions, and the review interval is decided from the
   * recall evidence — so all three read one grading, not three re-derivations.
   */
  async #finish(): Promise<CompletionReport> {
    await this.#persist();

    const metrics = computeMetrics(this.#attempt);

    // Two dimensions are about history rather than this attempt, so grading
    // needs to know what came before it.
    const history = gradingContext(
      await this.#deps.store.allAttempts(),
      { exerciseId: this.exercise.id, skills: this.exercise.skills },
      (exerciseId) => this.#deps.skillsOf?.(exerciseId) ?? [],
      this.#attempt.startedAt,
    );

    const observations = gradeAttempt(
      this.#attempt,
      {
        id: this.exercise.id,
        version: this.exercise.version,
        skills: this.exercise.skills,
        difficulty: this.exercise.difficulty,
        estimatedSeconds: this.exercise.estimatedSeconds,
        kind: this.exercise.kind,
      },
      history,
    );

    const changes: MasteryChange[] = [];
    const reasons = new Set<string>();
    const reviewNotes: string[] = [];

    for (const observation of observations) {
      const current =
        (await this.#deps.store.getMastery(observation.skillId)) ??
        emptyMastery(observation.skillId);

      const update = applyObservation(current, observation);
      await this.#deps.store.saveMastery(reinforceRetention(update.mastery, observation));

      changes.push(...update.changes);
      for (const reason of update.reasons) reasons.add(reason);

      const existing = (await this.#deps.store.allReviews()).get(observation.skillId) ?? null;
      const decision = scheduleNext(existing, observation.skillId, observation);
      await this.#deps.store.saveReview(decision.state as StoredReview);
      reviewNotes.push(`${this.#skillName(observation.skillId)}: ${decision.reason}`);
    }

    this.#completion = {
      solved: metrics.solved,
      durationMs: metrics.totalMs,
      independent: metrics.independent,
      hintsUsed: metrics.hintsRevealed,
      changes,
      reasons: [...reasons],
      reviewNotes,
      demonstration: await this.#settleClaim(),
    };

    this.#emit();
    return this.#completion;
  }

  /**
   * Decide whether a demonstration earned the shortcut it was asking for.
   *
   * Credit is only ever applied upward. Someone who demonstrates a skill they
   * had already practised further must not be pushed backwards by a figure
   * meant to save them time.
   */
  async #settleClaim(): Promise<DemonstrationResult | null> {
    const demonstration = this.#deps.demonstration;
    if (!demonstration) return null;

    const result = judgeDemonstration(this.#attempt, demonstration, this.#deps.skillGraph);
    if (!result.passed) return result;

    for (const credited of creditDemonstration(demonstration, this.#deps.skillGraph, this.#now())) {
      const current = await this.#deps.store.getMastery(credited.skillId);
      if (current && headlineMastery(current.vector) >= headlineMastery(credited.vector)) continue;
      await this.#deps.store.saveMastery(
        current
          ? { ...credited, observations: Math.max(current.observations, credited.observations) }
          : credited,
      );
    }

    return result;
  }

  #skillName(skillId: string): string {
    return this.#deps.skillGraph.has(skillId) ? this.#deps.skillGraph.get(skillId).name : skillId;
  }
}
