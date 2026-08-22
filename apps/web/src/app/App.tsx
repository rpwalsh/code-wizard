import type { TrainingMode } from '@forge/core';
import { trainingModes } from '@forge/core';
import type { Exercise } from '@forge/exercises';
import type { ExperienceLevel } from '@forge/curriculum';
import { seedFromExperience } from '@forge/curriculum';
import type { Constraint, Dashboard, SkillMap } from '@forge/session';
import { ProgressService } from '@forge/session';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Command } from '../components/Palette.tsx';
import { Palette, usePaletteShortcut } from '../components/Palette.tsx';
import type { Platform, PlatformProgress } from '../platform/index.ts';
import { createPlatform } from '../platform/index.ts';
import { Home } from './Home.tsx';
import { Onboarding } from './Onboarding.tsx';
import { SkillMapView } from './SkillMapView.tsx';
import { Workspace } from './Workspace.tsx';

/** Set once the learner has answered the first-run question. */
const ONBOARDED_KEY = 'onboarding.level';

type Screen =
  | { readonly kind: 'home' }
  | { readonly kind: 'map' }
  | { readonly kind: 'workspace'; readonly exercise: Exercise; readonly nonce: number };

export function App() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [progress, setProgress] = useState<PlatformProgress>({
    stage: 'catalog',
    message: 'Starting',
  });
  const [failure, setFailure] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [skillMap, setSkillMap] = useState<SkillMap | null>(null);
  const [constraints, setConstraints] = useState<Record<string, readonly Constraint[]>>({});
  const [mode, setMode] = useState<TrainingMode>('practice');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [fontSize, setFontSize] = useState(14);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [screenCommands, setScreenCommands] = useState<readonly Command[]>([]);

  usePaletteShortcut(useCallback(() => setPaletteOpen(true), []));

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
        void created.warmUp?.().catch(() => undefined);
      } catch (caught) {
        if (!cancelled) setFailure(caught instanceof Error ? caught.message : String(caught));
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
    const [next, map] = await Promise.all([service.dashboard(), service.skillMap()]);
    setDashboard(next);
    setSkillMap(map);
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Asked once, then never again. The answer is stored rather than inferred so
  // clearing progress also clears the claim it was based on.
  useEffect(() => {
    if (!platform) return;
    void platform.store
      .getSetting(ONBOARDED_KEY)
      .then((value) => setOnboarded(value !== null))
      .catch(() => setOnboarded(true));
  }, [platform]);

  const completeOnboarding = useCallback(
    async (level: ExperienceLevel) => {
      if (!platform) return;
      const seeded = seedFromExperience(platform.skillGraph, level, {
        at: new Date().toISOString(),
        language: 'python',
      });
      for (const mastery of seeded.values()) await platform.store.saveMastery(mastery);
      await platform.store.setSetting(ONBOARDED_KEY, level);
      setOnboarded(true);
      await refresh();
    },
    [platform, refresh],
  );

  const open = useCallback((exercise: Exercise) => {
    setScreen({ kind: 'workspace', exercise, nonce: Date.now() });
  }, []);

  const leave = useCallback(() => {
    setScreen({ kind: 'home' });
    void refresh();
  }, [refresh]);

  const constraintsFor = useCallback(
    (skillId: string): readonly Constraint[] => {
      if (!service) return [];
      if (!(skillId in constraints)) {
        void service.constraints(skillId).then((found) => {
          setConstraints((current) => ({ ...current, [skillId]: found }));
        });
        return [];
      }
      return constraints[skillId] ?? [];
    },
    [service, constraints],
  );

  const commands = useMemo<readonly Command[]>(() => {
    const navigation: Command[] = [
      { id: 'go-home', name: 'Go to today', run: () => setScreen({ kind: 'home' }) },
      { id: 'go-map', name: 'Open skill map', run: () => setScreen({ kind: 'map' }) },
      ...trainingModes.map((candidate) => ({
        id: `mode-${candidate}`,
        name: `Switch to ${candidate} mode`,
        disabled: candidate === mode,
        run: () => setMode(candidate),
      })),
      {
        id: 'font-up',
        name: 'Increase editor font size',
        run: () => setFontSize((size) => Math.min(28, size + 1)),
      },
      {
        id: 'font-down',
        name: 'Decrease editor font size',
        run: () => setFontSize((size) => Math.max(10, size - 1)),
      },
    ];
    return [...screenCommands, ...navigation];
  }, [screenCommands, mode]);

  if (failure) {
    return (
      <main className="boot">
        <p className="boot__mark">Forge</p>
        <p className="notice notice--error" role="alert">
          {failure}
        </p>
      </main>
    );
  }

  if (platform && onboarded === false) {
    return <Onboarding onChoose={completeOnboarding} />;
  }

  if (!platform || !dashboard || !skillMap || onboarded === null) {
    return (
      <main className="boot" aria-busy="true">
        <p className="boot__mark">Forge</p>
        <p className="boot__status" role="status" aria-live="polite">
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

      <header className="topbar">
        <span className="wordmark">Forge</span>

        <nav className="topbar__nav" aria-label="Sections">
          <button
            type="button"
            className="navlink"
            aria-current={screen.kind === 'home' ? 'true' : undefined}
            onClick={() => setScreen({ kind: 'home' })}
          >
            Today
          </button>
          <button
            type="button"
            className="navlink"
            aria-current={screen.kind === 'map' ? 'true' : undefined}
            onClick={() => setScreen({ kind: 'map' })}
          >
            Skill map
          </button>
        </nav>

        <span className="topbar__spacer" />

        <button
          type="button"
          className="button button--bare"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open commands"
        >
          <kbd>Ctrl K</kbd>
        </button>

        <span className="mode-indicator" data-mode={mode}>
          <span className="mode-indicator__dot" aria-hidden="true" />
          <label>
            <span className="visually-hidden">Training mode</span>
            <select
              className="mode-select"
              value={mode}
              onChange={(event) => setMode(event.target.value as TrainingMode)}
            >
              {trainingModes.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </label>
        </span>
      </header>

      {!platform.persistent ? (
        <p className="notice" role="alert" style={{ margin: 12 }}>
          {platform.storageNote ?? 'Progress will not be saved in this browser.'}
        </p>
      ) : null}

      <div id="main" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {screen.kind === 'home' ? (
          <Home platform={platform} dashboard={dashboard} onOpen={open} />
        ) : null}

        {screen.kind === 'map' ? (
          <SkillMapView
            map={skillMap}
            constraintsFor={constraintsFor}
            exerciseCountFor={(skillId) => platform.catalog.forSkill(skillId).length}
            onPractise={(skillId) => {
              const candidate = platform.catalog.forSkill(skillId)[0];
              if (candidate) open(candidate);
            }}
          />
        ) : null}

        {screen.kind === 'workspace' ? (
          <Workspace
            // A session is one sitting. Remounting per exercise, per mode and
            // per retry keeps attempts from blurring into each other — and the
            // nonce is what makes "try it again" a genuinely fresh attempt.
            key={`${screen.exercise.id}:${mode}:${screen.nonce}`}
            platform={platform}
            exercise={screen.exercise}
            mode={mode}
            fontSize={fontSize}
            onLeave={leave}
            onAgain={() => open(screen.exercise)}
            onCommands={setScreenCommands}
          />
        ) : null}
      </div>

      <Palette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
