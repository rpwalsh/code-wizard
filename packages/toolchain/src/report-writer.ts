// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TestStatus } from '@code-retrainer/core';

/**
 * Build the shared report from cases parsed on this side of the boundary.
 *
 * Most languages get a harness written in the language itself, which writes
 * the report directly. A few — Go and Rust in particular — already have a good
 * test runner that emits its own machine-readable stream, and reimplementing
 * `go test` in Go so that it writes our JSON instead of theirs would be a
 * worse tool and more code. For those, the runtime converts.
 *
 * Kept here rather than in each of them so the schema number lives in one
 * place and a change to the wire format cannot reach only half the languages.
 */
export function reportWriter(
  cases: readonly {
    readonly id: string;
    readonly file: string;
    readonly name: string;
    readonly status: TestStatus;
    readonly durationMs: number;
    readonly message?: string;
  }[],
  collectionErrors: readonly { readonly path: string; readonly message: string }[] = [],
): string {
  return JSON.stringify({
    schema: 1,
    exitStatus: cases.some((entry) => entry.status !== 'passed' && entry.status !== 'skipped')
      ? 1
      : 0,
    collectionErrors,
    cases,
  });
}
