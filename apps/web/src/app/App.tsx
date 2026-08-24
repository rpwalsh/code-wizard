// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { TrainingMode } from '@code-wizard/core';
import { withdrawalLadder } from '@code-wizard/core';
import type { Exercise } from '@code-wizard/exercises';
import type { ExperienceLevel } from '@code-wizard/curriculum';
import { seedFromExperience } from '@code-wizard/curriculum';
import type { Constraint, Dashboard, SkillMap } from '@code-wizard/session';
import { ProgressService } from '@code-wizard/session';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Command } from '../components/Palette.tsx';
import { Palette, usePaletteShortcut } from '../components/Palette.tsx';
import type { Platform, PlatformProgress } from '../platform/index.ts';
import { createPlatform } from '../platform/index.ts';
import { fetchActivities } from '../platform/activities.ts';
import { eraseProgress, exportProgress, importProgress, pickJsonFile } from '../platform/transfer.ts';
import { Home } from './Home.tsx';
import { Onboarding } from './Onboarding.tsx';
import type { Demonstration } from '@code-wizard/curriculum';
import { planDemonstration } from '@code-wizard/curriculum';
import { Backdrop } from '../components/Backdrop.tsx';
import type { ThemeChoice } from '../components/ThemeSwitch.tsx';
import { applyTheme, isThemeChoice, themeChoices } from '../components/ThemeSwitch.tsx';
import type { TimerMode } from '../components/Timer.tsx';
import { isTimerMode, timerModes } from '../components/Timer.tsx';
import type { LanguageOption, Section } from '../components/layout/TopBar.tsx';
import { TopBar } from '../components/layout/TopBar.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { Modal } from '../components/layout/Modal.tsx';
import { ToastProvider, useToasts } from '../components/layout/Toasts.tsx';
import { Tour } from '../components/layout/Tour.tsx';
import { PracticeView } from './PracticeView.tsx';
import { SkillMapView } from './SkillMapView.tsx';
import { Workspace } from './Workspace.tsx';

/** Set once the learner has answered the first-run questions. */
const ONBOARDED_KEY = 'onboarding.level';
/** Set once the tour has been seen or skipped. Stored, never inferred. */
const TOUR_KEY = 'onboarding.tour';
const LANGUAGE_KEY = 'preferences.language';
const TIMER_KEY = 'preferences.timer';
const THEME_KEY = 'preferences.theme';

type Screen =
  | { readonly kind: 'home' }
  | { readonly kind: 'map' }
  | { readonly kind: 'practice' }
  | {
      readonly kind: 'workspace';
      readonly exercise: Exercise;
      readonly nonce: number;
      /** Set when this sitting is a claim being tested rather than practice. */
      readonly demonstration?: Demonstration;
    };

export function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const { toast } = useToasts();

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
  // Off by default. A timer helps someone deliberately training speed and
  // hurts someone stuck on a concept, and only they know which they are.
  const [timerMode, setTimerMode] = useState<TimerMode>('off');
  // Following the machine is the default, so a display that already shifts at
  // dusk is not fought with.
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [language, setLanguage] = useState<string>('python');
  const [tourSeen, setTourSeen] = useState<boolean | null>(null);
  const [dataPanel, setDataPanel] = useState<'closed' | 'open' | 'confirm'>('closed');
  const [courses, setCourses] = useState<readonly { id: string; title: string }[]>([]);
  const [fontSize, setFontSize] = useState(14);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [screenCommands, setScreenCommands] = useState<readonly Command[]>([]);

  usePaletteShortcut(useCallback(() => setPaletteOpen(true), []));

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const created = await createPlatform((update) => {
          if (!canceled) setProgress(update);
        });
        if (canceled) return;
        setPlatform(created);

        // Boot the interpreter in the background. The dashboard is usable
        // while it downloads; only pressing Run has to wait.
        void created.warmUp?.().catch(() => undefined);
      } catch (caught) {
        if (!canceled) setFailure(caught instanceof Error ? caught.message : String(caught));
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  // The full course list — including the languages this build cannot run,
  // which still have activities. Fetched once; the dropdown is the index of
  // everything the product teaches, not only what the browser executes.
  useEffect(() => {
    void fetchActivities()
      .then((sets) => setCourses(sets.map((set) => ({ id: set.id, title: set.title }))))
      .catch(() => {
        // The dropdown falls back to the runnable languages below.
      });
  }, []);

  const languages = useMemo<readonly LanguageOption[]>(() => {
    if (!platform) return [];
    const runnable = new Set(platform.runtimes.keys());
    if (courses.length === 0) {
      return [...platform.runtimes.values()]
        .map((runtime) => runtime.metadata())
        .map((meta) => ({ id: meta.id, title: meta.displayName, runnable: true }))
        .sort((a, b) => a.title.localeCompare(b.title));
    }
    return courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        runnable: runnable.has(course.id),
      }))
      .sort((a, b) => Number(b.runnable) - Number(a.runnable) || a.title.localeCompare(b.title));
  }, [platform, courses]);

  const service = useMemo(
    () =>
      platform ? new ProgressService(platform.store, platform.catalog, platform.skillGraph) : null,
    [platform],
  );

  const refresh = useCallback(async () => {
    if (!service) return;
    const [next, map] = await Promise.all([
      service.dashboard(new Date(), { language }),
      service.skillMap(),
    ]);
    setDashboard(next);
    setSkillMap(map);
  }, [service, language]);

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

  // Preferences, so they survive a reload. Validated on the way in rather
  // than cast: the values have been sitting in the learner's own storage and
  // anything could have happened to them.
  useEffect(() => {
    if (!platform) return;
    void platform.store
      .getSetting(LANGUAGE_KEY)
      .then((value) => {
        if (value !== null && value !== '') setLanguage(value);
      })
      .catch(() => {
        // A preference that cannot be read is not worth an error on screen.
      });
    void platform.store
      .getSetting(TOUR_KEY)
      .then((value) => setTourSeen(value !== null))
      // Unreadable storage should not trap someone in a tour forever.
      .catch(() => setTourSeen(true));
    void platform.store
      .getSetting(TIMER_KEY)
      .then((value) => {
        if (value !== null && isTimerMode(value)) setTimerMode(value);
      })
      .catch(() => undefined);
    void platform.store
      .getSetting(THEME_KEY)
      .then((value) => {
        if (value !== null && isThemeChoice(value)) {
          setTheme(value);
          applyTheme(value);
        }
      })
      .catch(() => undefined);
  }, [platform]);

  /**
   * Dismiss the tour, and make sure that is remembered.
   *
   * The write is awaited before the card leaves. Fire and forget lost a race:
   * dismiss, reload immediately, and the tour came back, because the reload
   * beat an IndexedDB write that had not been waited on. It is a sub-
   * millisecond write and nobody perceives the difference, but the difference
   * between "dismissed" and "dismissed and stored" is the whole feature.
   *
   * A store that refuses the write still dismisses. Seeing the tour twice is a
   * small cost; a card that cannot be closed is not.
   */
  const finishTour = useCallback(() => {
    const store = platform?.store;
    if (!store) {
      setTourSeen(true);
      return;
    }
    void store
      .setSetting(TOUR_KEY, new Date().toISOString())
      .catch(() => undefined)
      .then(() => setTourSeen(true));
  }, [platform]);

  const chooseTheme = useCallback(
    (choice: ThemeChoice) => {
      setTheme(choice);
      applyTheme(choice);
      void platform?.store.setSetting(THEME_KEY, choice).catch(() => {
        // Losing the preference is not worth interrupting anyone over.
      });
    },
    [platform],
  );

  const chooseLanguage = useCallback(
    (id: string) => {
      setLanguage(id);
      const title = languages.find((option) => option.id === id)?.title ?? id;
      toast(`Switched to ${title}`);
      // Leaving a workspace mid-attempt because the language changed would
      // throw work away; every other screen re-scopes in place.
      setScreen((current) => (current.kind === 'workspace' ? current : current));
      void platform?.store.setSetting(LANGUAGE_KEY, id).catch(() => {
        toast('Could not save the language preference', 'error');
      });
    },
    [platform, languages, toast],
  );

  const cycleTimer = useCallback(() => {
    const next = timerModes[(timerModes.indexOf(timerMode) + 1) % timerModes.length];
    if (!next) return;
    setTimerMode(next);
    void platform?.store.setSetting(TIMER_KEY, next).catch(() => {
      // Losing the preference is not worth interrupting anyone over.
    });
  }, [platform, timerMode]);

  const completeOnboarding = useCallback(
    async (chosenLanguage: string, level: ExperienceLevel) => {
      if (!platform) return;
      const seeded = seedFromExperience(platform.skillGraph, level, {
        at: new Date().toISOString(),
        language: chosenLanguage,
      });
      for (const mastery of seeded.values()) await platform.store.saveMastery(mastery);
      await platform.store.setSetting(ONBOARDED_KEY, level);
      await platform.store.setSetting(LANGUAGE_KEY, chosenLanguage).catch(() => undefined);
      setLanguage(chosenLanguage);
      setOnboarded(true);
      await refresh();
    },
    [platform, refresh],
  );

  const attempted = dashboard?.attemptedExerciseIds;
  const catalog = platform?.catalog;
  const demonstrationFor = useCallback(
    (skillId: string) =>
      catalog
        ? planDemonstration(skillId, catalog.all(), {
            ...(attempted ? { attemptedExerciseIds: attempted } : {}),
          })
        : null,
    [catalog, attempted],
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
      { id: 'go-practice', name: 'Open practice', run: () => setScreen({ kind: 'practice' }) },
      { id: 'tour', name: 'Show the welcome tour again', run: () => setTourSeen(false) },
      {
        id: 'export-progress',
        name: 'Save my progress to a file',
        run: () => {
          if (!platform) return;
          void exportProgress(platform.store).then(
            (name) => toast(`Saved ${name}`, 'success'),
            () => toast('Could not save your progress', 'error'),
          );
        },
      },
      {
        id: 'erase-progress',
        name: 'Delete everything stored on this device',
        run: () => setDataPanel('confirm'),
      },
      {
        id: 'import-progress',
        name: 'Load progress from a file (replaces what is here)',
        run: () => {
          if (!platform) return;
          void pickJsonFile().then((file) => {
            if (!file) return;
            void importProgress(platform.store, file).then(
              async () => {
                await refresh();
                toast('Progress restored', 'success');
              },
              (error: Error) => toast(error.message, 'error'),
            );
          });
        },
      },
      ...languages.map((option) => ({
        id: `language-${option.id}`,
        name: `Language: ${option.title}`,
        disabled: option.id === language,
        run: () => chooseLanguage(option.id),
      })),
      ...themeChoices.map((candidate) => ({
        id: `theme-${candidate}`,
        name: candidate === 'system' ? 'Appearance: follow the system' : `Appearance: ${candidate}`,
        disabled: candidate === theme,
        run: () => chooseTheme(candidate),
      })),
      {
        id: 'timer-cycle',
        name:
          timerMode === 'off'
            ? 'Show a timer'
            : timerMode === 'elapsed'
              ? 'Show time remaining instead'
              : 'Hide the timer',
        run: cycleTimer,
      },
      ...withdrawalLadder.map((rung) => ({
        id: `mode-${rung.mode}`,
        name: `${rung.name} — withdraws: ${rung.withdraws}`,
        disabled: rung.mode === mode,
        run: () => setMode(rung.mode),
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
  }, [
    screenCommands,
    mode,
    theme,
    timerMode,
    language,
    languages,
    chooseTheme,
    chooseLanguage,
    cycleTimer,
    platform,
    refresh,
    toast,
  ]);

  if (failure) {
    return (
      <main className="boot">
        <p className="boot__mark">Code Wizard</p>
        <p className="notice notice--error" role="alert">
          {failure}
        </p>
      </main>
    );
  }

  if (platform && onboarded === false) {
    return <Onboarding languages={languages} onChoose={completeOnboarding} />;
  }

  if (!platform || !dashboard || !skillMap || onboarded === null) {
    return (
      <main className="boot" aria-busy="true">
        <p className="boot__mark">Code Wizard</p>
        <p className="boot__status" role="status" aria-live="polite">
          <span className="spinner" data-size="small" aria-hidden="true" />
          {progress.message}
        </p>
      </main>
    );
  }

  const section: Section | null =
    screen.kind === 'home'
      ? 'home'
      : screen.kind === 'map'
        ? 'map'
        : screen.kind === 'practice'
          ? 'practice'
          : null;

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Backdrop />

      <TopBar
        section={section}
        onSection={(next) => setScreen({ kind: next })}
        languages={languages}
        language={language}
        onLanguage={chooseLanguage}
        theme={theme}
        onTheme={chooseTheme}
        mode={mode}
        onMode={setMode}
        onPalette={() => setPaletteOpen(true)}
      />

      {!platform.persistent ? (
        <p className="notice" role="alert" style={{ margin: 12 }}>
          {platform.storageNote ?? 'Progress will not be saved in this browser.'}
        </p>
      ) : null}

      <div id="main" className="app__main">
        {screen.kind === 'home' ? (
          <Home
            platform={platform}
            dashboard={dashboard}
            language={language}
            languageTitle={languages.find((option) => option.id === language)?.title ?? language}
            onOpen={open}
            onPractice={() => setScreen({ kind: 'practice' })}
          />
        ) : null}

        {screen.kind === 'practice' ? (
          <PracticeView store={platform.store} language={language} />
        ) : null}

        {screen.kind === 'map' ? (
          <SkillMapView
            map={skillMap}
            language={language}
            constraintsFor={constraintsFor}
            exerciseCountFor={(skillId) => platform.catalog.forSkill(skillId).length}
            onPractice={(skillId) => {
              // Prefer something unseen: with few exercises per skill, always
              // opening the first one made every click land on the same page.
              const candidates = platform.catalog.forSkill(skillId);
              const fresh = candidates.find(
                (candidate) => !dashboard.attemptedExerciseIds.has(candidate.id),
              );
              const candidate = fresh ?? candidates[0];
              if (candidate) open(candidate);
            }}
            canDemonstrate={(skillId) => demonstrationFor(skillId) !== null}
            onDemonstrate={(skillId) => {
              const demonstration = demonstrationFor(skillId);
              if (!demonstration) return;
              // The mode is not the learner's choice here. A claim to know
              // something is only settled with the starter code withdrawn.
              setMode(demonstration.mode);
              setScreen({
                kind: 'workspace',
                exercise: platform.catalog.get(demonstration.exerciseId),
                nonce: Date.now(),
                demonstration,
              });
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
            timerMode={timerMode}
            {...(screen.demonstration ? { demonstration: screen.demonstration } : {})}
            onLeave={leave}
            onAgain={() => open(screen.exercise)}
            onCommands={setScreenCommands}
          />
        ) : null}
      </div>

      {screen.kind !== 'workspace' ? <Footer onData={() => setDataPanel('open')} /> : null}

      {tourSeen === false ? <Tour onClose={finishTour} /> : null}

      {/* Every data action in one place, reachable from the footer.
          Hiding "delete everything" behind a keyboard palette would make the
          promise that it exists true and the promise that it is usable false. */}
      <Modal
        open={dataPanel !== 'closed'}
        label="Your data"
        onClose={() => setDataPanel('closed')}
      >
        {dataPanel === 'confirm' ? (
          <>
            <h2 className="tour__title">Delete everything?</h2>
            <p className="tour__body">
              This removes every attempt, every measurement and every preference from this
              browser. It cannot be undone, and there is no copy anywhere else — nothing of
              yours was ever sent off this device.
            </p>
            <div className="tour__actions">
              <button
                type="button"
                className="button button--bare"
                onClick={() => setDataPanel('open')}
              >
                Go back
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  if (!platform) return;
                  void eraseProgress(platform.store).then(
                    async () => {
                      setDataPanel('closed');
                      await refresh();
                      toast('Everything deleted', 'success');
                    },
                    () => toast('Could not delete your progress', 'error'),
                  );
                }}
              >
                Yes, delete it all
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="tour__title">Your data</h2>
            <p className="tour__body">
              Everything you do here is stored on this device and nowhere else. No account, no
              server, nothing sent anywhere. That also means it is yours to move or remove.
            </p>

            <ul className="datapanel">
              <li>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (!platform) return;
                    void exportProgress(platform.store).then(
                      (name) => toast(`Saved ${name}`, 'success'),
                      () => toast('Could not save your progress', 'error'),
                    );
                  }}
                >
                  Save a copy
                </button>
                <span>Writes everything to a file you keep. Use it to move to another computer.</span>
              </li>
              <li>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (!platform) return;
                    void pickJsonFile().then((file) => {
                      if (!file) return;
                      void importProgress(platform.store, file).then(
                        async () => {
                          setDataPanel('closed');
                          await refresh();
                          toast('Progress loaded', 'success');
                        },
                        (error: Error) => toast(error.message, 'error'),
                      );
                    });
                  }}
                >
                  Load a copy
                </button>
                <span>Reads a saved file back in. This replaces what is on this device.</span>
              </li>
              <li>
                <button
                  type="button"
                  className="button button--bare"
                  onClick={() => setDataPanel('confirm')}
                >
                  Delete everything
                </button>
                <span>Erases it all from this browser. Cannot be undone.</span>
              </li>
            </ul>
          </>
        )}
      </Modal>

      <Palette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
