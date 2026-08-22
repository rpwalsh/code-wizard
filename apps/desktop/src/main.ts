import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { ContentBundle } from '@forge/exercises';
import { ExerciseCatalog, parseBundle, toBundle } from '@forge/exercises';
import { PythonRuntime, pythonExercisesDir, pythonSkills } from '@forge/python';
import { SqliteProgressStore } from '@forge/storage/sqlite';
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
const runtime = new PythonRuntime();
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
  const report = await ExerciseCatalog.load([pythonExercisesDir]);

  if (report.catalog.size > 0) {
    if (report.failures.length > 0) {
      // Loud, but not fatal: an author with one broken exercise should still
      // be able to open the app and read the error.
      console.error(
        `${report.failures.length} exercise(s) failed to load:\n` +
          report.failures.map((failure) => `  ${failure.directory}: ${failure.message}`).join('\n'),
      );
    }
    return toBundle(report.catalog.all(), [...pythonSkills], {
      relativise: (directory) => path.relative(repositoryRoot, directory),
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

  handle('runtime:doctor', () => runtime.doctor());
  handle('runtime:execute', (request) => runtime.execute(request));
  handle('runtime:test', (request) => runtime.test(request));
  handle('runtime:format', (request) => runtime.format(request));
  handle('runtime:lint', (request) => runtime.lint(request));
  handle('runtime:diagnose', (request) => runtime.diagnose(request));

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
    title: 'Forge',
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

  const devServer = process.env.FORGE_DEV_SERVER;
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
