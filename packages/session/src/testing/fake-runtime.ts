import type {
  ExecutionRequest,
  LanguageRuntime,
  TestRequest,
  TestResult,
  Workspace,
} from '@forge/core';

export interface FakeRuntime extends LanguageRuntime {
  /** Flip to make the next test run pass. */
  green: boolean;
  readonly lastExecuteWorkspace: Workspace | null;
  readonly lastTestWorkspace: Workspace | null;
}

/**
 * A `LanguageRuntime` that answers instantly.
 *
 * The session's job is orchestration — recording events, grading, moving
 * mastery, scheduling reviews — and none of that depends on a real
 * interpreter. Testing it against one would make a fast, exhaustive suite into
 * a slow, flaky one, and the real runtimes are already tested against each
 * other in `tests/cross-runtime.test.ts`.
 */
export function fakeRuntime(): FakeRuntime {
  let lastExecuteWorkspace: Workspace | null = null;
  let lastTestWorkspace: Workspace | null = null;

  const runtime = {
    green: false,

    get lastExecuteWorkspace() {
      return lastExecuteWorkspace;
    },
    get lastTestWorkspace() {
      return lastTestWorkspace;
    },

    metadata: () => ({
      id: 'python',
      displayName: 'Python',
      editorLanguage: 'python',
      fileExtension: '.py',
      commentPrefix: '#',
    }),

    doctor: async () => ({ language: 'python', ready: true, checks: [] }),

    execute: async (request: ExecutionRequest) => {
      lastExecuteWorkspace = request.workspace;
      return {
        outcome: 'completed' as const,
        exitCode: 0,
        signal: null,
        stdout: 'ran\n',
        stderr: '',
        truncated: false,
        durationMs: 5,
      };
    },

    test: async (request: TestRequest): Promise<TestResult> => {
      lastTestWorkspace = request.workspace;
      const visibility = request.visibility ?? {};
      const cases = Object.entries(visibility).map(([path, kind], index) => ({
        id: `${path}::test_${index}`,
        name: `test ${index}`,
        status: (runtime.green ? 'passed' : 'failed') as 'passed' | 'failed',
        visibility: kind,
        durationMs: 1,
        ...(runtime.green ? {} : { message: 'NotImplementedError' }),
      }));

      return {
        outcome: 'completed',
        cases,
        passed: runtime.green ? cases.length : 0,
        failed: runtime.green ? 0 : cases.length,
        errored: 0,
        skipped: 0,
        durationMs: 10,
        stdout: '',
        stderr: '',
        truncated: false,
      };
    },

    trace: async () => ({
      outcome: 'completed' as const,
      steps: [{ event: 'line' as const, file: 'main.py', line: 1, function: '<module>', depth: 0 }],
      truncated: false,
      maxSteps: 100,
      exitCode: 0,
      stdout: '',
      stderr: '',
      error: null,
      durationMs: 3,
    }),

    format: async () => ({ formatted: [], available: false }),
    lint: async () => ({ diagnostics: [], available: false }),
    diagnose: async () => [],
  };

  return runtime as FakeRuntime;
}
