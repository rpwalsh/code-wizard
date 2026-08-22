import type { Workspace } from './workspace.ts';

/**
 * Limits applied to every learner-code execution. Executing learner code is a
 * security boundary (spec §14); these limits are mandatory, not advisory.
 */
export interface ExecutionLimits {
  /** Wall-clock limit before the process tree is terminated. */
  readonly timeoutMs: number;
  /** Combined stdout+stderr cap. Output past the cap is dropped, not buffered. */
  readonly maxOutputBytes: number;
}

export const defaultExecutionLimits: ExecutionLimits = Object.freeze({
  timeoutMs: 10_000,
  maxOutputBytes: 256 * 1024,
});

export interface ExecutionRequest {
  readonly workspace: Workspace;
  /** Relative path of the file to execute. Defaults to the workspace entry point. */
  readonly entryPoint?: string;
  /** Arguments passed to the learner program, not to the interpreter. */
  readonly args?: readonly string[];
  readonly stdin?: string;
  readonly limits?: Partial<ExecutionLimits>;
}

export type ExecutionOutcome = 'completed' | 'timeout' | 'runtime-unavailable' | 'internal-error';

export interface ExecutionResult {
  readonly outcome: ExecutionOutcome;
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly stdout: string;
  readonly stderr: string;
  /** True when output hit `maxOutputBytes` and was truncated. */
  readonly truncated: boolean;
  readonly durationMs: number;
}

export interface FormatRequest {
  readonly workspace: Workspace;
  readonly limits?: Partial<ExecutionLimits>;
}

export interface FormatResult {
  /** Files whose contents changed. Unchanged files are omitted. */
  readonly formatted: readonly { path: string; contents: string }[];
  /** Present when the formatter itself failed (e.g. the code does not parse). */
  readonly error?: string;
  readonly available: boolean;
}
