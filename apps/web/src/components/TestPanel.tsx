import type { TestCaseResult, TestResult } from '@forge/core';

interface TestPanelProps {
  readonly result: TestResult | null;
  readonly busy: boolean;
}

const STATUS_LABEL: Record<TestCaseResult['status'], string> = {
  passed: 'passed',
  failed: 'failed',
  errored: 'errored',
  skipped: 'skipped',
};

/**
 * Test results as a teaching surface rather than a log (spec §12).
 *
 * Status is never carried by colour alone — every case has a text label and a
 * shape — because a red/green test panel is exactly the kind of thing that
 * becomes unusable for a colour-blind learner (§28).
 */
export function TestPanel({ result, busy }: TestPanelProps) {
  if (busy) {
    return (
      <div className="panel" aria-busy="true">
        <p className="muted">Running tests…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel">
        <p className="muted">Run the tests to see how you are doing.</p>
      </div>
    );
  }

  if (result.outcome !== 'completed') {
    return (
      <div className="panel">
        <p className="run-problem" role="alert">
          {describeOutcome(result.outcome)}
        </p>
        {result.stderr ? <pre className="output">{result.stderr}</pre> : null}
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Announced on change so a screen-reader user hears the verdict without
          having to go looking for it. */}
      <p className="test-summary" role="status" aria-live="polite">
        {summarise(result)}
      </p>

      <ul className="test-list">
        {result.cases.map((testCase) => (
          <TestCase key={testCase.id} testCase={testCase} />
        ))}
      </ul>
    </div>
  );
}

function TestCase({ testCase }: { readonly testCase: TestCaseResult }) {
  const failed = testCase.status === 'failed' || testCase.status === 'errored';

  return (
    <li className={`test-case test-case--${testCase.status}`}>
      <p className="test-case__head">
        <span className="test-case__mark" aria-hidden="true">
          {failed ? '✗' : testCase.status === 'passed' ? '✓' : '–'}
        </span>
        <span className="visually-hidden">{STATUS_LABEL[testCase.status]}: </span>
        <span className="test-case__name">{testCase.name}</span>
        {testCase.visibility === 'visible' ? null : (
          <span className="badge">{testCase.visibility}</span>
        )}
      </p>

      {failed ? (
        <div className="test-case__detail">
          {testCase.expected !== undefined || testCase.received !== undefined ? (
            <dl className="expectation">
              {testCase.expected !== undefined ? (
                <>
                  <dt>Expected</dt>
                  <dd>
                    <pre>{testCase.expected}</pre>
                  </dd>
                </>
              ) : null}
              {testCase.received !== undefined ? (
                <>
                  <dt>Received</dt>
                  <dd>
                    <pre>{testCase.received}</pre>
                  </dd>
                </>
              ) : null}
            </dl>
          ) : testCase.message ? (
            <pre className="output">{testCase.message}</pre>
          ) : null}

          {testCase.concept ? (
            <p className="muted concept">
              Relevant concept: <code>{testCase.concept}</code>
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function summarise(result: TestResult): string {
  const parts = [`${result.passed} passed`];
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  if (result.errored > 0) parts.push(`${result.errored} errored`);
  if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
  return `${parts.join(', ')} in ${(result.durationMs / 1000).toFixed(2)}s`;
}

export function describeOutcome(outcome: TestResult['outcome']): string {
  switch (outcome) {
    case 'timeout':
      return 'The run exceeded its time limit and was stopped. Is there a loop that never ends?';
    case 'collection-error':
      return 'The tests could not start — your code probably fails to import. Check for a syntax error.';
    case 'runtime-unavailable':
      return 'Python is not available.';
    case 'internal-error':
      return 'Forge could not read the test results.';
    case 'completed':
      return 'Completed.';
  }
}
