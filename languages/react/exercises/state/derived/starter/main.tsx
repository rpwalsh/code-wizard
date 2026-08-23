// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** A basket. Nothing here is implemented yet. */

export interface Item {
  readonly id: string;
  readonly name: string;
  /** Whole pence, so nothing here is ever a floating-point number. */
  readonly price: number;
  readonly quantity: number;
}

export function addItem(items: readonly Item[], item: Item): readonly Item[] {
  throw new Error('not implemented');
}

export function removeItem(items: readonly Item[], id: string): readonly Item[] {
  throw new Error('not implemented');
}

export function total(items: readonly Item[]): number {
  throw new Error('not implemented');
}

export function Basket({ items }: { items: readonly Item[] }) {
  throw new Error('not implemented');
}
