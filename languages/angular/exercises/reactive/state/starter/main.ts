// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
export interface Item {
  readonly id: string;
  readonly name: string;
  /** Whole pence. */
  readonly price: number;
  readonly quantity: number;
}

/** Owns the basket. Nothing outside may change it. */
export class BasketService {
  add(item: Item): void {
    throw new Error('not implemented');
  }

  remove(id: string): void {
    throw new Error('not implemented');
  }

  get items(): readonly Item[] {
    throw new Error('not implemented');
  }

  get total(): number {
    throw new Error('not implemented');
  }

  get isEmpty(): boolean {
    throw new Error('not implemented');
  }
}
