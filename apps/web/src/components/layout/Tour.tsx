// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The first-run tour.
 *
 * Four cards, plain words, and a Skip on every one of them. It exists because
 * the first screen of this app is a dashboard, and a dashboard assumes you
 * already know what it is for — which is a fine assumption for the second
 * visit and a bad one for the first.
 *
 * Written to be read by someone who has never used a code editor. No jargon
 * survives here that is not explained in the same sentence: "test" gets a
 * definition, "skill map" gets a picture in words, and nothing says
 * "withdrawal ladder".
 *
 * Dismissed once, gone forever — the answer is stored with everything else,
 * so it also comes back when progress is imported onto a new machine.
 */
import { useEffect, useState } from 'react';

interface Step {
  readonly title: string;
  readonly body: string;
  readonly hint?: string;
}

const STEPS: readonly Step[] = [
  {
    title: 'This is a gym for writing code',
    body: 'You read a little, then you write a little, and the machine tells you whether it worked. That loop is the whole product. It takes about ten minutes a day.',
    hint: 'Nothing here is graded by a person, and nothing is shared with anyone.',
  },
  {
    title: 'Two ways to practice',
    body: 'Practice is reading: you look at a few lines of code and answer a question about them. No typing, a few minutes. Today is writing: you get a real editor and a task, and you make the tests pass.',
    hint: 'Start with Practice if you are new. It needs nothing installed.',
  },
  {
    title: 'Tests are how you know',
    body: 'A test is a small program that checks your program. Red means something does not match yet, and it shows you what it expected next to what it got. Red is normal — every working program spent most of its life red.',
    hint: 'Stuck? Press "Walk me through it" and it goes one step at a time.',
  },
  {
    title: 'Pick your language up top',
    body: 'The dropdown in the bar changes everything below it — your plan, your map, your practice. Fourteen languages are here. Switch whenever you like; nothing is lost.',
    hint: 'Your progress is saved on this device. Closing the browser is safe.',
  },
];

export function Tour({ onClose }: { readonly onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  // Escape dismisses, like every other overlay here.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!current) return null;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="tour__card">
        <p className="tour__count">
          {step + 1} of {STEPS.length}
        </p>

        <h2 className="tour__title">{current.title}</h2>
        <p className="tour__body">{current.body}</p>
        {current.hint ? <p className="tour__hint">{current.hint}</p> : null}

        <div className="tour__actions">
          {/* Skip is present on every step, in the same place, at the same
              size as the forward button. A tour you cannot leave is a wall. */}
          <button type="button" className="button button--bare" onClick={onClose}>
            Skip
          </button>

          <span className="tour__dots" aria-hidden="true">
            {STEPS.map((entry, index) => (
              <span key={entry.title} className="tour__dot" data-done={index <= step} />
            ))}
          </span>

          {last ? (
            <button type="button" className="button button--primary" onClick={onClose}>
              Let me try
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setStep((value) => value + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
