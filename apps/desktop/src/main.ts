// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { LanguageRuntime, Skill } from '@code-wizard/core';
import type { ContentBundle } from '@code-wizard/exercises';
import { ExerciseCatalog, parseBundle, toBundle } from '@code-wizard/exercises';
import { PythonRuntime, pythonExercisesDir, pythonSkills } from '@code-wizard/python';
import * as angular from '@code-wizard/lang-angular';
import * as aspnet from '@code-wizard/lang-aspnet';
import * as c from '@code-wizard/lang-c';
import * as cpp from '@code-wizard/lang-cpp';
import * as csharp from '@code-wizard/lang-csharp';
import * as go from '@code-wizard/lang-go';
import * as javascript from '@code-wizard/javascript';
import * as node from '@code-wizard/lang-node';
import * as php from '@code-wizard/lang-php';
import * as react from '@code-wizard/lang-react';
import * as rust from '@code-wizard/lang-rust';
import * as sql from '@code-wizard/lang-sql';
import * as typescript from '@code-wizard/lang-typescript';
import { SqliteProgressStore } from '@code-wizard/storage/sqlite';
import { app, BrowserWindow, ipcMain, shell } from 'electron';

import type { DesktopChannel, PayloadOf, ResultOf } from '../../web/src/platform/bridge.ts';
import { readFile } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..', '..');

/**
 * The desktop main process.
 *
 * It owns the two things the renderer must never touch: the real Python
 * interpreter and the progress database. The renderer is a browser window
 * holding the learner's work, and learner code is arbitrary code — running it
 * there would put the two in the same place.
 */
/**
 * Every language this build can run.
 *
 * The desktop app is the one that reaches a real toolchain, so unlike the
 * browser it carries all fourteen. A language missing its compiler is not a
 * missing entry here — it is an entry whose `doctor()` reports what to
 * install, which is the difference between "we do not support Rust" and
 * "rustc is not on this machine".
 */
const LANGUAGES: readonly {
  readonly runtime: LanguageRuntime;
  readonly exercisesDir: string;
  readonly skills: readonly Skill[];
}[] = [
  { runtime: new PythonRuntime(), exercisesDir: pythonExercisesDir, skills: [...pythonSkills] },
  {
    runtime: new javascript.JavaScriptRuntime(),
    exercisesDir: javascript.exercisesDir,
    skills: [...javascript.javascriptSkills],
  },
  {
    runtime: typescript.createTypeScriptRuntime(),
    exercisesDir: typescript.exercisesDir,
    skills: [...typescript.typescriptSkills],
  },
  {
    runtime: react.createReactRuntime(),
    exercisesDir: react.exercisesDir,
    skills: [...react.reactSkills],
  },
  {
    runtime: angular.createAngularRuntime(),
    exercisesDir: angular.exercisesDir,
    skills: [...angular.angularSkills],
  },
  {
    runtime: node.createNodeRuntime(),
    exercisesDir: node.exercisesDir,
    skills: [...node.nodeSkills],
  },
  { runtime: sql.createSqlRuntime(), exercisesDir: sql.exercisesDir, skills: [...sql.sqlSkills] },
  { runtime: go.createGoRuntime(), exercisesDir: go.exercisesDir, skills: [...go.goSkills] },
  {
    runtime: rust.createRustRuntime(),
    exercisesDir: rust.exercisesDir,
    skills: [...rust.rustSkills],
  },
  { runtime: c.createCRuntime(), exercisesDir: c.exercisesDir, skills: [...c.cSkills] },
  { runtime: cpp.createCppRuntime(), exercisesDir: cpp.exercisesDir, skills: [...cpp.cppSkills] },
  {
    runtime: csharp.createCSharpRuntime(),
    exercisesDir: csharp.exercisesDir,
    skills: [...csharp.csharpSkills],
  },
  {
    runtime: aspnet.createAspNetRuntime(),
    exercisesDir: aspnet.exercisesDir,
    skills: [...aspnet.aspnetSkills],
  },
  { runtime: php.createPhpRuntime(), exercisesDir: php.exercisesDir, skills: [...php.phpSkills] },
];

const runtimes = new Map<string, LanguageRuntime>(
  LANGUAGES.map((entry) => [entry.runtime.metadata().id, entry.runtime]),
);

/** The runtime for one request, or a refusal naming the language. */
function runtimeFor(language: string): LanguageRuntime {
  const found = runtimes.get(language);
  if (!found) {
    throw new Error(`No runtime registered for ${language}.`);
  }
  return found;
}

let store: SqliteProgressStore | null = null;

function progressStore(): SqliteProgressStore {
  store ??= SqliteProgressStore.open({
    location: path.join(app.getPath('userData'), 'progress.db'),
  });
  return store;
}

/**
 * Load the curriculum.
 *
 * Directories first, when they are present: the desktop app is also the
 * authoring tool, and an author editing an exercise should see it on restart
 * without a build step. A packaged app has no source tree, so it falls back to
 * the bundle the web build already produces.
 */
async function loadBundle(): Promise<ContentBundle> {
  const report = await ExerciseCatalog.load(LANGUAGES.map((entry) => entry.exercisesDir));

  if (report.catalog.size > 0) {
    if (report.failures.length > 0) {
      // Loud, but not fatal: an author with one broken exercise should still
      // be able to open the app and read the error.
      console.error(
        `${report.failures.length} exercise(s) failed to load:\n` +
          report.failures.map((failure) => `  ${failure.directory}: ${failure.message}`).join('\n'),
      );
    }
    return toBundle(report.catalog.all(), LANGUAGES.flatMap((entry) => entry.skills), {
      relativize: (directory) => path.relative(repositoryRoot, directory),
    });
  }

  const bundlePath = path.join(here, '..', 'content', 'catalog.json');
  return parseBundle(await readFile(bundlePath, 'utf8'));
}

/**
 * Register one IPC handler against the shared channel contract.
 *
 * The channel decides both the payload and the result type, so a handler that
 * disagrees with what the renderer sends does not compile.
 */
function handle<C extends DesktopChannel>(
  channel: C,
  body: (payload: PayloadOf<C>) => Promise<ResultOf<C>> | ResultOf<C>,
): void {
  ipcMain.handle(channel, async (_event, payload: PayloadOf<C>) => body(payload));
}

function registerHandlers(): void {
  handle('content:bundle', loadBundle);

  handle('runtime:languages', () => LANGUAGES.map((entry) => entry.runtime.metadata()));

  // Every call names its language: fourteen runtimes behind one channel each,
  // and no guessing about which one a request meant.
  handle('runtime:doctor', ({ language }) => runtimeFor(language).doctor());
  handle('runtime:execute', ({ language, request }) => runtimeFor(language).execute(request));
  handle('runtime:test', ({ language, request }) => runtimeFor(language).test(request));
  handle('runtime:format', ({ language, request }) => runtimeFor(language).format(request));
  handle('runtime:lint', ({ language, request }) => runtimeFor(language).lint(request));
  handle('runtime:diagnose', ({ language, request }) => runtimeFor(language).diagnose(request));

  handle('store:getSetting', (key) => progressStore().getSetting(key));
  handle('store:setSetting', ({ key, value }) => progressStore().setSetting(key, value));

  handle('store:getMastery', (skillId) => progressStore().getMastery(skillId));
  // Maps do not survive structured clone across every Electron version, so the
  // bridge carries entries and the renderer rebuilds the map.
  handle('store:allMastery', async () => [...(await progressStore().allMastery())]);
  handle('store:saveMastery', (mastery) => progressStore().saveMastery(mastery));

  handle('store:allReviews', async () => [...(await progressStore().allReviews())]);
  handle('store:saveReview', (review) => progressStore().saveReview(review));
  handle('store:dueReviews', (at) => progressStore().dueReviews(new Date(at)));

  handle('store:getAttempt', (id) => progressStore().getAttempt(id));
  handle('store:attemptsFor', (exerciseId) => progressStore().attemptsFor(exerciseId));
  handle('store:allAttempts', () => progressStore().allAttempts());
  handle('store:saveAttempt', (attempt) => progressStore().saveAttempt(attempt));
  handle('store:countAttempts', () => progressStore().countAttempts());
  handle('store:exportAll', () => progressStore().exportAll());
  handle('store:importAll', (snapshot) => progressStore().importAll(snapshot));
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1115',
    title: 'Code Wizard',
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      // The renderer gets no Node, an isolated context, and a sandbox. Its
      // only capability is the narrow bridge the preload chooses to expose.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });

  // Nothing in this app should navigate anywhere. Links open in the real
  // browser; navigation attempts are refused rather than followed.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event) => event.preventDefault());

  const devServer = process.env.CODE_RETRAINER_DEV_SERVER;
  if (devServer) {
    void window.loadURL(devServer);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadURL(pathToFileURL(path.join(here, '..', 'renderer', 'index.html')).href);
  }

  return window;
}

void app.whenReady().then(() => {
  registerHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Close the database explicitly so WAL is checkpointed rather than left for
  // the next launch to recover.
  void store?.close();
});
