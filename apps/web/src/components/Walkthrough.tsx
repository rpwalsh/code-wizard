// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Hold-my-hand mode: the exercise walked one step at a time.
 *
 * Nothing here is generated. Every step is assembled from material the
 * exercise already carries — the prompt, the objectives, the hint ladder,
 * the reference solution, the explanation — presented at a pace someone
 * staring at an unfamiliar screen can actually board. The panic this
 * exists for is real: an editor full of `throw new Error('not
 * implemented')` says "prove yourself" to one person and "you should not
 * be here" to another, and only the pacing differs between those readings.
 *
 * The walkthrough spends the same currency the hint panel spends — each
 * revealed rung is recorded through the session and weighs on the attempt
 * exactly as if the Hints panel had revealed it. Guidance is never free
 * and never punished; it is simply counted, the same everywhere.
 */
import type { Exercise, Hint } from '@code-wizard/exercises';
import { useState } from 'react';

import { Inline } from './Inline.tsx';

interface WalkthroughProps {
  readonly exercise: Exercise;
  readonly revealedHints: readonly Hint[];
  readonly hintsAllowed: boolean;
  readonly canRevealSolution: boolean;
  readonly onRevealHint: () => void;
  readonly onRevealSolution: () => Promise<Record<string, string> | null>;
  readonly onOpenTests: () => void;
  readonly onRunTests: () => void;
  readonly onClose: () => void;
}

const RUNG_INTRO: readonly { readonly title: string; readonly lead: string }[] = [
  { title: 'The idea', lead: 'Before any code: the concept this task is built on.' },
  { title: 'The shape', lead: 'How to structure a solution, without writing it yet.' },
  { title: 'The language', lead: 'The specific feature of this language that does the work.' },
  { title: 'The syntax', lead: 'What the key line actually looks like.' },
  { title: 'The answer, nearly', lead: 'As close to the solution as a hint can honestly get.' },
];

export function Walkthrough({
  exercise,
  revealedHints,
  hintsAllowed,
  canRevealSolution,
  onRevealHint,
  onRevealSolution,
  onOpenTests,
  onRunTests,
  onClose,
}: WalkthroughProps) {
  const [step, setStep] = useState(0);
  const [solution, setSolution] = useState<Record<string, string> | null>(null);

  const hintSteps = hintsAllowed ? exercise.hints.length : 0;
  // task, tests, each hint rung, (solution), your turn
  const total = 2 + hintSteps + (canRevealSolution ? 1 : 0) + 1;
  const last = total - 1;
  const solutionStep = canRevealSolution ? 2 + hintSteps : -1;

  const body = () => {
    if (step === 0) {
      return (
        <>
          <h2 className="walkthrough__title">{exercise.title}</h2>
          <p className="walkthrough__lead">
            Read this once, slowly. Nothing is timed and nothing below will assume you already
            know it.
          </p>
          <div className="prompt__body">
            {exercise.prompt.split(/\n{2,}/).map((block) => (
              <p key={block}>
                <Inline text={block} />
              </p>
            ))}
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <h2 className="walkthrough__title">How your code is judged</h2>
          <p className="walkthrough__lead">
            The tests call your functions and compare what comes back against what should. A red
            result is not a verdict on you — it is the machine showing both sides so you can see
            the difference.
          </p>
          <p className="walkthrough__lead">
            The test file is open beside the editor — reading it is allowed, encouraged, and how
            working engineers find out what is expected of their code.
          </p>
          <button
            type="button"
            className="button"
            onClick={onOpenTests}
            style={{ alignSelf: 'start' }}
          >
            Open the tests
          </button>
        </>
      );
    }

    const rung = step - 2;
    if (rung >= 0 && rung < hintSteps) {
      const intro = RUNG_INTRO[rung] ?? RUNG_INTRO[RUNG_INTRO.length - 1];
      const revealed = revealedHints[rung];
      return (
        <>
          <h2 className="walkthrough__title">{intro?.title}</h2>
          <p className="walkthrough__lead">{intro?.lead}</p>
          {revealed ? (
            <blockquote className="walkthrough__hint">
              <Inline text={revealed.text} />
            </blockquote>
          ) : (
            <>
              <p className="walkthrough__lead">
                Want to try from here first? Skipping ahead costs nothing. Showing the hint is
                counted, the same as the hint panel — guidance is never free and never punished,
                just measured.
              </p>
              <button
                type="button"
                className="button"
                onClick={onRevealHint}
                style={{ alignSelf: 'start' }}
              >
                Show me
              </button>
            </>
          )}
        </>
      );
    }

    if (step === solutionStep) {
      return (
        <>
          <h2 className="walkthrough__title">The reference solution</h2>
          {solution === null ? (
            <>
              <p className="walkthrough__lead">
                In Learn mode you may read the whole answer. Reading it and then writing your own
                from memory is a legitimate way to learn — copying it teaches your clipboard.
              </p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  void onRevealSolution().then(setSolution);
                }}
                style={{ alignSelf: 'start' }}
              >
                Show the solution
              </button>
            </>
          ) : (
            <>
              {Object.entries(solution).map(([path, contents]) => (
                <div key={path}>
                  <p className="label">{path}</p>
                  <pre className="walkthrough__code">{contents}</pre>
                </div>
              ))}
              {exercise.explanation ? (
                <>
                  <p className="label">Why it is written this way</p>
                  <div className="prompt__body">
                    {exercise.explanation.split(/\n{2,}/).map((block) => (
                      <p key={block}>
                        <Inline text={block} />
                      </p>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </>
      );
    }

    return (
      <>
        <h2 className="walkthrough__title">Your turn</h2>
        <p className="walkthrough__lead">
          Edit the file, press <strong>Test</strong>, and read what comes back. Red is the normal
          state of code being written — every working program you have ever used spent most of
          its life failing its tests.
        </p>
        <p className="walkthrough__lead">
          This panel stays one click away in the bar above if you want the tour again.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            onRunTests();
            onClose();
          }}
          style={{ alignSelf: 'start' }}
        >
          Run the tests now
        </button>
      </>
    );
  };

  return (
    <div className="walkthrough" role="region" aria-label="Guided walkthrough">
      <div className="walkthrough__head">
        <p className="label">
          Walkthrough · step {step + 1} of {total}
        </p>
        <button
          type="button"
          className="button button--bare"
          onClick={onClose}
          aria-label="Close the walkthrough"
        >
          ✕
        </button>
      </div>

      <div className="walkthrough__body">{body()}</div>

      <div className="walkthrough__nav">
        <button
          type="button"
          className="button"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          ← Back
        </button>
        <span className="walkthrough__dots" aria-hidden="true">
          {Array.from({ length: total }, (unused, index) => (
            <span key={index} className="walkthrough__dot" data-done={index <= step} />
          ))}
        </span>
        {step < last ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => setStep((current) => Math.min(last, current + 1))}
          >
            Next →
          </button>
        ) : (
          <button type="button" className="button button--primary" onClick={onClose}>
            Start writing
          </button>
        )}
      </div>
    </div>
  );
}
