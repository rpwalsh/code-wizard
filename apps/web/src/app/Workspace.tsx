// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Demonstration } from '@code-wizard/curriculum';
import type { TrainingMode } from '@code-wizard/core';
import { affordancesFor, isGreen } from '@code-wizard/core';
import type { Exercise } from '@code-wizard/exercises';
import type { FluencyHistory } from '@code-wizard/learning';
import { buildHistory } from '@code-wizard/learning';
import type { SessionState } from '@code-wizard/session';
import { ExerciseSession } from '@code-wizard/session';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { Complete } from '../components/Complete.tsx';
import { Editor } from '../components/Editor.tsx';
import { Hints } from '../components/Hints.tsx';
import type { TimerMode } from '../components/Timer.tsx';
import { Timer } from '../components/Timer.tsx';
import { Predict, PredictionVerdict } from '../components/Predict.tsx';
import type { Command } from '../components/Palette.tsx';
import { Results } from '../components/Results.tsx';
import { TraceScope } from '../components/TraceScope.tsx';
import { Walkthrough } from '../components/Walkthrough.tsx';
import { Resizer } from '../components/layout/Resizer.tsx';
import type { LanguageRuntime } from '@code-wizard/core';
import type { Platform } from '../platform/index.ts';

/**
 * What the learner is doing right now.
 *
 * The layout follows this rather than making them drag panel dividers: writing
 * gives the editor everything, running opens the output, a failure opens the
 * diagnostics wider, and focus mode takes the chrome away entirely.
 */
type Focus = 'write' | 'run' | 'diagnose' | 'inspect' | 'zen';

const BRIEF_WIDTH_KEY = 'workspace.briefWidth';
/** Narrow enough that a hint still wraps readably rather than one word a line. */
const MIN_BRIEF_WIDTH = 200;
/** Wide enough to read comfortably, short of crowding out the editor. */
const MAX_BRIEF_WIDTH = 620;
const DEFAULT_BRIEF_WIDTH = 320;

interface WorkspaceProps {
  readonly platform: Platform;
  readonly exercise: Exercise;
  readonly mode: TrainingMode;
  readonly timerMode: TimerMode;
  /** Set when this sitting is a claim being tested rather than practice. */
  readonly demonstration?: Demonstration;
  readonly fontSize: number;
  readonly onLeave: () => void;
  readonly onAgain: () => void;
  readonly onCommands: (commands: readonly Command[]) => void;
}

export function Workspace({
  platform,
  exercise,
  mode,
  timerMode,
  demonstration,
  fontSize,
  onLeave,
  onAgain,
  onCommands,
}: WorkspaceProps) {
  // The task panel's width. Kept in the store rather than in the component so
  // it survives leaving the exercise, and travels with an export like every
  // other preference.
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [briefWidth, setBriefWidth] = useState(DEFAULT_BRIEF_WIDTH);

  const previewBriefWidth = useCallback((width: number) => {
    workspaceRef.current?.style.setProperty('--brief-user-width', `${width}px`);
  }, []);

  useEffect(() => {
    let canceled = false;
    void platform.store.getSetting(BRIEF_WIDTH_KEY).then((stored) => {
      const width = Number(stored);
      if (canceled || !Number.isFinite(width) || width <= 0) return;
      const clamped = Math.min(MAX_BRIEF_WIDTH, Math.max(MIN_BRIEF_WIDTH, width));
      setBriefWidth(clamped);
      previewBriefWidth(clamped);
    });
    return () => {
      canceled = true;
    };
  }, [platform, previewBriefWidth]);

  const commitBriefWidth = useCallback(
    (width: number) => {
      setBriefWidth(width);
      previewBriefWidth(width);
      void platform.store.setSetting(BRIEF_WIDTH_KEY, String(width)).catch(() => {
        // A width that fails to save is a width that resets next time.
      });
    },
    [platform, previewBriefWidth],
  );

  const session = useMemo(
    () =>
      ExerciseSession.begin(exercise, mode, {
        runtime: runtimeFor(platform, exercise.language),
        store: platform.store,
        skillGraph: platform.skillGraph,
        skillsOf: (exerciseId) =>
          platform.catalog.has(exerciseId) ? platform.catalog.get(exerciseId).skills : [],
        ...(demonstration ? { demonstration } : {}),
      }),
    [platform, exercise, mode, demonstration],
  );

  const state = useSessionState(session);
  const [activePath, setActivePath] = useState(state.files[0]?.path ?? '');
  const [focus, setFocus] = useState<Focus>('write');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FluencyHistory | null>(null);
  const elapsed = useElapsed(!state.solved);

  const affordances = affordancesFor(mode);
  const activeFile = state.files.find((file) => file.path === activePath) ?? state.files[0] ?? null;
  const busy = state.activity !== 'idle';
  const [traced, setTraced] = useState<{ file: string; line: number } | null>(null);
  // Hold-my-hand: open the guided tour automatically in Learn mode, and keep
  // it one click away wherever hints are allowed. Never during a
  // demonstration — a walked-through claim is not a demonstrated one.
  const [walkthroughOpen, setWalkthroughOpen] = useState(
    mode === 'learn' && demonstration === undefined,
  );

  // Hoisted, not inlined into the conditionally-rendered scope: a hook inside
  // a branch changes the hook count between renders.
  const highlightTraced = useCallback(
    (file: string, line: number) => setTraced({ file, line }),
    [],
  );

  const guard = useCallback(async <T,>(body: () => Promise<T>) => {
    setError(null);
    try {
      await body();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }, []);

  const runTests = useCallback(() => {
    void guard(async () => {
      const result = await session.runTests();
      // Green closes the loop, so the layout gets out of the way; red opens
      // the diagnostics, because that is what the learner needs to read next.
      setFocus(isGreen(result) ? 'run' : 'diagnose');
    });
  }, [guard, session]);

  const run = useCallback(() => {
    setFocus('run');
    void guard(() => session.run());
  }, [guard, session]);

  const recordTrace = useCallback(
    (testId?: string) => {
      setFocus('inspect');
      void guard(() => session.trace(testId ? { test: testId } : undefined));
    },
    [guard, session],
  );

  // Once solved, load the history behind the "you got faster" comparison.
  useEffect(() => {
    if (!state.solved) return;
    void platform.store
      .attemptsFor(exercise.id)
      .then((attempts) =>
        setHistory(buildHistory(exercise.id, attempts, exercise.estimatedSeconds)),
      )
      .catch(() => setHistory(null));
  }, [state.solved, platform, exercise]);

  // Leaving mid-exercise still records the attempt: an abandoned attempt that
  // ran the tests is real evidence, and discarding it would flatter the numbers.
  useEffect(() => {
    return () => {
      void session.abandon().catch(() => undefined);
    };
  }, [session]);

  useEffect(() => {
    onCommands([
      { id: 'run-tests', name: 'Run tests', shortcut: 'Ctrl ↵', run: runTests },
      { id: 'run', name: 'Run code', run },
      {
        id: 'trace',
        name: 'Trace execution — watch it run line by line',
        disabled: !state.tracingAvailable,
        run: () => recordTrace(),
      },
      {
        id: 'hint',
        name: 'Reveal next hint',
        disabled: !state.hintsAllowed || state.remainingHints === 0,
        run: () => void guard(() => session.revealNextHint()),
      },
      {
        id: 'zen',
        name: focus === 'zen' ? 'Leave distraction-free mode' : 'Distraction-free mode',
        run: () => setFocus((current) => (current === 'zen' ? 'write' : 'zen')),
      },
      {
        id: 'walkthrough',
        name: walkthroughOpen ? 'Close the walkthrough' : 'Walk me through it',
        disabled: !affordances.hints || demonstration !== undefined,
        run: () => setWalkthroughOpen((current) => !current),
      },
      { id: 'reset', name: 'Reset to starter code', run: () => session.resetFiles() },
      { id: 'leave', name: 'Back to today', run: onLeave },
    ]);
  }, [
    onCommands,
    runTests,
    run,
    recordTrace,
    state.tracingAvailable,
    guard,
    session,
    state.hintsAllowed,
    state.remainingHints,
    focus,
    onLeave,
    walkthroughOpen,
    affordances.hints,
    demonstration,
  ]);

  return (
    <div className="workspace" data-focus={focus} ref={workspaceRef}>
      <header className="workspace__bar">
        <button type="button" className="button button--bare" onClick={onLeave}>
          ← Today
        </button>

        <p className="crumb">
          {platform.runtimes.get(exercise.language)?.metadata().displayName ?? exercise.language} /{' '}
          <strong>{exercise.title}</strong>
        </p>

        <span className="workspace__bar-spacer" />

        {affordances.hints && !demonstration ? (
          <button
            type="button"
            className="button button--bare"
            aria-pressed={walkthroughOpen}
            onClick={() => setWalkthroughOpen((current) => !current)}
          >
            Walk me through it
          </button>
        ) : null}

        {affordances.timer ? (
          <Timer mode={timerMode} elapsedMs={elapsed} exercise={exercise} />
        ) : null}

        <button
          type="button"
          className="button button--bare"
          onClick={() => setFocus((current) => (current === 'zen' ? 'write' : 'zen'))}
          aria-pressed={focus === 'zen'}
        >
          {focus === 'zen' ? 'Show panels' : 'Focus'}
        </button>
        <button type="button" className="button" onClick={run} disabled={busy}>
          Run
        </button>
        {state.tracingAvailable ? (
          <button
            type="button"
            className="button"
            onClick={() => recordTrace()}
            disabled={busy}
            title="Watch the program run one line at a time"
          >
            Trace
          </button>
        ) : null}
        <button type="button" className="button button--primary" onClick={runTests} disabled={busy}>
          Test <kbd>Ctrl ↵</kbd>
        </button>
      </header>

      {error ? (
        <p className="notice notice--error" role="alert" style={{ margin: 12 }}>
          {error}
        </p>
      ) : null}

      <div className="workspace__body">
      {walkthroughOpen ? (
        <Walkthrough
          exercise={exercise}
          revealedHints={state.revealedHints}
          hintsAllowed={state.hintsAllowed}
          canRevealSolution={affordances.solutionReveal}
          onRevealHint={(rung) =>
            void guard(async () => {
              // Down to the rung being read, not just the next one. The
              // walkthrough shows a chosen step while the session only ever
              // uncovered the following hint, so anyone who paged ahead
              // before asking for help clicked a button that visibly did
              // nothing. Revealing the ones passed over is also the honest
              // accounting: reaching rung three is reaching rung three.
              while (session.state.revealedHints.length <= rung) {
                if ((await session.revealNextHint()) === null) break;
              }
            })
          }
          onRevealSolution={async () => {
            // Guarded like every other session call: unguarded, a refusal
            // rejects into nothing and the button appears to do nothing.
            try {
              return await session.revealSolution();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : String(caught));
              return null;
            }
          }}
          onOpenTests={() => {
            const test = exercise.tests.find((entry) => entry.visibility === 'visible');
            const open = state.files.find((file) => file.path === test?.path);
            if (open) setActivePath(open.path);
          }}
          onRunTests={runTests}
          onClose={() => setWalkthroughOpen(false)}
        />
      ) : null}

        <aside className="brief" aria-label="Task" hidden={focus !== 'write'}>
          <Prompt exercise={exercise} />

          <Predict
            pending={state.pendingPrediction}
            onPredict={(prediction) => session.predict(prediction)}
            onClear={() => session.clearPrediction()}
          />

          <section>
            <p className="label">Skills</p>
            <ul className="skill-dots" style={{ marginTop: 8 }}>
              {exercise.skills.map((skillId) => (
                <li key={skillId} className="skill-dot">
                  <span className="skill-dot__mark" aria-hidden="true">
                    ○
                  </span>
                  <span>{skillName(platform, skillId)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {focus === 'write' ? (
          <Resizer
            label="Task panel width"
            value={briefWidth}
            min={MIN_BRIEF_WIDTH}
            max={MAX_BRIEF_WIDTH}
            reset={DEFAULT_BRIEF_WIDTH}
            onPreview={previewBriefWidth}
            onCommit={commitBriefWidth}
          />
        ) : null}

        <main className="editor-pane" aria-label="Editor">
          <div className="editor-pane__tabs">
            {state.files.map((file) => (
              <button
                key={file.path}
                type="button"
                className="filetab"
                aria-current={file.path === activeFile?.path ? 'true' : undefined}
                onClick={() => setActivePath(file.path)}
              >
                {file.path}
                {file.readOnly ? ' ·' : ''}
              </button>
            ))}
          </div>

          <div className="editor-pane__host">
            {activeFile ? (
              <Editor
                path={activeFile.path}
                value={activeFile.contents}
                language={runtimeFor(platform, exercise.language).metadata().editorLanguage}
                readOnly={activeFile.readOnly}
                autocomplete={affordances.editorAutocomplete}
                fontSize={fontSize}
                onChange={(changedPath, next) => {
                  // Monaco reports a change when it swaps models on a tab
                  // switch. It is not an edit: nobody typed, and the file may
                  // not even be editable. Writing it through raised "not
                  // editable in this exercise" from a click on a tab.
                  const changed = state.files.find((file) => file.path === changedPath);
                  if (!changed || changed.readOnly) return;
                  if (changed.contents === next) return;
                  session.updateFile(changedPath, next);
                }}
                onRunTests={runTests}
                // Only mark the file the step is actually in.
                highlightLine={traced?.file === activeFile.path ? traced.line : null}
              />
            ) : null}
          </div>
        </main>

        <aside
          className="aside"
          aria-label="Diagnostics"
          hidden={focus === 'write' || focus === 'zen'}
        >
          {focus === 'inspect' ? (
            <TraceScope
              trace={state.lastTrace}
              busy={state.activity === 'tracing'}
              files={state.files}
              onRun={() => recordTrace()}
              onHighlight={highlightTraced}
            />
          ) : state.completion ? (
            <Complete
              report={state.completion}
              exercise={exercise}
              history={history}
              onAgain={onAgain}
              onLeave={onLeave}
            />
          ) : (
            <>
              <PredictionVerdict pending={state.pendingPrediction} history={state.predictions} />
              <Results
                result={state.lastTests}
                busy={state.activity === 'testing'}
                {...(state.tracingAvailable ? { onWatch: recordTrace } : {})}
              />
              {state.lastRun ? <Terminal state={state} /> : null}
              <Hints
                revealed={state.revealedHints}
                remaining={state.remainingHints}
                allowed={state.hintsAllowed}
                onReveal={() => void guard(() => session.revealNextHint())}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Terminal({ state }: { readonly state: SessionState }) {
  const result = state.lastRun;
  if (!result) return null;

  return (
    <section className="terminal">
      <p className="label">Output</p>
      {result.stdout ? <pre style={{ marginTop: 8 }}>{result.stdout}</pre> : null}
      {result.stderr ? <pre style={{ marginTop: 8 }}>{result.stderr}</pre> : null}
      <p className="terminal__meta">
        exit {result.exitCode ?? '—'} · {(result.durationMs / 1000).toFixed(2)}s
        {result.truncated ? ' · truncated' : ''}
      </p>
    </section>
  );
}

/**
 * The prompt as typography.
 *
 * Indented blocks in the authored prompt become code; everything else is
 * prose. No card, no heading chrome — the task should read like a
 * specification handed to an engineer.
 */
function Prompt({ exercise }: { readonly exercise: Exercise }) {
  const blocks = exercise.prompt.split(/\n{2,}/);

  return (
    <section>
      <p className="prompt__title">{exercise.title}</p>
      <div className="prompt__body">
        {blocks.map((block) =>
          /^\s{4,}/.test(block) ? (
            <pre key={block}>{dedent(block)}</pre>
          ) : (
            <p key={block}>{block}</p>
          ),
        )}
      </div>
      <div className="prompt__rule" style={{ margin: '16px 0' }} />
      <p className="label">You should be able to</p>
      <ul className="prompt__body" style={{ marginTop: 8 }}>
        {exercise.learningObjectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </section>
  );
}

function dedent(block: string): string {
  const lines = block.replace(/\s+$/, '').split('\n');
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)?.[0].length ?? 0),
  );
  return lines.map((line) => line.slice(indent)).join('\n');
}

function skillName(platform: Platform, skillId: string): string {
  return platform.skillGraph.has(skillId) ? platform.skillGraph.get(skillId).name : skillId;
}

/** Subscribe to the session without copying its state into React. */
function useSessionState(session: ExerciseSession): SessionState {
  return useSyncExternalStore(
    useCallback((listener) => session.subscribe(listener), [session]),
    useCallback(() => session.state, [session]),
  );
}

/** A once-a-second tick, stopped as soon as the exercise is solved. */
function useElapsed(running: boolean): number {
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return elapsed;
}

/**
 * The runtime for a language, or a clear failure.
 *
 * The catalog is filtered against the platform's registry before anything is
 * offered, so this should never miss. When it does, the message says which
 * language and which build rather than throwing a null dereference three
 * frames deeper.
 */
function runtimeFor(platform: Platform, language: string): LanguageRuntime {
  const runtime = platform.runtimes.get(language);
  if (!runtime) {
    throw new Error(
      `The ${platform.kind} build cannot run ${language}. ` +
        'This exercise should not have been offered.',
    );
  }
  return runtime;
}
