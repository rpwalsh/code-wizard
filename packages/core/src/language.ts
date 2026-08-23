// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Diagnostic, LintRequest, LintResult } from './diagnostics.ts';
import type {
  ExecutionRequest,
  ExecutionResult,
  FormatRequest,
  FormatResult,
} from './execution.ts';
import type { TestRequest, TestResult } from './testing.ts';
import type { TraceRequest, TraceResult } from './tracing.ts';

/** Stable identifier for a language, e.g. `python`, `javascript`, `go`. */
export type LanguageId = string;

export interface LanguageMetadata {
  readonly id: LanguageId;
  readonly displayName: string;
  /** Monaco language id, so the editor stays language-agnostic. */
  readonly editorLanguage: string;
  readonly fileExtension: string;
  readonly commentPrefix: string;
  /** Documentation set shipped alongside this runtime (spec §11). */
  readonly documentationRoot?: string;
  /** Whether this runtime can record an execution trace. */
  readonly tracing?: boolean;
}

export type CapabilityLevel = 'unavailable' | 'degraded' | 'ready';

export interface RuntimeCheck {
  readonly id: string;
  readonly label: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly detail?: string;
  /** What the user should do about a warn/fail. */
  readonly remedy?: string;
}

/** Result of `code-retrainer runtime doctor` for one language (spec §41). */
export interface RuntimeDiagnosis {
  readonly language: LanguageId;
  readonly ready: boolean;
  readonly checks: readonly RuntimeCheck[];
}

/**
 * The single boundary between the learning platform and any particular
 * language (spec §48). Nothing above this interface may branch on language id.
 */
export interface LanguageRuntime {
  metadata(): LanguageMetadata;

  /** Verify the toolchain and report actionable problems. Never throws. */
  doctor(): Promise<RuntimeDiagnosis>;

  execute(request: ExecutionRequest): Promise<ExecutionResult>;

  test(request: TestRequest): Promise<TestResult>;

  format(request: FormatRequest): Promise<FormatResult>;

  lint(request: LintRequest): Promise<LintResult>;

  /**
   * Static/parse-time diagnostics for the editor gutter. Cheaper than `lint`
   * and expected to run on save.
   */
  diagnose(request: LintRequest): Promise<readonly Diagnostic[]>;

  /**
   * Record what the program actually did, step by step.
   *
   * Optional, because it genuinely cannot be universal: a language that
   * compiles to a stripped binary has nothing to hook. A runtime that offers
   * it advertises `tracing: true` in its metadata, and the interface hides the
   * instrument rather than showing one that does nothing.
   */
  trace?(request: TraceRequest): Promise<TraceResult>;
}

export class LanguageRegistry {
  readonly #runtimes = new Map<LanguageId, LanguageRuntime>();

  register(runtime: LanguageRuntime): this {
    const { id } = runtime.metadata();
    if (this.#runtimes.has(id)) {
      throw new Error(`A runtime is already registered for language "${id}".`);
    }
    this.#runtimes.set(id, runtime);
    return this;
  }

  get(id: LanguageId): LanguageRuntime {
    const runtime = this.#runtimes.get(id);
    if (!runtime) {
      const known = [...this.#runtimes.keys()].join(', ') || 'none';
      throw new Error(`No runtime registered for language "${id}". Registered: ${known}.`);
    }
    return runtime;
  }

  has(id: LanguageId): boolean {
    return this.#runtimes.has(id);
  }

  languages(): LanguageMetadata[] {
    return [...this.#runtimes.values()].map((runtime) => runtime.metadata());
  }
}
