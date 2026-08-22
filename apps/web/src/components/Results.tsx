import type { TestCaseResult, TestResult } from '@forge/core';
import { useState } from 'react';

interface ResultsProps {
  readonly result: TestResult | null;
  readonly busy: boolean;
}

const MARK: Record<TestCaseResult['status'], string> = {
  passed: '✓',
  failed: '✕',
  errored: '✕',
  skipped: '–',
};

const STATUS_WORD: Record<TestCaseResult['status'], string> = {
  passed: 'passed',
  failed: 'failed',
  errored: 'errored',
  skipped: 'skipped',
};

/**
 * A diagnostic surface, not a dump of pytest output.
 *
 * The list stays scannable — one line per test — and a failure opens into what
 * was expected, what arrived, and which skill the test was probing. That last
 * line is the useful one: it turns a red test into somewhere to go.
 */
export function Results({ result, busy }: ResultsProps) {
  const [open, setOpen] = useState<string | null>(null);

  if (busy) {
    return (
      <section aria-busy="true">
        <p className="label">Running</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section>
        <p className="label">Tests</p>
        <p className="empty" style={{ marginTop: 8 }}>
          Run the tests to see where you stand.
        </p>
      </section>
    );
  }

  if (result.outcome !== 'completed') {
    return (
      <section>
        <p className="label">Tests</p>
        <p className="notice notice--error" role="alert" style={{ marginTop: 8 }}>
          {describeOutcome(result.outcome)}
        </p>
        {result.stderr ? <pre className="terminal">{result.stderr}</pre> : null}
      </section>
    );
  }

  const total = result.cases.length;

  return (
    <section>
      <div className="results__summary">
        <span className="results__count">{total}</span>
        <span className="label">{total === 1 ? 'test' : 'tests'}</span>
        <span className="dim" role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>
          {summarise(result)}
        </span>
      </div>

      <ul className="results__list">
        {result.cases.map((testCase) => {
          const failed = testCase.status === 'failed' || testCase.status === 'errored';
          const expanded = open === testCase.id;

          return (
            <li key={testCase.id}>
              <button
                type="button"
                className={`result result--${testCase.status}`}
                aria-expanded={failed ? expanded : undefined}
                disabled={!failed}
                onClick={() => setOpen(expanded ? null : testCase.id)}
              >
                <span className="result__mark" aria-hidden="true">
                  {MARK[testCase.status]}
                </span>
                <span className="visually-hidden">{STATUS_WORD[testCase.status]}: </span>
                <span className="result__name">{testCase.name}</span>
                {testCase.visibility === 'visible' ? null : (
                  <span className="chip">{testCase.visibility}</span>
                )}
              </button>

              {failed && expanded ? <Diagnosis testCase={testCase} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Diagnosis({ testCase }: { readonly testCase: TestCaseResult }) {
  const hasExpectation = testCase.expected !== undefined || testCase.received !== undefined;

  return (
    <div className="diagnosis">
      {testCase.expected !== undefined ? (
        <div className="diagnosis__pair">
          <span className="diagnosis__key">Expected</span>
          <pre>{testCase.expected}</pre>
        </div>
      ) : null}

      {testCase.received !== undefined ? (
        <div className="diagnosis__pair">
          <span className="diagnosis__key">Received</span>
          <pre>{testCase.received}</pre>
        </div>
      ) : null}

      {!hasExpectation && testCase.message ? (
        <div className="diagnosis__pair">
          <span className="diagnosis__key">Failure</span>
          <pre>{testCase.message}</pre>
        </div>
      ) : null}

      {testCase.concept ? (
        <p className="diagnosis__skill">
          Likely skill: <code>{testCase.concept}</code>
        </p>
      ) : null}
    </div>
  );
}

function summarise(result: TestResult): string {
  const parts: string[] = [];
  if (result.passed > 0) parts.push(`${result.passed} passed`);
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  if (result.errored > 0) parts.push(`${result.errored} errored`);
  if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
  return `${parts.join(' · ')} · ${(result.durationMs / 1000).toFixed(2)}s`;
}

export function describeOutcome(outcome: TestResult['outcome']): string {
  switch (outcome) {
    case 'timeout':
      return 'Stopped at the time limit. Is there a loop that never ends?';
    case 'collection-error':
      return 'The tests could not start — your code does not import. Check for a syntax error.';
    case 'runtime-unavailable':
      return 'Python is not available.';
    case 'internal-error':
      return 'Forge could not read the test results.';
    case 'completed':
      return 'Completed.';
  }
}
