// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ExecutionLimits } from './execution.ts';
import type { Workspace } from './workspace.ts';

/**
 * Test visibility drives both what the learner sees and how the result is
 * interpreted by the mastery model (spec §12).
 */
export type TestVisibility =
  /** Shown in full, including source. Used for learning. */
  | 'visible'
  /** Shown by name and outcome only. Prevents hardcoding. */
  | 'hidden'
  /** Visible, but tagged as probing a known failure mode. */
  | 'edge'
  /** Asserts complexity/latency rather than correctness. */
  | 'performance'
  /** Re-runs an earlier stage's contract in a progressive exercise. */
  | 'regression';

export type TestStatus = 'passed' | 'failed' | 'errored' | 'skipped';

export interface TestCaseResult {
  /** Stable identifier, e.g. `tests/test_lookup.py::test_missing_account`. */
  readonly id: string;
  /** Human-readable name shown in the test panel. */
  readonly name: string;
  readonly status: TestStatus;
  readonly visibility: TestVisibility;
  readonly durationMs: number;
  /** Assertion/exception message. Suppressed for hidden tests. */
  readonly message?: string;
  /** Failing expectation, when the harness could extract one. */
  readonly expected?: string;
  readonly received?: string;
  readonly location?: { path: string; line: number };
  /** Skill this test exercises, used to explain failures pedagogically. */
  readonly concept?: string;
}

export interface TestRequest {
  readonly workspace: Workspace;
  /** Restrict the run to these test files (relative paths). */
  readonly only?: readonly string[];
  /**
   * Visibility per test file, supplied by the exercise engine. The runtime
   * needs it to redact hidden results before they leave the boundary; without
   * an entry a file is treated as `visible`.
   */
  readonly visibility?: Readonly<Record<string, TestVisibility>>;
  readonly limits?: Partial<ExecutionLimits>;
}

export type TestRunOutcome =
  /** The harness ran and produced results, whether or not tests passed. */
  | 'completed'
  /** Learner code failed to import/compile; no tests could run. */
  | 'collection-error'
  | 'timeout'
  /**
   * The tests began and the program died before they finished.
   *
   * Distinct from every other kind of failure here, because the cause is the
   * learner's code and the evidence is a process status rather than a report.
   * Folding it into internal-error made the product apologize for a crash it
   * did not cause, which reads as the app being broken.
   */
  | 'crashed'
  | 'runtime-unavailable'
  | 'internal-error';

export interface TestResult {
  readonly outcome: TestRunOutcome;
  readonly cases: readonly TestCaseResult[];
  readonly passed: number;
  readonly failed: number;
  readonly errored: number;
  readonly skipped: number;
  readonly durationMs: number;
  /** Raw harness output, for the terminal panel. */
  readonly stdout: string;
  readonly stderr: string;
  readonly truncated: boolean;
}

export function summarize(cases: readonly TestCaseResult[]): {
  passed: number;
  failed: number;
  errored: number;
  skipped: number;
} {
  const summary = { passed: 0, failed: 0, errored: 0, skipped: 0 };
  for (const testCase of cases) {
    summary[testCase.status] += 1;
  }
  return summary;
}

/** True when every non-skipped case passed and at least one case ran. */
export function isGreen(result: TestResult): boolean {
  return (
    result.outcome === 'completed' &&
    result.failed === 0 &&
    result.errored === 0 &&
    result.passed > 0
  );
}

/**
 * Hidden tests must never leak their implementation details (spec §12).
 * Applied at the runtime boundary so no UI code can forget to.
 */
export function redactHiddenTests(cases: readonly TestCaseResult[]): TestCaseResult[] {
  return cases.map((testCase) => {
    if (testCase.visibility !== 'hidden') return { ...testCase };
    const { message: _m, expected: _e, received: _r, location: _l, ...rest } = testCase;
    return {
      ...rest,
      ...(testCase.status === 'passed'
        ? {}
        : { message: 'Hidden test failed. The details are intentionally not shown.' }),
    };
  });
}
