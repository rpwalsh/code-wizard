// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { RuntimeDiagnosis, TestCaseResult, TestResult } from '@code-retrainer/core';

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
      testCase.status === 'passed' ? style.gray(testCase.name) : style.bold(testCase.name);
    const tag = testCase.visibility === 'visible' ? '' : style.gray(` [${testCase.visibility}]`);
    lines.push(`${badge} ${name}${tag}`);

    if (testCase.status === 'passed' || testCase.status === 'skipped') continue;

    const detail: [string, string][] = [];
    if (testCase.expected !== undefined) detail.push(['Expected:', testCase.expected]);
    if (testCase.received !== undefined) detail.push(['Received:', testCase.received]);
    if (detail.length > 0) {
      lines.push(indent(columns(detail), 4));
    } else if (testCase.message) {
      lines.push(indent(style.gray(testCase.message), 4));
    }
    if (testCase.message && detail.length > 0 && testCase.message !== testCase.received) {
      lines.push(indent(style.gray(testCase.message), 4));
    }
    if (testCase.concept) {
      lines.push(indent(style.gray(`Relevant concept: ${testCase.concept}`), 4));
    }
    lines.push('');
  }

  lines.push(summaryLine(result));
  return lines.join('\n');
}

/**
 * What the toolchain said, when the run never got as far as a test.
 *
 * A compiler error is the whole answer and the summary line was hiding it:
 * "the tests could not be collected" is true and useless, while one line
 * lower down says `no member named 'back_inserter'`. Authoring an exercise
 * meant writing a throwaway script to see it, which is a bad trade for a
 * message the runtime already had.
 *
 * Trimmed to a handful of lines: the first error is the one that caused the
 * rest, and a screen of template instantiation notes teaches nobody.
 */
function toolchainOutput(result: TestResult): readonly string[] {
  const text = [result.stderr, result.stdout].filter((part) => part.trim() !== '').join('\n');
  if (text.trim() === '') return [];

  const lines = text.split(/\r?\n/u).filter((line) => line.trim() !== '');
  const shown = lines.slice(0, 12);
  if (lines.length > shown.length) {
    shown.push(style.gray(`… ${lines.length - shown.length} more line(s)`));
  }

  return ['', ...shown.map((line) => indent(line))];
}

function summaryLine(result: TestResult): string {
  if (result.outcome !== 'completed') {
    return [
      style.red(`Run did not complete: ${describeOutcome(result.outcome)}`),
      ...toolchainOutput(result),
    ].join('\n');
  }
  const parts = [style.green(`${result.passed} passed`)];
  if (result.failed > 0) parts.push(style.red(`${result.failed} failed`));
  if (result.errored > 0) parts.push(style.red(`${result.errored} errored`));
  if (result.skipped > 0) parts.push(style.gray(`${result.skipped} skipped`));
  parts.push(style.gray(formatDuration(result.durationMs)));
  return parts.join(style.gray(', '));
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
      return 'Code Retrainer could not read the test report';
    case 'completed':
      return 'completed';
  }
}

export function formatDiagnosis(diagnosis: RuntimeDiagnosis): string {
  const rows = diagnosis.checks.map((check): [string, string] => {
    const badge =
      check.status === 'pass' ? symbol.pass : check.status === 'warn' ? symbol.warn : symbol.fail;
    const detail = check.detail ? style.gray(check.detail) : '';
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
