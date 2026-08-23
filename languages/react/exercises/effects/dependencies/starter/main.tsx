// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The dependency rules of useEffect, as a machine you can test.
 */

export type Deps = readonly unknown[] | undefined;

export function depsChanged(prev: Deps, next: readonly unknown[]): boolean {
  throw new Error('not implemented');
}

export class EffectScheduler {
  readonly log: string[] = [];

  render(deps: Deps): void {
    throw new Error('not implemented');
  }

  run(effect: () => (() => void) | undefined): void {
    throw new Error('not implemented');
  }

  unmount(): void {
    throw new Error('not implemented');
  }
}

export function describeDeps(deps: Deps): string {
  throw new Error('not implemented');
}
