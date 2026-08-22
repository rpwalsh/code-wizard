import type { RuntimeDiagnosis, TestCaseResult, TestResult } from '@forge/core';

import { columns, formatDuration, indent, style, symbol } from './terminal.ts';

const STATUS_SYMBOL: Record<TestCaseResult['status'], string> = {
  passed: symbol.pass,
  failed: symbol.fail,
  errored: symbol.fail,
  skipped: symbol.skip,
};

/**
 * Test output is a teaching surface, not a log (spec §12): show what was
 * expected, what arrived, and which skill the test was probing.
 */
export function formatTestResult(result: TestResult): string {
  const lines: string[] = [];

  for (const testCase of result.cases) {
    const badge = STATUS_SYMBOL[testCase.status];
    const name =
      testCase.status === 'passed' ? style.grey(testCase.name) : style.bold(testCase.name);
    const tag = testCase.visibility === 'visible' ? '' : style.grey(` [${testCase.visibility}]`);
    lines.push(`${badge} ${name}${tag}`);

    if (testCase.status === 'passed' || testCase.status === 'skipped') continue;

    const detail: [string, string][] = [];
    if (testCase.expected !== undefined) detail.push(['Expected:', testCase.expected]);
    if (testCase.received !== undefined) detail.push(['Received:', testCase.received]);
    if (detail.length > 0) {
      lines.push(indent(columns(detail), 4));
    } else if (testCase.message) {
      lines.push(indent(style.grey(testCase.message), 4));
    }
    if (testCase.message && detail.length > 0 && testCase.message !== testCase.received) {
      lines.push(indent(style.grey(testCase.message), 4));
    }
    if (testCase.concept) {
      lines.push(indent(style.grey(`Relevant concept: ${testCase.concept}`), 4));
    }
    lines.push('');
  }

  lines.push(summaryLine(result));
  return lines.join('\n');
}

function summaryLine(result: TestResult): string {
  if (result.outcome !== 'completed') {
    return style.red(`Run did not complete: ${describeOutcome(result.outcome)}`);
  }
  const parts = [style.green(`${result.passed} passed`)];
  if (result.failed > 0) parts.push(style.red(`${result.failed} failed`));
  if (result.errored > 0) parts.push(style.red(`${result.errored} errored`));
  if (result.skipped > 0) parts.push(style.grey(`${result.skipped} skipped`));
  parts.push(style.grey(formatDuration(result.durationMs)));
  return parts.join(style.grey(', '));
}

export function describeOutcome(outcome: TestResult['outcome']): string {
  switch (outcome) {
    case 'timeout':
      return 'the run exceeded its time limit and was terminated';
    case 'collection-error':
      return 'the tests could not be collected — your code probably fails to import';
    case 'runtime-unavailable':
      return 'the language runtime is not available';
    case 'internal-error':
      return 'Forge could not read the test report';
    case 'completed':
      return 'completed';
  }
}

export function formatDiagnosis(diagnosis: RuntimeDiagnosis): string {
  const rows = diagnosis.checks.map((check): [string, string] => {
    const badge =
      check.status === 'pass' ? symbol.pass : check.status === 'warn' ? symbol.warn : symbol.fail;
    const detail = check.detail ? style.grey(check.detail) : '';
    return [`${badge} ${check.label}`, detail];
  });

  const lines = [columns(rows)];

  const remedies = diagnosis.checks.filter((check) => check.status !== 'pass' && check.remedy);
  if (remedies.length > 0) {
    lines.push('');
    for (const check of remedies) {
      lines.push(`${symbol.bullet} ${check.label}: ${check.remedy ?? ''}`);
    }
  }

  lines.push('');
  lines.push(
    diagnosis.ready
      ? style.green('Environment ready.')
      : style.red('Environment not ready — fix the failures above.'),
  );
  return lines.join('\n');
}
