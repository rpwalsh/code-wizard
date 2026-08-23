// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { generateMutants } from '@code-retrainer/exercises';
import { describe, expect, it } from 'vitest';

import { pythonMutationOperators } from './mutations.ts';

function mutate(contents: string) {
  return generateMutants([{ path: 'main.py', contents }], pythonMutationOperators, {
    limitPerFile: 200,
  });
}

function sources(contents: string): string[] {
  return mutate(contents).map((mutant) => mutant.source);
}

describe('python mutation operators', () => {
  it('flips a comparison', () => {
    expect(sources('if a == b:')).toContain('if a != b:');
  });

  it('does not mistake part of one operator for another', () => {
    // `<` inside `<=` is not a `<` to flip; treating it as one produces a
    // mutant that is always killed and proves nothing.
    const mutants = sources('if a <= b:');
    expect(mutants).toContain('if a < b:');
    expect(mutants).not.toContain('if a >= b:');
  });

  it('swaps boolean operators only as whole words', () => {
    // `or` inside `for` is not an operator.
    expect(sources('for item in items:')).toEqual([]);
    expect(sources('if a and b:')).toContain('if a or b:');
  });

  it('produces the off-by-one', () => {
    // The mistake that survives more test suites than any other.
    expect(sources('return values[1:]')).toContain('return values[2:]');
  });

  it('drops a negation', () => {
    expect(sources('if not found:')).toContain('if found:');
  });

  it('empties a return, to prove the tests inspect the result', () => {
    // A test that only checks the call did not raise will survive this.
    expect(sources('    return total')).toContain('    return None');
  });

  it('leaves an already-empty return alone', () => {
    expect(sources('    return None')).toEqual([]);
  });

  it('never mutates inside a string literal', () => {
    // A mutated docstring is a mutant nothing can kill and a survivor that
    // means nothing.
    expect(mutate('message = "a == b and 0"')).toEqual([]);
    expect(mutate("message = 'not found'")).toEqual([]);
  });

  it('never mutates inside a comment', () => {
    // The comment holds a number, a comparison and a boolean operator, and
    // none of them are code. Only the 5 is.
    const mutants = mutate('total = 5  # add 1 if a == b');
    expect(mutants).toHaveLength(1);
    expect(mutants[0]?.operator).toBe('off-by-one');
    expect(mutants[0]?.source).toBe('total = 6  # add 1 if a == b');
  });

  it('mutates code on a line that also has a comment', () => {
    const mutated = sources('if a == b:  # compare');
    expect(mutated).toContain('if a != b:  # compare');
  });

  it('handles an escaped quote without running off the line', () => {
    // A backslash inside a string must not end the protected range early and
    // expose the rest of the line to mutation.
    expect(mutate('message = "he said \\" and 0"')).toEqual([]);
  });

  it('sees a triple-quoted docstring as one string, not three quotes', () => {
    // The bug this replaced: a line-by-line scan read a triple quote as an
    // empty string followed by another quote, which left the docstring body
    // exposed. Every mutant it produced in there was unkillable, and the
    // report claimed the exercise had holes it did not have.
    const source = [
      'def describe(name, age):',
      "    '''Return \"<name> is <age>\" or 0.'''",
      '    return 1',
      '',
    ].join('\n');

    const mutants = mutate(source);
    expect(mutants.every((mutant) => mutant.line === 3)).toBe(true);
    expect(mutants.map((mutant) => mutant.operator).sort()).toEqual(['empty-return', 'off-by-one']);
  });

  it('sees a docstring that spans lines', () => {
    const source = ['def f():', "    '''", '    a == b and 0', "    '''", '    return x', ''].join(
      '\n',
    );

    expect(mutate(source).every((mutant) => mutant.line === 5)).toBe(true);
  });

  it('reports every mutant against the right line', () => {
    const mutants = mutate('a = 1\nif x == y:\n    return 0\n');
    expect(mutants.every((mutant) => mutant.line >= 1 && mutant.line <= 3)).toBe(true);
    expect(mutants.some((mutant) => mutant.line === 2 && mutant.operator === 'comparison')).toBe(
      true,
    );
  });
});
