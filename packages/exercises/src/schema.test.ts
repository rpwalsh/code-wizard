// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { JsonValue } from '@code-retrainer/core';
import { describe, expect, it } from 'vitest';

import { exerciseManifestSchema } from './schema.ts';

/** The smallest manifest the schema accepts, so each test varies one thing. */
function manifest(overrides: Record<string, JsonValue> = {}) {
  return {
    id: 'python.syntax.demo',
    version: 1,
    language: 'python',
    title: 'Demo',
    kind: 'micro-problem',
    difficulty: 2,
    estimatedSeconds: 120,
    skills: ['python.syntax.variables'],
    learningObjectives: ['Do the thing'],
    prompt: 'Do the thing.',
    tests: [{ path: 'tests/test_demo.py', visibility: 'visible' }],
    ...overrides,
  };
}

describe('mutation exceptions', () => {
  it('are absent by default, because most exercises need none', () => {
    const parsed = exerciseManifestSchema.parse(manifest());
    expect(parsed.mutationExceptions).toBeUndefined();
  });

  it('accept a documented exception', () => {
    const parsed = exerciseManifestSchema.parse(
      manifest({
        mutationExceptions: [
          {
            path: 'main.py',
            operator: 'arithmetic',
            why: 'The mutant is equivalent for every valid input, not uncaught.',
          },
        ],
      }),
    );
    expect(parsed.mutationExceptions).toHaveLength(1);
  });

  it('refuse an exception with no reason', () => {
    // A suppression nobody had to justify is a suppression nobody will
    // revisit, and the whole gate quietly rots behind it.
    expect(() =>
      exerciseManifestSchema.parse(
        manifest({ mutationExceptions: [{ path: 'main.py', operator: 'arithmetic' }] }),
      ),
    ).toThrow();
  });

  it('refuse a reason too short to be one', () => {
    expect(() =>
      exerciseManifestSchema.parse(
        manifest({
          mutationExceptions: [{ path: 'main.py', operator: 'arithmetic', why: 'equivalent' }],
        }),
      ),
    ).toThrow();
  });

  it('refuse an escape from the workspace', () => {
    expect(() =>
      exerciseManifestSchema.parse(
        manifest({
          mutationExceptions: [
            {
              path: '../../etc/passwd',
              operator: 'arithmetic',
              why: 'This should never be accepted by the manifest schema at all.',
            },
          ],
        }),
      ),
    ).toThrow();
  });
});
