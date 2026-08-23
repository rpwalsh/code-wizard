// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The dependency rules of useEffect, as a machine you can test.
 */

export type Deps = readonly unknown[] | undefined;

export function depsChanged(prev: Deps, next: readonly unknown[]): boolean {
  // First render: nothing to compare against, so the effect is due.
  if (prev === undefined) return true;
  if (prev.length !== next.length) return true;

  // Object.is per slot — never a deep comparison. A fresh object literal
  // in the array is a new reference and therefore always "changed".
  return prev.some((dep, index) => !Object.is(dep, next[index]));
}

export class EffectScheduler {
  readonly log: string[] = [];
  #prev: Deps = undefined;
  #due = false;
  #cleanup: (() => void) | undefined;

  render(deps: Deps): void {
    if (deps === undefined) {
      // No array: due after every render.
      this.#due = true;
    } else {
      this.#due = depsChanged(this.#prev, deps);
      this.#prev = deps;
    }
  }

  run(effect: () => (() => void) | undefined): void {
    if (!this.#due) return;
    this.#due = false;

    // The old cleanup runs before the new effect — the pairing that makes
    // re-running safe. Skipping it turns one subscription into two.
    if (this.#cleanup) {
      this.log.push('cleanup');
      this.#cleanup();
    }

    this.log.push('effect');
    this.#cleanup = effect();
  }

  unmount(): void {
    if (this.#cleanup) {
      this.log.push('cleanup');
      this.#cleanup();
      // Clearing is what makes a second unmount a no-op.
      this.#cleanup = undefined;
    }
  }
}

export function describeDeps(deps: Deps): string {
  if (deps === undefined) return 'every render';
  if (deps.length === 0) return 'once';
  return 'when deps change';
}
