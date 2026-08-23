// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TestCaseResult, TestResult } from '@code-retrainer/core';
import { useEffect, useState } from 'react';

import { Spinner } from './layout/Spinner.tsx';

interface ResultsProps {
  readonly result: TestResult | null;
  readonly busy: boolean;
  /** Absent when the runtime cannot trace, in which case nothing is offered. */
  readonly onWatch?: (testId: string) => void;
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
/**
 * What to say while a run is in flight.
 *
 * A test run is usually a second or two. The exception is the first Python run
 * of a session, which starts a CPython interpreter compiled to WebAssembly and
 * can take the better part of a minute on a cold cache — long enough that a
 * motionless word "Running" reads as a hang, and long enough that someone
 * closes the tab believing it is broken.
 *
 * So the message escalates. Saying *why* it is slow, and that it happens once,
 * is the difference between waiting and giving up.
 */
function useWaitingMessage(busy: boolean): string {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!busy) {
      setSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  if (seconds < 4) return 'Running your tests…';
  if (seconds < 12) return 'Still going — starting the interpreter takes a moment.';
  return 'First run of the session: the interpreter is unpacking itself, once. It is quick after this.';
}

export function Results({ result, busy, onWatch }: ResultsProps) {
  const waiting = useWaitingMessage(busy);
  const [open, setOpen] = useState<string | null>(null);

  if (busy) {
    return (
      <section aria-busy="true">
        <p className="label">Running</p>
        <Spinner size="small" label={waiting} />
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
          {summarize(result)}
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

              {failed && expanded ? (
                <Diagnosis
                  testCase={testCase}
                  {...(onWatch ? { onWatch: () => onWatch(testCase.id) } : {})}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Diagnosis({
  testCase,
  onWatch,
}: {
  readonly testCase: TestCaseResult;
  readonly onWatch?: () => void;
}) {
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

      {/*
        The product's answer to "why did this fail?" is an instrument, not a
        longer sentence — and it traces *this* test, which is the one the
        learner is looking at.
      */}
      {onWatch && testCase.visibility !== 'hidden' ? (
        <button type="button" className="button" onClick={onWatch}>
          Watch it run
        </button>
      ) : null}
    </div>
  );
}

function summarize(result: TestResult): string {
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
      return 'Code Retrainer could not read the test results.';
    case 'completed':
      return 'Completed.';
  }
}
