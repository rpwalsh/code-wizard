// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Dragging for a reorderable list, without giving up the keyboard.
 *
 * The arrow buttons stay. That is not a hedge: dragging is unusable without a
 * pointer, awkward on a trackpad, and impossible for anyone driving the page
 * from a keyboard or a screen reader. What dragging adds is directness — for
 * someone who has a mouse, hauling a line where it goes is faster and reads
 * as more physical than clicking an arrow four times. Both paths write through
 * the same `move`, so there is one notion of what happened and nothing to keep
 * in step.
 *
 * Pointer events rather than HTML5 drag and drop: the native API cannot style
 * its drag image, does not fire on touch without a polyfill, and carries a
 * data-transfer model designed for dragging between windows, which is not what
 * this is.
 */
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRef, useState } from 'react';

export interface DragList {
  /** Index currently being dragged, or null. */
  readonly dragging: number | null;
  /** Index the dragged item would land on, or null. */
  readonly over: number | null;
  readonly handlers: (position: number) => {
    readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
}

/** How far a pointer must travel before this counts as a drag and not a click. */
const THRESHOLD = 4;

export function useDragList(
  count: number,
  move: (from: number, to: number) => void,
  enabled = true,
): DragList {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const origin = useRef<{ readonly y: number; readonly height: number } | null>(null);

  const reset = (): void => {
    origin.current = null;
    setDragging(null);
    setOver(null);
  };

  const handlers = (position: number) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>): void => {
      if (!enabled || event.button !== 0) return;
      const box = event.currentTarget.getBoundingClientRect();
      origin.current = { y: event.clientY, height: box.height || 1 };
      event.currentTarget.setPointerCapture(event.pointerId);
    },

    onPointerMove: (event: ReactPointerEvent<HTMLElement>): void => {
      const from = origin.current;
      if (!from) return;

      const traveled = event.clientY - from.y;
      if (dragging === null) {
        if (Math.abs(traveled) < THRESHOLD) return;
        setDragging(position);
      }

      // Rows are uniform here, so the landing index is the travel distance in
      // row heights. Measuring every sibling would be more general and would
      // buy nothing for a list of eight equal lines.
      const shift = Math.round(traveled / from.height);
      const target = Math.min(count - 1, Math.max(0, position + shift));
      setOver(target);
    },

    onPointerUp: (event: ReactPointerEvent<HTMLElement>): void => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (dragging !== null && over !== null && over !== dragging) move(dragging, over);
      reset();
    },

    onPointerCancel: (): void => reset(),
  });

  return { dragging, over, handlers };
}
