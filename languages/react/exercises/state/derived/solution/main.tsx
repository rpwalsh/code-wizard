// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
export interface Item {
  readonly id: string;
  readonly name: string;
  /** Whole pence, so nothing here is ever a floating-point number. */
  readonly price: number;
  readonly quantity: number;
}

/** A new array. The one passed in is left exactly as it was. */
export function addItem(items: readonly Item[], item: Item): readonly Item[] {
  return [...items, item];
}

export function removeItem(items: readonly Item[], id: string): readonly Item[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Not state, and deliberately so: a value that is always computed from the
 * items cannot fall out of step with them.
 */
export function total(items: readonly Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function Basket({ items }: { items: readonly Item[] }) {
  if (items.length === 0) return <p>Basket is empty</p>;

  return (
    <div>
      <ul>
        {items.map((item) => (
          // Keyed by id, not by index: an index key attaches state and focus
          // to a position rather than to a row, which goes wrong the moment
          // anything is removed or reordered.
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <p>Total: {total(items)}p</p>
    </div>
  );
}
