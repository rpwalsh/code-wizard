// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { DesktopBridge } from './bridge.ts';
import type { Platform, PlatformProgress } from './types.ts';
import { createWebPlatform } from './web.ts';

export type { Platform, PlatformProgress } from './types.ts';

/** Injected by Electron's preload script; absent in a browser. */
declare global {
  interface Window {
    codeWizardDesktop?: DesktopBridge;
    /** Set once the platform exists. Read by the browser tests. */
    __retrainerPlatform?: Platform;
  }
}

/**
 * Choose how this copy of Code Wizard talks to the machine.
 *
 * Detection is a capability check rather than a user-agent sniff: the desktop
 * build announces itself by injecting a bridge, and everything else is the web.
 */
export async function createPlatform(
  report: (progress: PlatformProgress) => void = () => {},
): Promise<Platform> {
  const platform =
    typeof window !== 'undefined' && window.codeWizardDesktop
      ? await (await import('./desktop.ts')).createDesktopPlatform(report)
      : await createWebPlatform(report);

  /*
   * Exposed for the browser tests, and only there.
   *
   * The runtimes are the load-bearing part of this build and the hardest to
   * test through the interface: driving a timeout or a module-graph import
   * through clicks would test the UI's rendering of a runtime rather than the
   * runtime. A test that reaches the object directly stays true if the screens
   * are rebuilt tomorrow.
   *
   * It is a read-only handle to something the page already holds, so it grants
   * nothing that inspecting the app's own state would not.
   */
  if (typeof window !== 'undefined') window.__retrainerPlatform = platform;

  return platform;
}
