import type { ExecutionLimits } from './execution.ts';
import type { Workspace } from './workspace.ts';

/**
 * Execution tracing — the instrument behind "increase observability before
 * increasing explanation".
 *
 * A failing test tells a learner *that* they were wrong. A trace lets them
 * watch the program do it, which is the difference between being corrected and
 * understanding. The platform's job at the moment of confusion is to hand over
 * a better instrument, never a better answer.
 */
export type TraceEvent = 'call' | 'line' | 'return' | 'exception';

export interface TraceStep {
  readonly event: TraceEvent;
  readonly file: string;
  /** 1-indexed, matching the editor. */
  readonly line: number;
  readonly function: string;
  /** Call-stack depth, so nesting is visible without inferring it. */
  readonly depth: number;
  /**
   * Names whose displayed value changed at this step.
   *
   * Deltas rather than full snapshots: a full dump per step is mostly
   * repetition, and what moved is precisely the interesting part. Replaying
   * the deltas forward reconstructs the state at any step.
   */
  readonly changes?: Readonly<Record<string, string>>;
  /** Return value, or the exception, depending on the event. */
  readonly detail?: string;
}

export interface TraceRequest {
  readonly workspace: Workspace;
  /**
   * A specific test to trace, by the id the test result carried.
   *
   * Usually the more useful target of the two. An exercise's entry file
   * mostly *defines* things, so tracing it shows nothing happening; what a
   * learner wants to watch is the failing test calling their code. Running the
   * real test rather than the function directly keeps fixtures and setup
   * behaving exactly as they did when it failed.
   */
  readonly test?: string;
  readonly entryPoint?: string;
  readonly stdin?: string;
  /** Ceiling on recorded steps. Reaching it sets `truncated`. */
  readonly maxSteps?: number;
  readonly limits?: Partial<ExecutionLimits>;
}

export type TraceOutcome = 'completed' | 'timeout' | 'runtime-unavailable' | 'internal-error';

export interface TraceResult {
  readonly outcome: TraceOutcome;
  readonly steps: readonly TraceStep[];
  /** True when the step budget ran out before the program did. */
  readonly truncated: boolean;
  readonly maxSteps: number;
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  /** The exception that ended the program, if one did. */
  readonly error: { readonly type: string; readonly message: string; readonly line: number } | null;
  readonly durationMs: number;
}

/**
 * The full set of visible names at a given step, by replaying the deltas.
 *
 * Kept here rather than in a component because it is the definition of what a
 * trace *means*, and both the desktop and web builds have to agree on it.
 */
export function stateAt(steps: readonly TraceStep[], index: number): Map<string, string> {
  const state = new Map<string, string>();
  for (let cursor = 0; cursor <= index && cursor < steps.length; cursor += 1) {
    const step = steps[cursor];
    if (!step?.changes) continue;
    for (const [name, value] of Object.entries(step.changes)) state.set(name, value);
  }
  return state;
}

/** Steps that touched a given line, for gutter annotations. */
export function stepsOnLine(steps: readonly TraceStep[], file: string, line: number): number[] {
  const found: number[] = [];
  for (const [index, step] of steps.entries()) {
    if (step.file === file && step.line === line && step.event === 'line') found.push(index);
  }
  return found;
}

/**
 * How many times each line ran.
 *
 * A loop body that executed three times when the learner expected four is the
 * single most common iteration misconception, and this makes it visible
 * without stepping at all.
 */
export function lineCounts(steps: readonly TraceStep[], file: string): Map<number, number> {
  const counts = new Map<number, number>();
  for (const step of steps) {
    if (step.file !== file || step.event !== 'line') continue;
    counts.set(step.line, (counts.get(step.line) ?? 0) + 1);
  }
  return counts;
}

export const emptyTrace: TraceResult = Object.freeze({
  outcome: 'completed',
  steps: Object.freeze([]),
  truncated: false,
  maxSteps: 0,
  exitCode: null,
  stdout: '',
  stderr: '',
  error: null,
  durationMs: 0,
});
