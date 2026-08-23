// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type {
  JsonObject,
  JsonValue,
  TestCaseResult,
  TestStatus,
  TestVisibility,
} from '@code-retrainer/core';
import { isJsonObject, parseJson, readNumber, readObject, readString } from '@code-retrainer/core';

/** Shape written by `retrainer/report.py`. Versioned so the plugin can evolve. */
export interface PytestReportDocument {
  readonly schema: number;
  readonly exitStatus: number;
  readonly collectionErrors: readonly CollectionError[];
  readonly cases: readonly PytestReportCase[];
}

export interface CollectionError {
  readonly path: string;
  readonly message: string;
}

export interface PytestReportCase {
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
  constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = 'ReportParseError';
  }
}

const STATUSES: readonly TestStatus[] = ['passed', 'failed', 'errored', 'skipped'];

function toStatus(value: string | null): TestStatus | null {
  return STATUSES.find((candidate) => candidate === value) ?? null;
}

/**
 * Read the plugin's JSON into real types.
 *
 * This is a trust boundary — the document was written by a process running
 * learner code — so every field is narrowed rather than asserted. A malformed
 * case is dropped; a malformed document is refused.
 */
export function parseReport(raw: string | JsonValue): PytestReportDocument {
  const parsed = typeof raw === 'string' ? parseJsonOrThrow(raw) : raw;

  if (!isJsonObject(parsed)) {
    throw new ReportParseError('pytest report is not an object');
  }

  const schema = readNumber(parsed, 'schema');
  if (schema !== 1) {
    throw new ReportParseError(`unsupported pytest report schema ${String(schema)}`);
  }

  const rawCases = parsed.cases;
  if (!Array.isArray(rawCases)) {
    throw new ReportParseError('pytest report has no `cases` array');
  }

  const cases: PytestReportCase[] = [];
  for (const candidate of rawCases) {
    const testCase = toReportCase(candidate);
    if (testCase) cases.push(testCase);
  }

  return {
    schema: 1,
    exitStatus: readNumber(parsed, 'exitStatus') ?? -1,
    collectionErrors: toCollectionErrors(parsed.collectionErrors),
    cases,
  };
}

function parseJsonOrThrow(raw: string): JsonValue {
  try {
    return parseJson(raw);
  } catch (caught) {
    throw new ReportParseError('pytest report is not valid JSON', {
      cause: caught instanceof Error ? caught : new Error(String(caught)),
    });
  }
}

function toCollectionErrors(value: JsonValue | undefined): CollectionError[] {
  if (!Array.isArray(value)) return [];
  const errors: CollectionError[] = [];
  for (const entry of value) {
    if (!isJsonObject(entry)) continue;
    errors.push({
      path: readString(entry, 'path') ?? '',
      message: readString(entry, 'message') ?? '',
    });
  }
  return errors;
}

function toReportCase(value: JsonValue): PytestReportCase | null {
  if (!isJsonObject(value)) return null;

  const id = readString(value, 'id');
  const name = readString(value, 'name');
  const status = toStatus(readString(value, 'status'));
  if (id === null || name === null || status === null) return null;

  return {
    id,
    name,
    status,
    file: readString(value, 'file') ?? id.split('::')[0] ?? '',
    durationMs: readNumber(value, 'durationMs') ?? 0,
    ...optionalString(value, 'message'),
    ...optionalString(value, 'expected'),
    ...optionalString(value, 'received'),
    ...optionalString(value, 'exceptionType'),
    ...optionalString(value, 'concept'),
    ...toLocation(value),
  };
}

function optionalString<K extends string>(source: JsonObject, key: K): Partial<Record<K, string>> {
  const value = readString(source, key);
  if (value === null) return {};
  const field: Partial<Record<K, string>> = {};
  field[key] = value;
  return field;
}

function toLocation(source: JsonObject): { location?: { path: string; line: number } } {
  const location = readObject(source, 'location');
  if (!location) return {};
  const path = readString(location, 'path');
  const line = readNumber(location, 'line');
  if (path === null || line === null) return {};
  return { location: { path, line } };
}

/**
 * Turn the raw report into language-neutral results, tagging each case with
 * the visibility the exercise declared for its file.
 */
export function toTestCases(
  document: PytestReportDocument,
  visibility: Readonly<Record<string, TestVisibility>> = {},
): TestCaseResult[] {
  return document.cases.map((testCase) => {
    const file = testCase.file || (testCase.id.split('::')[0] ?? '');
    return {
      id: testCase.id,
      name: displayName(testCase),
      status: testCase.status,
      visibility: visibility[file] ?? 'visible',
      durationMs: Math.max(0, Math.round(testCase.durationMs)),
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
function displayName(testCase: PytestReportCase): string {
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
