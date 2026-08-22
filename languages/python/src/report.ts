import type { TestCaseResult, TestStatus, TestVisibility } from '@forge/core';

/** Shape written by `forge_report.py`. Versioned so the plugin can evolve. */
export interface ForgeReportDocument {
  readonly schema: number;
  readonly exitStatus: number;
  readonly collectionErrors: readonly { path: string; message: string }[];
  readonly cases: readonly ForgeReportCase[];
}

export interface ForgeReportCase {
  readonly id: string;
  readonly file: string;
  readonly name: string;
  readonly status: TestStatus;
  readonly durationMs: number;
  readonly message?: string;
  readonly expected?: string;
  readonly received?: string;
  readonly exceptionType?: string;
  readonly concept?: string;
  readonly location?: { path: string; line: number };
}

export class ReportParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ReportParseError';
  }
}

const STATUSES: ReadonlySet<string> = new Set<TestStatus>([
  'passed',
  'failed',
  'errored',
  'skipped',
]);

export function parseReport(raw: string): ForgeReportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new ReportParseError('pytest report is not valid JSON', { cause });
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new ReportParseError('pytest report is not an object');
  }

  const document = parsed as Partial<ForgeReportDocument>;
  if (document.schema !== 1) {
    throw new ReportParseError(`unsupported pytest report schema ${String(document.schema)}`);
  }
  if (!Array.isArray(document.cases)) {
    throw new ReportParseError('pytest report has no `cases` array');
  }

  return {
    schema: 1,
    exitStatus: typeof document.exitStatus === 'number' ? document.exitStatus : -1,
    collectionErrors: Array.isArray(document.collectionErrors) ? document.collectionErrors : [],
    cases: document.cases.filter((testCase): testCase is ForgeReportCase => isReportCase(testCase)),
  };
}

function isReportCase(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.status === 'string' &&
    STATUSES.has(record.status)
  );
}

/**
 * Turn the raw report into language-neutral results, tagging each case with
 * the visibility the exercise declared for its file.
 */
export function toTestCases(
  document: ForgeReportDocument,
  visibility: Readonly<Record<string, TestVisibility>> = {},
): TestCaseResult[] {
  return document.cases.map((testCase) => {
    const file = testCase.file || (testCase.id.split('::')[0] ?? '');
    return {
      id: testCase.id,
      name: displayName(testCase),
      status: testCase.status,
      visibility: visibility[file] ?? 'visible',
      durationMs: Math.max(0, Math.round(testCase.durationMs ?? 0)),
      ...(testCase.message ? { message: testCase.message } : {}),
      ...(testCase.expected !== undefined ? { expected: testCase.expected } : {}),
      ...(testCase.received !== undefined ? { received: testCase.received } : {}),
      ...(testCase.concept ? { concept: testCase.concept } : {}),
      ...(testCase.location ? { location: testCase.location } : {}),
    } satisfies TestCaseResult;
  });
}

/**
 * `test_transfer_unknown_account` reads better as
 * `transfer unknown account` in a results panel.
 */
function displayName(testCase: ForgeReportCase): string {
  const raw = testCase.name;
  const bare = raw.includes('::') ? (raw.split('::').at(-1) ?? raw) : raw;
  const [base, parameters] = splitParameters(bare);
  const pretty = base
    .replace(/^test_/, '')
    .replace(/_/g, ' ')
    .trim();
  const label = pretty.length > 0 ? pretty : bare;
  return parameters ? `${label} [${parameters}]` : label;
}

function splitParameters(name: string): [string, string | null] {
  const open = name.indexOf('[');
  if (open < 0 || !name.endsWith(']')) return [name, null];
  return [name.slice(0, open), name.slice(open + 1, -1)];
}
