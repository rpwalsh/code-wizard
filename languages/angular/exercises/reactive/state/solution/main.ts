// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
export interface Item {
  readonly id: string;
  readonly name: string;
  /** Whole pence. */
  readonly price: number;
  readonly quantity: number;
}

/**
 * Owns the basket.
 *
 * The field is private and the accessor is read-only, so a component can look
 * at the state and cannot change it. Every mutation replaces the array rather
 * than editing it, which is what an OnPush component's change detection
 * actually compares.
 */
export class BasketService {
  #items: readonly Item[] = [];

  add(item: Item): void {
    this.#items = [...this.#items, item];
  }

  remove(id: string): void {
    this.#items = this.#items.filter((item) => item.id !== id);
  }

  get items(): readonly Item[] {
    return this.#items;
  }

  /** Derived on read. There is no second copy to fall out of step. */
  get total(): number {
    return this.#items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get isEmpty(): boolean {
    return this.#items.length === 0;
  }
}
