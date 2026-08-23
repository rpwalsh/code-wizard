// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Prediction } from '@code-retrainer/core';
import type { PredictionRecord } from '@code-retrainer/session';
import { useState } from 'react';

/**
 * Commit to an answer before the machine gives one.
 *
 * This is the mental compiler. Running code to find out what it does is a
 * lookup; saying first what it will do turns the same keystroke into a test of
 * the model in the learner's head — and it is the only thing in the product
 * that can tell whether they understand what they wrote, as opposed to whether
 * it happened to work.
 *
 * Split in two because the claim and the verdict belong in different places.
 * The claim sits beside the prompt, where intention is still being formed and
 * nothing has been revealed. The verdict sits with the results, because that
 * is the screen the learner is looking at the moment it becomes knowable.
 *
 * Deliberately optional and deliberately cheap to skip. A prediction the
 * learner was pushed into is not evidence of anything.
 */
export function Predict({
  pending,
  onPredict,
  onClear,
}: {
  readonly pending: Prediction | null;
  readonly onPredict: (prediction: Prediction) => void;
  readonly onClear: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);

  if (pending) {
    return (
      <section className="predict predict--held" aria-label="Prediction">
        <p className="predict__label">You said it would</p>
        <p className="predict__claim">{describe(pending)}</p>
        {pending.about === 'output' ? (
          <pre className="predict__text">{pending.predicted}</pre>
        ) : null}
        <p className="predict__hint">Run it and find out.</p>
        <button type="button" className="button button--bare" onClick={onClear}>
          Withdraw
        </button>
      </section>
    );
  }

  return (
    <section className="predict" aria-label="Prediction">
      {open ? (
        <>
          <label className="predict__label" htmlFor="predict-output">
            What will it print?
          </label>
          <textarea
            id="predict-output"
            className="predict__input"
            rows={3}
            value={draft}
            spellCheck={false}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="predict__actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                onPredict({ about: 'output', predicted: draft });
                setDraft('');
                setOpen(false);
              }}
            >
              Commit
            </button>
            <button type="button" className="button button--bare" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="predict__label">Before you run it</p>
          <div className="predict__actions">
            <button type="button" className="button button--bare" onClick={() => setOpen(true)}>
              Predict the output
            </button>
            <button
              type="button"
              className="button button--bare"
              onClick={() => onPredict({ about: 'tests', predicted: 'pass' })}
            >
              This will pass
            </button>
            <button
              type="button"
              className="button button--bare"
              onClick={() => onPredict({ about: 'tests', predicted: 'fail' })}
            >
              This will fail
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * How the last claim turned out, shown beside the results.
 *
 * A wrong prediction is never colored as a failure. Being wrong here is the
 * measurement working, and it is the most useful thing that can happen: it
 * means the learner has just found a gap between what they believed and what
 * is true, which is the only place learning actually happens.
 */
export function PredictionVerdict({
  pending,
  history,
}: {
  readonly pending: Prediction | null;
  readonly history: readonly PredictionRecord[];
}) {
  if (pending) {
    return (
      <section className="predict predict--held" aria-label="Prediction">
        <p className="predict__label">You said it would</p>
        <p className="predict__claim">{describe(pending)}</p>
      </section>
    );
  }

  const last = history.at(-1);
  if (!last) return null;

  return (
    <section className="predict" aria-label="Prediction">
      <p className={`predict__verdict predict__verdict--${last.correct ? 'right' : 'wrong'}`}>
        {last.correct ? 'You called it.' : 'You expected something else.'}
        {!last.correct && last.about === 'output' ? (
          <>
            {' '}
            You said <code>{last.predicted}</code>.
          </>
        ) : null}
      </p>
    </section>
  );
}

function describe(prediction: Prediction): string {
  if (prediction.about === 'output') return 'print';
  return prediction.predicted === 'pass' ? 'pass the tests' : 'fail the tests';
}
