// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ExecutionLimits } from '@code-retrainer/core';
import { defaultExecutionLimits } from '@code-retrainer/core';

/** Hard ceilings the application will not exceed regardless of what an exercise asks for. */
export const maximumLimits: ExecutionLimits = Object.freeze({
  timeoutMs: 120_000,
  maxOutputBytes: 4 * 1024 * 1024,
});

export function resolveLimits(
  requested: Partial<ExecutionLimits> | undefined,
  defaults: ExecutionLimits = defaultExecutionLimits,
): ExecutionLimits {
  const timeoutMs = requested?.timeoutMs ?? defaults.timeoutMs;
  const maxOutputBytes = requested?.maxOutputBytes ?? defaults.maxOutputBytes;
  return {
    timeoutMs: Math.min(Math.max(1, Math.floor(timeoutMs)), maximumLimits.timeoutMs),
    maxOutputBytes: Math.min(
      Math.max(1024, Math.floor(maxOutputBytes)),
      maximumLimits.maxOutputBytes,
    ),
  };
}
