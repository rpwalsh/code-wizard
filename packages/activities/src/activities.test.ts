// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { describe, expect, it } from 'vitest';

import { checkActivity } from './checks.ts';
import { ACTIVITY_CEILING, evidenceFrom, unreachableByActivities } from './evidence.ts';
import { grade } from './grading.ts';
import type { Activity, MultipleChoiceActivity, PredictOutputActivity } from './model.ts';
import { dimensionsByKind } from './model.ts';
import { parseActivity } from './schema.ts';
import { answer, currentActivity, isFinished, startRun, summarize, verdict } from './run.ts';
import {
  carryForward,
  dayOf,
  minimumMet,
  newPracticeLog,
  practiceLine,
  recordRun,
} from './streak.ts';

const base = {
  language: 'rust',
  difficulty: 2,
  estimatedSeconds: 30,
  skills: ['rust.ownership.move'],
  prompt: 'What happens?',
  explanation: 'Moving a value out of a binding leaves the original unusable.',
};

const choice: MultipleChoiceActivity = {
  ...base,
  id: 'rust.ownership.move.mc-1',
  kind: 'multiple-choice',
  title: 'Moved value',
  options: [{ text: 'It compiles' }, { text: 'Use of moved value' }, { text: 'It panics' }],
  correct: [1],
};

const predict: PredictOutputActivity = {
  ...base,
  id: 'rust.ownership.move.po-1',
  kind: 'predict-output',
  title: 'What it prints',
  code: 'println!("{}", 2 + 2);',
  expected: '4',
};

describe('grading', () => {
  it('accepts the right answer and rejects the rest', () => {
    expect(grade(choice, { kind: 'multiple-choice', selected: [1] }).correct).toBe(true);
    expect(grade(choice, { kind: 'multiple-choice', selected: [0] }).correct).toBe(false);
  });

  it('requires the whole set when more than one option is correct', () => {
    const many: MultipleChoiceActivity = { ...choice, correct: [0, 1] };
    // Half right is not partly right: picking the one you are sure of would
    // otherwise be a reliable strategy for "select all that apply".
    expect(grade(many, { kind: 'multiple-choice', selected: [1] }).correct).toBe(false);
    expect(grade(many, { kind: 'multiple-choice', selected: [0, 1] }).correct).toBe(true);
  });

  it('forgives trailing whitespace in predicted output but nothing else', () => {
    expect(grade(predict, { kind: 'predict-output', text: '4  \n' }).correct).toBe(true);
    expect(grade(predict, { kind: 'predict-output', text: ' 4' }).correct).toBe(false);
  });

  it('accepts a declared alternative ordering', () => {
    const set: PredictOutputActivity = { ...predict, expected: '{1, 2}', alsoAccept: ['{2, 1}'] };
    expect(grade(set, { kind: 'predict-output', text: '{2, 1}' }).correct).toBe(true);
  });

  it('accepts either order for lines the author marked interchangeable', () => {
    const activity: Activity = {
      ...base,
      id: 'rust.mod.order-1',
      kind: 'order-lines',
      title: 'Two imports',
      lines: ['use std::fs;', 'use std::io;', 'fn main() {}'],
      interchangeable: [[0, 1]],
    };
    // Two independent imports in either order are the same program, and
    // marking one wrong would teach something false about the language.
    expect(grade(activity, { kind: 'order-lines', order: [1, 0, 2] }).correct).toBe(true);
    expect(grade(activity, { kind: 'order-lines', order: [2, 1, 0] }).correct).toBe(false);
  });

  it('refuses to grade a response of the wrong kind', () => {
    expect(() => grade(choice, { kind: 'predict-output', text: '4' })).toThrow(/cannot grade/);
  });
});

describe('checks', () => {
  it('catches an answer key that names an option which does not exist', () => {
    expect(checkActivity({ ...choice, correct: [7] })).toContainEqual(
      expect.stringContaining('correct names option 7'),
    );
  });

  it('catches a matching activity with an ambiguous answer', () => {
    const activity: Activity = {
      ...base,
      id: 'rust.types.match-1',
      kind: 'match-pairs',
      title: 'Types',
      pairs: [
        { left: 'i32', right: 'integer' },
        { left: 'u8', right: 'integer' },
        { left: 'f64', right: 'float' },
      ],
    };
    expect(checkActivity(activity)).toContainEqual(expect.stringContaining('share a right-hand'));
  });

  it('passes a well-formed activity', () => {
    expect(checkActivity(choice)).toEqual([]);
    expect(checkActivity(predict)).toEqual([]);
  });
});

describe('evidence', () => {
  /**
   * The load-bearing test in this package.
   *
   * The entire product claim is that it measures whether you can *produce*
   * working code. If answering multiple-choice questions could ever move
   * `application` or `independence`, a language with a hundred questions and
   * no runtime would report fluency nobody had demonstrated — and the headline
   * number would become the flattering progress bar this exists to replace.
   */
  it('cannot reach the dimensions that mean fluency', () => {
    for (const kind of Object.keys(dimensionsByKind) as (keyof typeof dimensionsByKind)[]) {
      for (const forbidden of unreachableByActivities) {
        expect(dimensionsByKind[kind], kind).not.toContain(forbidden);
      }
    }
  });

  it('caps what a correct answer is worth', () => {
    const [evidence] = evidenceFrom(
      choice,
      grade(choice, { kind: 'multiple-choice', selected: [1] }),
      '2026-01-01T00:00:00.000Z',
    );
    expect(evidence?.vector.recognition).toBeLessThanOrEqual(ACTIVITY_CEILING);
    expect(evidence?.vector.recognition).toBeGreaterThan(0);
    expect(evidence?.vector.independence).toBe(0);
  });

  it('records a wrong answer rather than discarding it', () => {
    const [evidence] = evidenceFrom(
      choice,
      grade(choice, { kind: 'multiple-choice', selected: [0] }),
      '2026-01-01T00:00:00.000Z',
    );
    expect(evidence?.correct).toBe(false);
    expect(evidence?.vector.recognition).toBe(0);
  });
});

describe('a run', () => {
  const run = {
    id: 'run-1',
    language: 'rust',
    focus: 'Ownership',
    activities: [choice, predict, { ...choice, id: 'rust.ownership.move.mc-2' }],
  };

  it('puts a missed activity back into the queue instead of ending', () => {
    let state = startRun(run, '2026-01-01T00:00:00.000Z');
    const first = currentActivity(state);
    state = answer(state, false);

    // Not gone, and the run is not over: it comes round again.
    expect(isFinished(state)).toBe(false);
    expect(state.run.activities.map((a) => a.id)).toContain(first?.id);
    expect(state.queue).toContain(0);
  });

  it('ends only when everything has been answered correctly', () => {
    let state = startRun(run, '2026-01-01T00:00:00.000Z');
    for (let guard = 0; guard < 20 && !isFinished(state); guard += 1) state = answer(state, true);
    expect(isFinished(state)).toBe(true);
    expect(summarize(state, '2026-01-01T00:03:00.000Z').clean).toBe(true);
  });

  it('does not count a second attempt as first time', () => {
    let state = startRun(run, '2026-01-01T00:00:00.000Z');
    state = answer(state, false);
    for (let guard = 0; guard < 20 && !isFinished(state); guard += 1) state = answer(state, true);

    const summary = summarize(state, '2026-01-01T00:04:00.000Z');
    expect(summary.clean).toBe(false);
    expect(summary.firstTime).toBe(2);
    expect(summary.missed).toEqual(['rust.ownership.move.mc-1']);
  });

  it('never congratulates a run that went badly', () => {
    const bad = verdict({
      focus: 'Ownership',
      total: 8,
      firstTime: 1,
      answered: 20,
      seconds: 300,
      clean: false,
      missed: [],
    });
    expect(bad).toMatch(/back to the lesson/);
  });
});

describe('the practice log', () => {
  it('counts a day once, however many runs it took', () => {
    const monday = new Date(2026, 0, 5, 9);
    let log = recordRun(newPracticeLog(), monday);
    log = recordRun(log, new Date(2026, 0, 5, 20));
    expect(log.daysPracticed).toBe(1);
    expect(log.today).toBe(2);
  });

  it('counts consecutive days as a run', () => {
    let log = recordRun(newPracticeLog(), new Date(2026, 0, 5, 9));
    log = recordRun(log, new Date(2026, 0, 6, 9));
    log = recordRun(log, new Date(2026, 0, 7, 9));
    expect(log.currentRun).toBe(3);
    expect(log.daysPracticed).toBe(3);
  });

  /**
   * The point of the redesign.
   *
   * A missed day interrupts momentum, which is real, so the consecutive run
   * resets. It does not un-practice anything that was practiced, so the total
   * and the best run do not move. Nobody out of work and job-hunting should
   * open this and be told they lost something.
   */
  it('never takes away days that were actually practiced', () => {
    let log = recordRun(newPracticeLog(), new Date(2026, 0, 5, 9));
    log = recordRun(log, new Date(2026, 0, 6, 9));
    expect(log.currentRun).toBe(2);

    const afterAGap = carryForward(log, dayOf(new Date(2026, 0, 20)));
    expect(afterAGap.currentRun).toBe(0);
    expect(afterAGap.daysPracticed).toBe(2);
    expect(afterAGap.longestRun).toBe(2);
  });

  it('says nothing about what was lost', () => {
    let log = recordRun(newPracticeLog(), new Date(2026, 0, 5, 9));
    log = carryForward(log, dayOf(new Date(2026, 0, 20)));
    expect(minimumMet(log)).toBe(false);
    expect(practiceLine(log)).toBe('1 day practiced.');
    expect(practiceLine(log)).not.toMatch(/lost|broke|streak/i);
  });
});

describe('sorting into buckets', () => {
  const activity: Activity = {
    kind: 'categorize',
    id: 'backend.idempotency.cat-1',
    language: 'backend',
    title: 'Safe to retry?',
    difficulty: 3,
    estimatedSeconds: 90,
    skills: ['backend.idempotency'],
    prompt: 'Which of these can be sent twice without changing the outcome?',
    explanation: 'Idempotency is about the effect of the second call, not the first.',
    buckets: [
      { id: 'safe', name: 'Safe to retry' },
      { id: 'unsafe', name: 'Not safe to retry' },
    ],
    items: [
      { text: 'DELETE /orders/17', bucket: 'safe' },
      { text: 'POST /orders', bucket: 'unsafe' },
      { text: 'PUT /orders/17 with a full body', bucket: 'safe' },
      { text: 'POST /orders/17/charge', bucket: 'unsafe' },
    ],
  };

  it('accepts every item in its bucket', () => {
    const result = grade(activity, {
      kind: 'categorize',
      placed: ['safe', 'unsafe', 'safe', 'unsafe'],
    });
    expect(result.correct).toBe(true);
    expect(result.parts).toEqual([true, true, true, true]);
  });

  it('marks each item separately rather than the set as a whole', () => {
    // The point of per-item parts: someone who sorts three of four correctly
    // should see which one moved, not a single red mark over all of it.
    const result = grade(activity, {
      kind: 'categorize',
      placed: ['safe', 'unsafe', 'unsafe', 'unsafe'],
    });
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([true, true, false, true]);
  });

  it('counts an unplaced item as wrong rather than throwing', () => {
    const result = grade(activity, { kind: 'categorize', placed: ['safe', 'unsafe'] });
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([true, true, false, false]);
    expect(result.submitted).toContain('nowhere');
  });
});

describe('assembling a tree', () => {
  const activity: Activity = {
    kind: 'build-tree',
    id: 'architecture.layers.tree-1',
    language: 'architecture',
    title: 'Where does each piece sit?',
    difficulty: 3,
    estimatedSeconds: 120,
    skills: ['architecture.layering'],
    prompt: 'Place each piece under the layer that should own it.',
    explanation: 'Dependencies point inward: transport knows about domain, never the reverse.',
    root: 'Application',
    nodes: [
      { id: 'transport', label: 'Transport', parent: null },
      { id: 'domain', label: 'Domain', parent: null },
      { id: 'handler', label: 'HTTP handler', parent: 'transport' },
      { id: 'rules', label: 'Pricing rules', parent: 'domain' },
    ],
  };

  it('accepts the right parent for every node', () => {
    const result = grade(activity, {
      kind: 'build-tree',
      parents: [null, null, 'transport', 'domain'],
    });
    expect(result.correct).toBe(true);
  });

  it('rejects a node placed under the wrong parent', () => {
    // The mistake worth catching: business rules hanging off transport is not
    // a small slip, it is the misunderstanding the activity exists to find.
    const result = grade(activity, {
      kind: 'build-tree',
      parents: [null, null, 'transport', 'transport'],
    });
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([true, true, true, false]);
  });

  it('counts a node that was never placed as wrong, even at the root', () => {
    // The trap this distinction exists for: `transport` belongs at the root,
    // so collapsing "never placed" into "placed at the root" would score an
    // untouched node correct and hand out mastery nobody demonstrated.
    const result = grade(activity, {
      kind: 'build-tree',
      parents: [undefined, null, 'transport', 'domain'],
    });
    expect(result.parts[0]).toBe(false);
    expect(result.correct).toBe(false);
    expect(result.submitted).toContain('nowhere');
  });

  it('ignores sibling order, which is not a fact about the structure', () => {
    // Same parents, and the response says nothing about ordering — there is
    // nowhere for sibling order to be expressed, which is the design.
    const result = grade(activity, {
      kind: 'build-tree',
      parents: [null, null, 'transport', 'domain'],
    });
    expect(result.correct).toBe(true);
  });
});

describe('refusing content that cannot be answered', () => {
  const base = {
    id: 'x.y.z',
    language: 'backend',
    title: 'T',
    difficulty: 2,
    estimatedSeconds: 60,
    skills: ['backend.idempotency'],
    prompt: 'P',
    explanation: 'E',
  };

  it('rejects an item pointing at a bucket that does not exist', () => {
    expect(() =>
      parseActivity({
        ...base,
        kind: 'categorize',
        buckets: [
          { id: 'safe', name: 'Safe' },
          { id: 'unsafe', name: 'Unsafe' },
        ],
        items: [
          { text: 'a', bucket: 'safe' },
          { text: 'b', bucket: 'unsafe' },
          { text: 'c', bucket: 'maybe' },
          { text: 'd', bucket: 'safe' },
        ],
      }),
    ).toThrow(/Unknown bucket 'maybe'/);
  });

  it('rejects a bucket with nothing in it', () => {
    expect(() =>
      parseActivity({
        ...base,
        kind: 'categorize',
        buckets: [
          { id: 'safe', name: 'Safe' },
          { id: 'unsafe', name: 'Unsafe' },
        ],
        items: [
          { text: 'a', bucket: 'safe' },
          { text: 'b', bucket: 'safe' },
          { text: 'c', bucket: 'safe' },
          { text: 'd', bucket: 'safe' },
        ],
      }),
    ).toThrow(/has no items/);
  });

  it('rejects a cycle, which is not a tree', () => {
    expect(() =>
      parseActivity({
        ...base,
        kind: 'build-tree',
        root: 'App',
        nodes: [
          { id: 'a', label: 'A', parent: 'b' },
          { id: 'b', label: 'B', parent: 'a' },
          { id: 'c', label: 'C', parent: null },
        ],
      }),
    ).toThrow(/its own ancestor/);
  });

  it('rejects a parent that is not a node', () => {
    expect(() =>
      parseActivity({
        ...base,
        kind: 'build-tree',
        root: 'App',
        nodes: [
          { id: 'a', label: 'A', parent: null },
          { id: 'b', label: 'B', parent: 'ghost' },
          { id: 'c', label: 'C', parent: null },
        ],
      }),
    ).toThrow(/Unknown parent 'ghost'/);
  });
});
