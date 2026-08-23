// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The slot machinery under React's hooks, small enough to hold in your head.
 */

export interface RefBox<T> {
  current: T;
}

export class HookSlots {
  beginRender(): void {
    throw new Error('not implemented');
  }

  useSlot<T>(initial: T): T {
    throw new Error('not implemented');
  }

  setSlot<T>(index: number, value: T): void {
    throw new Error('not implemented');
  }

  endRender(): void {
    throw new Error('not implemented');
  }

  useRef<T>(initial: T): RefBox<T> {
    throw new Error('not implemented');
  }

  useMemo<T>(compute: () => T, deps: readonly number[]): T {
    throw new Error('not implemented');
  }
}
