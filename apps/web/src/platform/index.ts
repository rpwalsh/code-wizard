import type { Platform, PlatformProgress } from './types.ts';
import { createWebPlatform } from './web.ts';

export type { Platform, PlatformProgress } from './types.ts';

/** Injected by Electron's preload script; absent in a browser. */
declare global {
  interface Window {
    forgeDesktop?: unknown;
  }
}

/**
 * Choose how this copy of Forge talks to the machine.
 *
 * Detection is a capability check rather than a user-agent sniff: the desktop
 * build announces itself by injecting a bridge, and everything else is the web.
 */
export async function createPlatform(
  report: (progress: PlatformProgress) => void = () => {},
): Promise<Platform> {
  if (typeof window !== 'undefined' && window.forgeDesktop) {
    const { createDesktopPlatform } = await import('./desktop.ts');
    return createDesktopPlatform(report);
  }
  return createWebPlatform(report);
}
