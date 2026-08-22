import type { TrainingMode } from '@forge/core';
import type { Exercise } from '@forge/exercises';
import type { Dashboard } from '@forge/session';
import { ProgressService } from '@forge/session';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Platform, PlatformProgress } from '../platform/index.ts';
import { createPlatform } from '../platform/index.ts';
import { Home } from './Home.tsx';
import { Workspace } from './Workspace.tsx';

type Screen = { kind: 'home' } | { kind: 'workspace'; exercise: Exercise };

export function App() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [progress, setProgress] = useState<PlatformProgress>({
    stage: 'catalog',
    message: 'Starting…',
  });
  const [failure, setFailure] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [mode, setMode] = useState<TrainingMode>('practice');
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const created = await createPlatform((update) => {
          if (!cancelled) setProgress(update);
        });
        if (cancelled) return;
        setPlatform(created);

        // Boot the interpreter in the background. The dashboard is usable
        // while it downloads; only pressing Run has to wait.
        void created.warmUp?.().catch(() => {});
      } catch (error) {
        if (!cancelled) setFailure(error instanceof Error ? error.message : String(error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const service = useMemo(
    () =>
      platform ? new ProgressService(platform.store, platform.catalog, platform.skillGraph) : null,
    [platform],
  );

  const refresh = useCallback(async () => {
    if (!service) return;
    setDashboard(await service.dashboard());
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (failure) {
    return (
      <main className="boot boot--failed">
        <h1>Forge</h1>
        <p className="run-problem" role="alert">
          {failure}
        </p>
      </main>
    );
  }

  if (!platform || !dashboard) {
    return (
      <main className="boot" aria-busy="true">
        <h1>Forge</h1>
        <p className="muted" role="status" aria-live="polite">
          {progress.message}
        </p>
      </main>
    );
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="app__bar">
        <h1 className="brand">Forge</h1>
        <p className="muted brand__tagline">Write it yourself.</p>

        <div className="app__bar-actions">
          <label className="font-size">
            <span className="visually-hidden">Editor font size</span>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setFontSize((size) => Math.max(10, size - 1))}
              aria-label="Decrease editor font size"
            >
              A−
            </button>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setFontSize((size) => Math.min(28, size + 1))}
              aria-label="Increase editor font size"
            >
              A+
            </button>
          </label>
          <span className="muted platform-badge">
            {platform.kind === 'desktop' ? 'Desktop' : 'In your browser'}
          </span>
        </div>
      </header>

      <div id="main">
        {screen.kind === 'home' ? (
          <Home
            platform={platform}
            dashboard={dashboard}
            mode={mode}
            onModeChange={setMode}
            onOpen={(exercise) => setScreen({ kind: 'workspace', exercise })}
          />
        ) : (
          <Workspace
            // Remounting per exercise and mode is deliberate: a session is one
            // sitting, and reusing one across exercises would blur the attempt.
            key={`${screen.exercise.id}:${mode}`}
            platform={platform}
            exercise={screen.exercise}
            mode={mode}
            fontSize={fontSize}
            onLeave={() => {
              setScreen({ kind: 'home' });
              void refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
