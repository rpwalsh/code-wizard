// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Putting a thing somewhere: by dragging it, or by clicking twice.
 *
 * Sorting into buckets and hanging nodes off a tree are the same interaction
 * wearing different clothes — pick up an item, choose a destination — so they
 * share one implementation rather than two that drift.
 *
 * Two routes to the same result, on purpose:
 *
 * Dragging is what someone with a mouse will try first, and for a spatial
 * question ("which column does this belong in") the spatial gesture is closer
 * to the idea than any control could be.
 *
 * Click-to-place — click the item, then click where it goes — is the same
 * operation in two steps. It works from the keyboard with no extra code,
 * because both halves are ordinary buttons, and it is also the better
 * interaction on a trackpad, where holding a click while traveling across a
 * card is genuinely awkward.
 *
 * Targets are found with `elementFromPoint` and a `data-drop-id` attribute
 * rather than by measuring rectangles: the browser already knows what is under
 * the pointer, including when the layout has wrapped, scrolled, or reflowed
 * mid-drag.
 */
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRef, useState } from 'react';

export interface Placement {
  /** The item being dragged or held, or null. */
  readonly active: string | null;
  /** True when `active` is held from a click rather than a drag in progress. */
  readonly held: boolean;
  /** The drop target currently under the pointer, or null. */
  readonly over: string | null;
  /** Spread onto a draggable item. */
  readonly source: (id: string) => {
    readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerCancel: () => void;
  };
  /** Called when a target is clicked, to place whatever is held. */
  readonly placeInto: (target: string) => void;
  /** Drop the held item without placing it. */
  readonly cancel: () => void;
}

const THRESHOLD = 5;

export function usePlacement(
  onPlace: (item: string, target: string) => void,
  enabled = true,
): Placement {
  const [active, setActive] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const [over, setOver] = useState<string | null>(null);
  const start = useRef<{ readonly id: string; readonly x: number; readonly y: number } | null>(
    null,
  );
  const moved = useRef(false);

  const clear = (): void => {
    start.current = null;
    moved.current = false;
    setActive(null);
    setHeld(false);
    setOver(null);
  };

  const targetAt = (x: number, y: number): string | null => {
    const element = document.elementFromPoint(x, y);
    return element?.closest('[data-drop-id]')?.getAttribute('data-drop-id') ?? null;
  };

  const source = (id: string) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>): void => {
      if (!enabled || event.button !== 0) return;
      start.current = { id, x: event.clientX, y: event.clientY };
      moved.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },

    onPointerMove: (event: ReactPointerEvent<HTMLElement>): void => {
      const from = start.current;
      if (!from) return;
      const traveled = Math.hypot(event.clientX - from.x, event.clientY - from.y);
      if (!moved.current && traveled < THRESHOLD) return;

      moved.current = true;
      setActive(from.id);
      setHeld(false);
      // The capturing element receives every move, so the element under the
      // pointer has to be asked for rather than inferred from the event.
      setOver(targetAt(event.clientX, event.clientY));
    },

    onPointerUp: (event: ReactPointerEvent<HTMLElement>): void => {
      const from = start.current;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (!from) return;

      if (moved.current) {
        const target = targetAt(event.clientX, event.clientY);
        if (target) onPlace(from.id, target);
        clear();
        return;
      }

      // A click, not a drag: pick the item up, or put down the one already
      // held if the same item is clicked twice.
      start.current = null;
      setOver(null);
      setActive((current) => (current === from.id && held ? null : from.id));
      setHeld((current) => !(current && active === from.id));
    },

    onPointerCancel: (): void => clear(),
  });

  const placeInto = (target: string): void => {
    if (!enabled || active === null) return;
    onPlace(active, target);
    clear();
  };

  return { active, held, over, source, placeInto, cancel: clear };
}
