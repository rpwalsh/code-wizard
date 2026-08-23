// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The slot machinery under React's hooks, small enough to hold in your head.
 */

export interface RefBox<T> {
  current: T;
}

interface MemoSlot<T> {
  value: T;
  deps: readonly number[];
}

export class HookSlots {
  // One array, one cursor. A hook's identity is its position in this array.
  #slots: unknown[] = [];
  #cursor = 0;
  #firstRenderCount: number | null = null;

  beginRender(): void {
    this.#cursor = 0;
  }

  useSlot<T>(initial: T): T {
    if (this.#cursor >= this.#slots.length) {
      this.#slots.push(initial);
    }
    const value = this.#slots[this.#cursor] as T;
    this.#cursor += 1;
    return value;
  }

  setSlot<T>(index: number, value: T): void {
    this.#slots[index] = value;
  }

  endRender(): void {
    if (this.#firstRenderCount === null) {
      // The first render defines the contract every later render must keep.
      this.#firstRenderCount = this.#cursor;
      return;
    }
    if (this.#cursor !== this.#firstRenderCount) {
      throw new Error(
        `hook order changed: first render used ${this.#firstRenderCount} hooks, this one used ${this.#cursor}`,
      );
    }
  }

  useRef<T>(initial: T): RefBox<T> {
    // The same object every render; its identity is the entire feature.
    return this.useSlot<RefBox<T>>({ current: initial });
  }

  useMemo<T>(compute: () => T, deps: readonly number[]): T {
    const index = this.#cursor;
    const stored = this.useSlot<MemoSlot<T> | undefined>(undefined);

    const stale =
      stored === undefined || stored.deps.some((dep, i) => !Object.is(dep, deps[i]));

    if (!stale) {
      return (stored as MemoSlot<T>).value;
    }

    const value = compute();
    this.setSlot<MemoSlot<T>>(index, { value, deps });
    return value;
  }
}
