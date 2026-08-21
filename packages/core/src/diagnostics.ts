import type { ExecutionLimits } from './execution.ts';
import type { Workspace } from './workspace.ts';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface SourceLocation {
  readonly path: string;
  /** 1-indexed. */
  readonly line: number;
  /** 1-indexed. */
  readonly column?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly location?: SourceLocation;
  /** Runtime-specific rule identifier, e.g. `F841` or `SyntaxError`. */
  readonly code?: string;
  /** Which tool produced this, e.g. `ruff`, `pyflakes`, `compile`. */
  readonly source?: string;
}

export interface LintRequest {
  readonly workspace: Workspace;
  readonly limits?: Partial<ExecutionLimits>;
}

export interface LintResult {
  readonly diagnostics: readonly Diagnostic[];
  /** False when no linter is installed; callers must not treat this as "clean". */
  readonly available: boolean;
}
