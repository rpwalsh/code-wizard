// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { WorkspaceFile } from '@code-wizard/core';

/**
 * Deliberately breaking the reference solution to find out whether the tests
 * would notice.
 *
 * An exercise whose tests pass a wrong solution is worse than an exercise with
 * no tests, because it tells the learner they got it right. Every mastery
 * number downstream inherits that lie, and nobody ever finds out.
 *
 * So the content gate does not only check that the solution passes and the
 * starter fails. It introduces small, plausible faults into the solution — the
 * off-by-one, the flipped comparison, the swapped operator — and requires the
 * tests to catch each one. A fault the tests do not catch is a gap a learner
 * can sit in.
 *
 * The operators themselves are language-specific and live with the language.
 * Nothing here knows what it is mutating.
 */
export interface Mutant {
  /** Which operator produced it, for the report. */
  readonly operator: string;
  /** What was done, in a sentence someone can act on. */
  readonly description: string;
  readonly path: string;
  /** 1-indexed, so it matches what an editor shows. */
  readonly line: number;
  readonly source: string;
}

export interface MutationOperator {
  readonly name: string;
  /**
   * Every single-point mutation this operator can make.
   *
   * One fault per mutant. Two faults can cancel out, and a surviving mutant
   * then says nothing about either of them.
   */
  apply(source: string): readonly { line: number; description: string; source: string }[];
}

export interface MutationOptions {
  /** Cap per file, so a large solution cannot dominate a run. */
  readonly limitPerFile?: number;
}

/**
 * Every mutant of a solution, across every operator.
 *
 * Deterministic in order: a content gate that reports a different sample each
 * run cannot be used to decide whether an exercise got better or worse.
 */
export function generateMutants(
  files: readonly WorkspaceFile[],
  operators: readonly MutationOperator[],
  options: MutationOptions = {},
): readonly Mutant[] {
  const limit = options.limitPerFile ?? 40;
  const mutants: Mutant[] = [];

  for (const file of files) {
    const forFile: Mutant[] = [];

    for (const operator of operators) {
      for (const change of operator.apply(file.contents)) {
        forFile.push({
          operator: operator.name,
          description: change.description,
          path: file.path,
          line: change.line,
          source: change.source,
        });
      }
    }

    forFile.sort((a, b) => a.line - b.line || a.operator.localeCompare(b.operator));
    mutants.push(...forFile.slice(0, limit));
  }

  return mutants;
}

export interface MutationReport {
  readonly total: number;
  readonly killed: number;
  /** Mutants the tests did not notice. Each one is a gap a learner can sit in. */
  readonly survivors: readonly Mutant[];
  /** Killed over total, or 1 when there was nothing to mutate. */
  readonly score: number;
}

export function summarize(total: number, survivors: readonly Mutant[]): MutationReport {
  const killed = total - survivors.length;
  return {
    total,
    killed,
    survivors,
    score: total === 0 ? 1 : Math.round((killed / total) * 100) / 100,
  };
}

/** Replace one file's contents, leaving the rest of the workspace alone. */
export function applyMutant(
  files: readonly WorkspaceFile[],
  mutant: Mutant,
): readonly WorkspaceFile[] {
  return files.map((file) =>
    file.path === mutant.path ? { ...file, contents: mutant.source } : file,
  );
}

export interface MutationRunOptions {
  readonly operators: readonly MutationOperator[];
  readonly limitPerFile?: number;
  /**
   * Run the exercise's tests against a mutated solution.
   *
   * Injected rather than taken as a runtime, so this module stays ignorant of
   * how anything is executed and the same logic covers a subprocess, a worker
   * and a fake.
   */
  test(files: readonly WorkspaceFile[]): Promise<{ readonly green: boolean }>;
  /** Called before each mutant, for progress on a slow run. */
  readonly onProgress?: (done: number, total: number) => void;
}

/**
 * Introduce each fault in turn and see whether the tests notice.
 *
 * A surviving mutant is not a failing test — it is a hole. The exercise will
 * happily tell a learner that a wrong solution is right, and every mastery
 * number derived from that attempt inherits the lie.
 */
export async function runMutationTesting(
  solution: readonly WorkspaceFile[],
  options: MutationRunOptions,
): Promise<MutationReport> {
  const mutants = generateMutants(solution, options.operators, {
    ...(options.limitPerFile === undefined ? {} : { limitPerFile: options.limitPerFile }),
  });

  const survivors: Mutant[] = [];
  let done = 0;

  for (const mutant of mutants) {
    const outcome = await options.test(applyMutant(solution, mutant));
    // Green against a broken solution means the tests never looked.
    if (outcome.green) survivors.push(mutant);
    options.onProgress?.((done += 1), mutants.length);
  }

  return summarize(mutants.length, survivors);
}
