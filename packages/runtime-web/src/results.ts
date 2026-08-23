// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Diagnostic, DiagnosticSeverity, JsonObject, JsonValue } from '@code-retrainer/core';
import { isJsonObject, readBoolean, readNumber, readString } from '@code-retrainer/core';

import type { DiagnoseResult, ExecuteResult, TestRunResult } from './protocol.ts';

/**
 * Narrowing what comes back from the interpreter.
 *
 * The Python side returns JSON, and JSON is the boundary where types stop
 * being enforced by the compiler. Reading each field back explicitly is what
 * keeps them enforced on this side of it.
 */
export class BridgeResultError extends Error {
  constructor(message: string) {
    super(`The Python bridge returned an unusable result: ${message}`);
    this.name = 'BridgeResultError';
  }
}

function requireObject(value: JsonValue): JsonObject {
  if (!isJsonObject(value)) throw new BridgeResultError('expected an object');
  return value;
}

export function toExecuteResult(value: JsonValue): ExecuteResult {
  const source = requireObject(value);
  return {
    exitCode: readNumber(source, 'exitCode') ?? 1,
    stdout: readString(source, 'stdout') ?? '',
    stderr: readString(source, 'stderr') ?? '',
    truncated: readBoolean(source, 'truncated') ?? false,
  };
}

export function toTestRunResult(value: JsonValue): TestRunResult {
  const source = requireObject(value);
  return {
    exitStatus: readNumber(source, 'exitStatus') ?? -1,
    stdout: readString(source, 'stdout') ?? '',
    stderr: readString(source, 'stderr') ?? '',
    truncated: readBoolean(source, 'truncated') ?? false,
    // Null means pytest never reached session finish, which the caller reads
    // as a collection error. An empty string would look like an empty report.
    report: readString(source, 'report'),
  };
}

const SEVERITIES: readonly DiagnosticSeverity[] = ['error', 'warning', 'info', 'hint'];

export function toDiagnoseResult(value: JsonValue): DiagnoseResult {
  const source = requireObject(value);
  const entries = source.diagnostics;
  if (!Array.isArray(entries)) return { diagnostics: [] };

  const diagnostics: Diagnostic[] = [];
  for (const entry of entries) {
    if (!isJsonObject(entry)) continue;
    const message = readString(entry, 'message');
    if (message === null) continue;

    const severity =
      SEVERITIES.find((candidate) => candidate === readString(entry, 'severity')) ?? 'error';
    const code = readString(entry, 'code');
    const diagnosticSource = readString(entry, 'source');

    diagnostics.push({
      severity,
      message,
      ...(code === null ? {} : { code }),
      ...(diagnosticSource === null ? {} : { source: diagnosticSource }),
      ...toLocation(entry),
    });
  }

  return { diagnostics };
}

function toLocation(entry: JsonObject): Pick<Diagnostic, 'location'> | Record<string, never> {
  const location = entry.location;
  if (!isJsonObject(location)) return {};

  const path = readString(location, 'path');
  const line = readNumber(location, 'line');
  if (path === null || line === null) return {};

  const column = readNumber(location, 'column');
  const endLine = readNumber(location, 'endLine');
  const endColumn = readNumber(location, 'endColumn');

  return {
    location: {
      path,
      line,
      ...(column === null ? {} : { column }),
      ...(endLine === null ? {} : { endLine }),
      ...(endColumn === null ? {} : { endColumn }),
    },
  };
}
