// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopChannel, PayloadOf, ResultOf } from '../../web/src/platform/bridge.ts';
import { DESKTOP_CHANNELS } from '../../web/src/platform/bridge.ts';

/**
 * The only capability the renderer is given.
 *
 * Channels are whitelisted from the shared contract rather than passed
 * through, so a compromised or confused renderer can reach exactly these
 * operations and nothing else — not the filesystem, not a process, not an
 * arbitrary IPC channel. Sharing the list with the renderer also means a new
 * channel cannot be called before it has been allowed.
 */
const allowed = new Set<string>(DESKTOP_CHANNELS);

contextBridge.exposeInMainWorld('codeWizardDesktop', {
  invoke<C extends DesktopChannel>(channel: C, payload: PayloadOf<C>): Promise<ResultOf<C>> {
    if (!allowed.has(channel)) {
      return Promise.reject(new Error(`Channel "${channel}" is not available.`));
    }
    return ipcRenderer.invoke(channel, payload) as Promise<ResultOf<C>>;
  },

  // Static, so the renderer can describe the language without a round trip.
  metadata: {
    id: 'python',
    displayName: 'Python',
    editorLanguage: 'python',
    fileExtension: '.py',
    commentPrefix: '#',
  },
});
