// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { JsonObject, JsonValue, TraceEvent, TraceStep } from '@code-wizard/core';
import { isJsonObject, parseJson, readNumber, readString } from '@code-wizard/core';

/** The document `retrainer/trace.py` writes. */
export interface TraceDocument {
  readonly steps: readonly TraceStep[];
  readonly truncated: boolean;
  readonly maxSteps: number;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error: { type: string; message: string; line: number } | null;
}

export class TraceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TraceParseError';
  }
}

const EVENTS: readonly TraceEvent[] = ['call', 'line', 'return', 'exception'];

/**
 * Narrow a trace document.
 *
 * Written by a process that was running learner code, so every field is
 * checked. A malformed step is dropped rather than poisoning the timeline.
 */
export function parseTrace(raw: string | JsonValue): TraceDocument {
  const parsed = typeof raw === 'string' ? parseJson(raw) : raw;
  if (!isJsonObject(parsed)) throw new TraceParseError('trace is not an object');

  if (readNumber(parsed, 'schema') !== 1) {
    throw new TraceParseError(`unsupported trace schema ${String(readNumber(parsed, 'schema'))}`);
  }

  const rawSteps = parsed.steps;
  const steps: TraceStep[] = [];
  if (Array.isArray(rawSteps)) {
    for (const candidate of rawSteps) {
      const step = toStep(candidate);
      if (step) steps.push(step);
    }
  }

  return {
    steps,
    truncated: parsed.truncated === true,
    maxSteps: readNumber(parsed, 'maxSteps') ?? steps.length,
    exitCode: readNumber(parsed, 'exitCode') ?? 0,
    stdout: readString(parsed, 'stdout') ?? '',
    stderr: readString(parsed, 'stderr') ?? '',
    error: toError(parsed.error),
  };
}

function toStep(value: JsonValue): TraceStep | null {
  if (!isJsonObject(value)) return null;

  const event = EVENTS.find((candidate) => candidate === readString(value, 'event'));
  const file = readString(value, 'file');
  const line = readNumber(value, 'line');
  const name = readString(value, 'function');
  if (!event || file === null || line === null || name === null) return null;

  const detail = readString(value, 'detail');
  const changes = toChanges(value.changes);

  return {
    event,
    file,
    line,
    function: name,
    depth: readNumber(value, 'depth') ?? 0,
    ...(changes === null ? {} : { changes }),
    ...(detail === null ? {} : { detail }),
  };
}

function toChanges(value: JsonValue | undefined): Record<string, string> | null {
  if (!isJsonObject(value)) return null;
  const changes: Record<string, string> = {};
  for (const [name, rendered] of Object.entries(value)) {
    if (typeof rendered === 'string') changes[name] = rendered;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

function toError(value: JsonValue | undefined): TraceDocument['error'] {
  if (!isJsonObject(value)) return null;
  const type = readString(value, 'type');
  const message = readString(value, 'message');
  if (type === null) return null;
  return {
    type,
    message: message ?? '',
    // The Python side sends the line as text so it survives being absent.
    line: Number.parseInt(readString(value, 'line') ?? '0', 10) || 0,
  };
}

export type { JsonObject };
