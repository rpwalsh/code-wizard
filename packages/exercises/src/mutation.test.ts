// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { WorkspaceFile } from '@code-retrainer/core';
import { describe, expect, it } from 'vitest';

import type { Mutant, MutationOperator } from './mutation.ts';
import { applyMutant, generateMutants, runMutationTesting, summarize } from './mutation.ts';

/** A trivial operator, so these tests do not depend on any language. */
const flipZeroToOne: MutationOperator = {
  name: 'zero-to-one',
  apply(source) {
    const lines = source.split('\n');
    return lines.flatMap((line, index) =>
      line.includes('0')
        ? [
            {
              line: index + 1,
              description: '`0` became `1`',
              source: lines
                .map((candidate, candidateIndex) =>
                  candidateIndex === index ? candidate.replace('0', '1') : candidate,
                )
                .join('\n'),
            },
          ]
        : [],
    );
  },
};

const files: readonly WorkspaceFile[] = [
  { path: 'main.py', contents: 'a = 0\nb = 0\nc = 2\n' },
  { path: 'other.py', contents: 'd = 0\n' },
];

describe('generating mutants', () => {
  it('produces one fault per mutant', () => {
    // Two faults can cancel out, and a surviving mutant then says nothing
    // about either of them.
    const mutants = generateMutants(files, [flipZeroToOne]);
    expect(mutants).toHaveLength(3);
    expect(mutants[0]?.source).toBe('a = 1\nb = 0\nc = 2\n');
  });

  it('orders them the same way every run', () => {
    // A gate that reports a different sample each time cannot say whether an
    // exercise got better or worse.
    const once = generateMutants(files, [flipZeroToOne]);
    const twice = generateMutants(files, [flipZeroToOne]);
    expect(once).toEqual(twice);
  });

  it('caps how many come from one file', () => {
    const mutants = generateMutants(files, [flipZeroToOne], { limitPerFile: 1 });
    expect(mutants.filter((mutant) => mutant.path === 'main.py')).toHaveLength(1);
    // The cap is per file, so a large solution cannot crowd out a small one.
    expect(mutants.filter((mutant) => mutant.path === 'other.py')).toHaveLength(1);
  });

  it('reports where the fault is, in editor terms', () => {
    const mutants = generateMutants(files, [flipZeroToOne]);
    expect(mutants[1]?.line).toBe(2);
    expect(mutants[1]?.description).toContain('became');
  });

  it('leaves every other file untouched', () => {
    const mutant = generateMutants(files, [flipZeroToOne])[0]!;
    const mutated = applyMutant(files, mutant);
    expect(mutated.find((file) => file.path === 'other.py')?.contents).toBe('d = 0\n');
  });
});

describe('running mutation testing', () => {
  it('reports a suite that catches everything as clean', async () => {
    const report = await runMutationTesting(files, {
      operators: [flipZeroToOne],
      test: async () => ({ green: false }),
    });

    expect(report.total).toBe(3);
    expect(report.killed).toBe(3);
    expect(report.survivors).toEqual([]);
    expect(report.score).toBe(1);
  });

  it('names the faults the tests never noticed', async () => {
    // Green against a broken solution means the tests never looked, and the
    // exercise will tell a learner a wrong answer is right.
    const report = await runMutationTesting(files, {
      operators: [flipZeroToOne],
      test: async (mutated) => ({
        green: mutated.some((file) => file.path === 'other.py' && file.contents.includes('1')),
      }),
    });

    expect(report.survivors).toHaveLength(1);
    expect(report.survivors[0]?.path).toBe('other.py');
    expect(report.score).toBeCloseTo(0.67, 2);
  });

  it('reports progress so a slow run is not silent', async () => {
    const seen: number[] = [];
    await runMutationTesting(files, {
      operators: [flipZeroToOne],
      test: async () => ({ green: false }),
      onProgress: (done) => seen.push(done),
    });
    expect(seen).toEqual([1, 2, 3]);
  });

  it('treats nothing to mutate as clean rather than as a failure', () => {
    // An exercise with no mutable solution has not been proven weak.
    expect(summarize(0, []).score).toBe(1);
  });
});

describe('mutation survivors are actionable', () => {
  it('carries enough to find the hole without rerunning anything', () => {
    const survivor: Mutant = generateMutants(files, [flipZeroToOne])[0]!;
    expect(survivor.operator).toBe('zero-to-one');
    expect(survivor.path).toBe('main.py');
    expect(survivor.line).toBe(1);
    expect(survivor.description).toBe('`0` became `1`');
  });
});
