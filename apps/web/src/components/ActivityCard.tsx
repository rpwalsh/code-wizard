// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Activity, ActivityGrade, ActivityResponse } from '@code-retrainer/activities';
import { grade } from '@code-retrainer/activities';
import { useEffect, useMemo, useState } from 'react';

import { BuildTree } from './BuildTree.tsx';
import { Categorize } from './Categorize.tsx';
import { useDragList } from './use-drag-list.ts';

import { Inline } from './Inline.tsx';

/**
 * One activity, answered.
 *
 * Every kind is a different input and the same shape around it: a prompt, the
 * thing you interact with, one button, and then the explanation. The
 * explanation is not optional and not collapsed — it is the only part of this
 * screen that teaches anything, and burying it behind a "show me why" link
 * would mean nobody reads it.
 *
 * Answering is deliberately a two-step action: choose, then submit. A card
 * that grades the instant you click an option punishes a misclick and makes
 * changing your mind impossible, which turns a question into a reflex test.
 */
export function ActivityCard({
  activity,
  onAnswered,
}: {
  readonly activity: Activity;
  readonly onAnswered: (result: ActivityGrade) => void;
}) {
  const [response, setResponse] = useState<ActivityResponse | null>(null);
  const [result, setResult] = useState<ActivityGrade | null>(null);

  // A new activity is a new question, even if the component is reused.
  useEffect(() => {
    setResponse(null);
    setResult(null);
  }, [activity.id]);

  const submit = (): void => {
    if (!response || result) return;
    setResult(grade(activity, response));
  };

  return (
    <section className="activity glass" aria-labelledby={`activity-${activity.id}`}>
      <header className="activity__head">
        <span className="activity__kind">{label(activity)}</span>
        <h2 className="activity__title" id={`activity-${activity.id}`}>
          {activity.title}
        </h2>
      </header>

      <p className="activity__prompt">
        <Inline text={activity.prompt} />
      </p>

      <ActivityInput
        activity={activity}
        response={response}
        locked={result !== null}
        parts={result?.parts ?? null}
        onChange={setResponse}
      />

      {result ? (
        <div
          className="activity__verdict"
          data-correct={result.correct}
          role="status"
          aria-live="polite"
        >
          <p className="activity__mark">{result.correct ? 'Correct' : 'Not this one'}</p>
          {result.correct ? null : (
            <p className="activity__answer">
              <span className="activity__answer-label">Answer</span>
              <code>{result.expected}</code>
            </p>
          )}
          <p className="activity__explanation">
            <Inline text={activity.explanation} />
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => onAnswered(result)}
          >
            Continue
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button--primary"
          disabled={response === null}
          onClick={submit}
        >
          Check
        </button>
      )}
    </section>
  );
}

function label(activity: Activity): string {
  switch (activity.kind) {
    case 'multiple-choice':
      return activity.correct.length > 1 ? 'Choose all that apply' : 'Choose one';
    case 'predict-output':
      return 'Predict the output';
    case 'order-lines':
      return 'Put it in order';
    case 'fill-blanks':
      return 'Fill the gaps';
    case 'spot-the-bug':
      return 'Find the fault';
    case 'match-pairs':
      return 'Match the pairs';
    case 'categorize':
      return 'Sort them';
    case 'build-tree':
      return 'Build the structure';
  }
}

function ActivityInput({
  activity,
  response,
  locked,
  parts,
  onChange,
}: {
  readonly activity: Activity;
  readonly response: ActivityResponse | null;
  readonly locked: boolean;
  /** Per-part correctness once graded, so sorted items can be marked in place. */
  readonly parts: readonly boolean[] | null;
  readonly onChange: (response: ActivityResponse) => void;
}) {
  switch (activity.kind) {
    case 'multiple-choice': {
      const selected = response?.kind === 'multiple-choice' ? response.selected : [];
      const many = activity.correct.length > 1;
      return (
        <>
          {activity.code ? <pre className="activity__code">{activity.code.trimEnd()}</pre> : null}
          <ul className="activity__options">
            {activity.options.map((option, index) => (
              <li key={option.text}>
                <button
                  type="button"
                  className="activity__option"
                  disabled={locked}
                  aria-pressed={selected.includes(index)}
                  onClick={() =>
                    onChange({
                      kind: 'multiple-choice',
                      selected: many ? toggle(selected, index) : [index],
                    })
                  }
                >
                  <Inline text={option.text} />
                </button>
                {/* Why a wrong answer was tempting is the teaching. It appears
                    only once the answer is in, so it cannot be used to solve
                    the question by elimination. */}
                {locked && option.why && !activity.correct.includes(index) ? (
                  <p className="activity__why">
                    <Inline text={option.why} />
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      );
    }

    case 'predict-output': {
      const text = response?.kind === 'predict-output' ? response.text : '';
      return (
        <>
          <pre className="activity__code">{activity.code.trimEnd()}</pre>
          <label className="activity__field">
            <span className="visually-hidden">What it prints</span>
            <textarea
              className="activity__textarea"
              rows={Math.max(2, activity.expected.split('\n').length)}
              value={text}
              disabled={locked}
              spellCheck={false}
              placeholder="What it prints"
              onChange={(event) => onChange({ kind: 'predict-output', text: event.target.value })}
            />
          </label>
        </>
      );
    }

    case 'spot-the-bug': {
      const chosen = response?.kind === 'spot-the-bug' ? response.line : -1;
      return (
        <ol className="activity__lines">
          {activity.code.split('\n').map((line, index) => (
            <li key={`${index}-${line}`}>
              <button
                type="button"
                className="activity__line"
                disabled={locked}
                aria-pressed={chosen === index + 1}
                data-fault={locked && activity.faultLine === index + 1}
                onClick={() => onChange({ kind: 'spot-the-bug', line: index + 1 })}
              >
                <span className="activity__line-number">{index + 1}</span>
                <code>{line || ' '}</code>
              </button>
            </li>
          ))}
        </ol>
      );
    }

    case 'order-lines':
      return (
        <OrderLines
          lines={activity.lines}
          order={response?.kind === 'order-lines' ? response.order : null}
          locked={locked}
          onChange={(order) => onChange({ kind: 'order-lines', order })}
        />
      );

    case 'fill-blanks': {
      const filled = response?.kind === 'fill-blanks' ? response.filled : [];
      return (
        <div className="activity__template">
          <pre className="activity__code">{activity.template.trimEnd()}</pre>
          <ul className="activity__blanks">
            {activity.blanks.map((blank, index) => (
              <li key={blank.index}>
                <label className="activity__field">
                  <span className="activity__blank-number">{blank.index}</span>
                  <input
                    className="activity__input"
                    value={filled[index] ?? ''}
                    disabled={locked}
                    spellCheck={false}
                    onChange={(event) =>
                      onChange({
                        kind: 'fill-blanks',
                        filled: replace(filled, index, event.target.value, activity.blanks.length),
                      })
                    }
                  />
                </label>
                {blank.hint ? (
                  <p className="activity__hint">
                    <Inline text={blank.hint} />
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'match-pairs':
      return (
        <MatchPairs
          pairs={activity.pairs}
          matched={response?.kind === 'match-pairs' ? response.matched : null}
          locked={locked}
          onChange={(matched) => onChange({ kind: 'match-pairs', matched })}
        />
      );

    case 'categorize':
      return (
        <Categorize
          activity={activity}
          placed={response?.kind === 'categorize' ? response.placed : []}
          locked={locked}
          parts={parts}
          onChange={(placed) => onChange({ kind: 'categorize', placed })}
        />
      );

    case 'build-tree':
      return (
        <BuildTree
          activity={activity}
          parents={response?.kind === 'build-tree' ? response.parents : []}
          locked={locked}
          parts={parts}
          onChange={(parents) => onChange({ kind: 'build-tree', parents })}
        />
      );
  }
}

/**
 * Reordering, by dragging or by arrows.
 *
 * The arrows came first and stay: dragging is unusable without a pointer,
 * awkward on a trackpad, and impossible from a keyboard or a screen reader, so
 * a list that can only be dragged is a list some people cannot answer at all.
 * Dragging is the addition — for someone holding a mouse, hauling a line to
 * where it belongs is faster and more direct than clicking an arrow four
 * times, and on an ordering question the physical act is closer to the idea
 * being taught.
 *
 * Both routes call the same `move`, so there is one definition of what
 * happened and no second code path to keep honest.
 */
function OrderLines({
  lines,
  order,
  locked,
  onChange,
}: {
  readonly lines: readonly string[];
  readonly order: readonly number[] | null;
  readonly locked: boolean;
  readonly onChange: (order: readonly number[]) => void;
}) {
  // Shuffled deterministically from the content, so the same activity presents
  // the same way every time and a reload is not a different puzzle.
  const initial = useMemo(
    () =>
      shuffle(
        lines.map((_, index) => index),
        lines.join(''),
      ),
    [lines],
  );
  const current = order ?? initial;

  const move = (from: number, to: number): void => {
    if (to < 0 || to >= current.length) return;
    const next = [...current];
    const [item] = next.splice(from, 1);
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  };

  const drag = useDragList(current.length, move, !locked);

  return (
    <ol className="activity__order" data-dragging={drag.dragging !== null}>
      {current.map((lineIndex, position) => (
        <li
          key={lineIndex}
          data-dragging={drag.dragging === position}
          data-over={drag.dragging !== null && drag.over === position}
        >
          <span
            className="activity__order-grip"
            aria-hidden="true"
            {...drag.handlers(position)}
          >
            ⠿
          </span>
          <code className="activity__order-line">{lines[lineIndex]}</code>
          <span className="activity__order-controls">
            <button
              type="button"
              className="button button--bare"
              disabled={locked || position === 0}
              aria-label={`Move up: ${lines[lineIndex] ?? ''}`}
              onClick={() => move(position, position - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="button button--bare"
              disabled={locked || position === current.length - 1}
              aria-label={`Move down: ${lines[lineIndex] ?? ''}`}
              onClick={() => move(position, position + 1)}
            >
              ↓
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Matching, as a row of selects.
 *
 * Not lines drawn between two columns: that needs pointer precision, cannot be
 * done by keyboard at all, and is the sort of interaction that looks good in a
 * screenshot and is annoying to use twice.
 */
function MatchPairs({
  pairs,
  matched,
  locked,
  onChange,
}: {
  readonly pairs: readonly { readonly left: string; readonly right: string }[];
  readonly matched: readonly number[] | null;
  readonly locked: boolean;
  readonly onChange: (matched: readonly number[]) => void;
}) {
  const options = useMemo(
    () =>
      shuffle(
        pairs.map((_, index) => index),
        pairs.map((pair) => pair.right).join(''),
      ),
    [pairs],
  );
  const current = matched ?? pairs.map(() => -1);

  return (
    <ul className="activity__pairs">
      {pairs.map((pair, index) => (
        <li key={pair.left}>
          <span className="activity__pair-left">{pair.left}</span>
          <label className="activity__field">
            <span className="visually-hidden">{`Match for ${pair.left}`}</span>
            <select
              className="activity__select"
              disabled={locked}
              value={current[index] ?? -1}
              onChange={(event) =>
                onChange(replace(current, index, Number(event.target.value), pairs.length, -1))
              }
            >
              <option value={-1}>Choose…</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {pairs[option]?.right}
                </option>
              ))}
            </select>
          </label>
        </li>
      ))}
    </ul>
  );
}

function toggle(selected: readonly number[], index: number): readonly number[] {
  return selected.includes(index)
    ? selected.filter((entry) => entry !== index)
    : [...selected, index].sort((a, b) => a - b);
}

function replace<T>(
  values: readonly T[],
  index: number,
  value: T,
  length: number,
  fill: T = '' as T,
): readonly T[] {
  const next = Array.from({ length }, (_, position) => values[position] ?? fill);
  next[index] = value;
  return next;
}

/**
 * A shuffle that is the same every time for the same content.
 *
 * Seeded from the activity's own text, so the arrangement is a property of the
 * question rather than of when you happened to open it. A puzzle that
 * rearranges itself on reload cannot be returned to.
 */
function shuffle(values: readonly number[], seed: string): readonly number[] {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }

  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    const swap = Math.abs(hash) % (index + 1);
    const a = next[index];
    const b = next[swap];
    if (a !== undefined && b !== undefined) {
      next[index] = b;
      next[swap] = a;
    }
  }
  return next;
}
