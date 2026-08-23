// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Angular's lifecycle contract, kept by a harness you can read.
 */

export interface SimpleChange {
  readonly previousValue: JsonLike;
  readonly currentValue: JsonLike;
  readonly firstChange: boolean;
}

export type JsonLike = string | number | boolean | null | undefined;
export type SimpleChanges = Record<string, SimpleChange>;

export interface LifecycleComponent {
  ngOnChanges?(changes: SimpleChanges): void;
  ngOnInit?(): void;
  ngOnDestroy?(): void;
  [input: string]: JsonLike | ((changes: SimpleChanges) => void) | (() => void) | undefined;
}

export function buildChanges(
  previous: Record<string, JsonLike>,
  current: Record<string, JsonLike>,
  first: boolean,
): SimpleChanges {
  const changes: Record<string, SimpleChange> = {};
  for (const key of Object.keys(current)) {
    if (!Object.is(previous[key], current[key])) {
      changes[key] = {
        previousValue: previous[key],
        currentValue: current[key],
        firstChange: first,
      };
    }
  }
  return changes;
}

export class ComponentHarness {
  readonly log: string[] = [];
  #staged: Record<string, JsonLike> = {};
  #current: Record<string, JsonLike> = {};
  #initialized = false;
  #destroyed = false;

  readonly component: LifecycleComponent;

  constructor(component: LifecycleComponent) {
    this.component = component;
  }

  setInput(name: string, value: JsonLike): void {
    this.#staged[name] = value;
  }

  detectChanges(): void {
    if (this.#destroyed) {
      throw new Error('detectChanges on a destroyed view');
    }

    const changes = buildChanges(this.#current, this.#staged, !this.#initialized);
    this.#current = { ...this.#current, ...this.#staged };

    // Inputs land on the component before any hook fires, so this.name is
    // already the new value inside ngOnChanges — same as the framework.
    Object.assign(this.component, this.#staged);
    this.#staged = {};

    if (Object.keys(changes).length > 0 && this.component.ngOnChanges) {
      this.log.push('ngOnChanges');
      this.component.ngOnChanges(changes);
    }

    if (!this.#initialized) {
      this.#initialized = true;
      if (this.component.ngOnInit) {
        this.log.push('ngOnInit');
        this.component.ngOnInit();
      }
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (this.component.ngOnDestroy) {
      this.log.push('ngOnDestroy');
      this.component.ngOnDestroy();
    }
  }
}
