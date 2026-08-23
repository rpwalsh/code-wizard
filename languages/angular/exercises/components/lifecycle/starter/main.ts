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
  throw new Error('not implemented');
}

export class ComponentHarness {
  readonly log: string[] = [];

  readonly component: LifecycleComponent;

  constructor(component: LifecycleComponent) {
    this.component = component;
  }

  setInput(name: string, value: JsonLike): void {
    throw new Error('not implemented');
  }

  detectChanges(): void {
    throw new Error('not implemented');
  }

  destroy(): void {
    throw new Error('not implemented');
  }
}
