import type { TrainingMode } from '@forge/core';
import { affordancesFor } from '@forge/core';
import type { Exercise } from '@forge/exercises';
import type { SessionState } from '@forge/session';
import { ExerciseSession } from '@forge/session';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { CompletionCard, formatDuration } from '../components/CompletionCard.tsx';
import { Editor } from '../components/Editor.tsx';
import { HintLadder } from '../components/HintLadder.tsx';
import { Terminal } from '../components/Terminal.tsx';
import { TestPanel } from '../components/TestPanel.tsx';
import type { Platform } from '../platform/index.ts';

interface WorkspaceProps {
  readonly platform: Platform;
  readonly exercise: Exercise;
  readonly mode: TrainingMode;
  readonly fontSize: number;
  readonly onLeave: () => void;
}

type Pane = 'tests' | 'output' | 'prompt';

export function Workspace({ platform, exercise, mode, fontSize, onLeave }: WorkspaceProps) {
  const session = useMemo(
    () =>
      ExerciseSession.begin(exercise, mode, {
        runtime: platform.runtime,
        store: platform.store,
        skillGraph: platform.skillGraph,
      }),
    [platform, exercise, mode],
  );

  const state = useSessionState(session);
  const [activePath, setActivePath] = useState(state.files[0]?.path ?? '');
  const [pane, setPane] = useState<Pane>('tests');
  const [error, setError] = useState<string | null>(null);
  const elapsed = useElapsed(!state.solved);

  const activeFile = state.files.find((file) => file.path === activePath) ?? state.files[0] ?? null;

  const guard = useCallback(async (body: () => Promise<unknown>) => {
    setError(null);
    try {
      await body();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  const runTests = useCallback(() => {
    setPane('tests');
    void guard(() => session.runTests());
  }, [guard, session]);

  const run = useCallback(() => {
    setPane('output');
    void guard(() => session.run());
  }, [guard, session]);

  // Leaving mid-exercise still records the attempt: an abandoned attempt that
  // ran the tests is real evidence, and silently discarding it would flatter
  // the learner's numbers.
  useEffect(() => {
    return () => {
      void session.abandon().catch(() => {});
    };
  }, [session]);

  const busy = state.activity !== 'idle';

  return (
    <div className="workspace">
      <header className="workspace__bar">
        <button type="button" className="button button--quiet" onClick={onLeave}>
          <span aria-hidden="true">←</span> Today
        </button>

        <div className="workspace__title">
          <h2>{exercise.title}</h2>
          <p className="muted">
            {exercise.kind.replace(/-/g, ' ')} · difficulty {exercise.difficulty} ·{' '}
            <span className="mode-badge">{mode}</span>
          </p>
        </div>

        <div className="workspace__actions">
          {affordancesFor(mode).timer ? (
            <output className="timer" aria-label="Time on this exercise">
              {formatDuration(elapsed)}
            </output>
          ) : null}
          <button type="button" className="button button--quiet" onClick={run} disabled={busy}>
            Run
          </button>
          <button type="button" className="button" onClick={runTests} disabled={busy}>
            Test <kbd>Ctrl</kbd>
            <kbd>↵</kbd>
          </button>
        </div>
      </header>

      {error ? (
        <p className="run-problem" role="alert">
          {error}
        </p>
      ) : null}

      <div className="workspace__body">
        <nav className="explorer" aria-label="Files">
          <h3 className="explorer__heading">Files</h3>
          <ul>
            {state.files.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  className={`explorer__file${file.path === activeFile?.path ? ' is-active' : ''}`}
                  aria-current={file.path === activeFile?.path ? 'true' : undefined}
                  onClick={() => setActivePath(file.path)}
                >
                  {file.path}
                  {file.readOnly ? <span className="badge">read-only</span> : null}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="button button--quiet explorer__reset"
            onClick={() => session.resetFiles()}
            disabled={busy}
          >
            Reset to starter
          </button>
        </nav>

        <main className="editor" aria-label="Code editor">
          {activeFile ? (
            <Editor
              path={activeFile.path}
              value={activeFile.contents}
              language={platform.runtime.metadata().editorLanguage}
              readOnly={activeFile.readOnly}
              autocomplete={affordancesFor(mode).editorAutocomplete}
              fontSize={fontSize}
              onChange={(next) => session.updateFile(activeFile.path, next)}
              onRunTests={runTests}
            />
          ) : null}
        </main>

        <aside className="sidebar" aria-label="Exercise">
          <div className="tabs" role="tablist" aria-label="Panels">
            {(['tests', 'output', 'prompt'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                id={`tab-${candidate}`}
                aria-selected={pane === candidate}
                aria-controls={`panel-${candidate}`}
                className={`tab${pane === candidate ? ' is-active' : ''}`}
                onClick={() => setPane(candidate)}
              >
                {candidate === 'tests' ? 'Tests' : candidate === 'output' ? 'Output' : 'Task'}
              </button>
            ))}
          </div>

          <div
            id={`panel-${pane}`}
            role="tabpanel"
            aria-labelledby={`tab-${pane}`}
            className="sidebar__panel"
          >
            {pane === 'tests' ? (
              <TestPanel result={state.lastTests} busy={state.activity === 'testing'} />
            ) : null}
            {pane === 'output' ? (
              <Terminal result={state.lastRun} busy={state.activity === 'running'} />
            ) : null}
            {pane === 'prompt' ? <Prompt exercise={exercise} /> : null}
          </div>

          {state.completion ? (
            <CompletionCard
              report={state.completion}
              {...(exercise.explanation ? { explanation: exercise.explanation } : {})}
              onNext={onLeave}
            />
          ) : (
            <HintLadder
              revealed={state.revealedHints}
              remaining={state.remainingHints}
              allowed={state.hintsAllowed}
              onReveal={() => void guard(() => session.revealNextHint())}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function Prompt({ exercise }: { readonly exercise: Exercise }) {
  return (
    <div className="panel prompt">
      {exercise.prompt.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <h4>You should be able to</h4>
      <ul>
        {exercise.learningObjectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </div>
  );
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
