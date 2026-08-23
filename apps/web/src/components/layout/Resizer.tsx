// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A draggable divider between two panels.
 *
 * Three things make this more than an onMouseMove handler:
 *
 * Pointer capture, so a fast drag that outruns the cursor keeps resizing
 * instead of dropping the moment the pointer leaves the four-pixel target.
 *
 * A preview channel separate from the committed value. Dragging writes
 * straight to a CSS custom property on the DOM, so a hundred pointer moves a
 * second cost a hundred style writes rather than a hundred React renders of a
 * tree that contains a code editor. Only the settled width goes through state,
 * which is also the only width worth storing.
 *
 * A keyboard path. `role="separator"` with a value and bounds is the window
 * splitter pattern, and arrow keys move it in steps, so the panel is
 * adjustable without a mouse.
 */
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useRef } from 'react';

interface ResizerProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  /** Width to return to on a double-click. */
  readonly reset: number;
  /** Continuous, during a drag. Write to the DOM here, not to state. */
  readonly onPreview: (width: number) => void;
  /** Once, when the drag or keypress settles. Persist here. */
  readonly onCommit: (width: number) => void;
}

/** One arrow key press. Coarse enough to be useful, fine enough to aim. */
const STEP = 16;

export function Resizer({
  label,
  value,
  min,
  max,
  reset,
  onPreview,
  onCommit,
}: ResizerProps) {
  const from = useRef<{ readonly x: number; readonly width: number } | null>(null);

  const clamp = (width: number): number => Math.min(max, Math.max(min, Math.round(width)));

  const begin = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    from.current = { x: event.clientX, width: value };
    // The columns animate when the focus mode changes, which is right for a
    // mode change and wrong for a drag: an eased transition under a moving
    // pointer reads as lag. Suspending it on the body keeps this out of React.
    document.body.classList.add('is-resizing');
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const origin = from.current;
    if (!origin) return;
    onPreview(clamp(origin.width + (event.clientX - origin.x)));
  };

  const settle = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const origin = from.current;
    if (!origin) return;
    from.current = null;
    document.body.classList.remove('is-resizing');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit(clamp(origin.width + (event.clientX - origin.x)));
  };

  const apply = (width: number): void => {
    const next = clamp(width);
    // Same suspension the drag uses, for one frame. Without it an arrow key
    // starts the eased column transition and the panel drifts to its new
    // width over a third of a second, which feels like lag rather than like
    // a nudge.
    document.body.classList.add('is-resizing');
    onPreview(next);
    onCommit(next);
    requestAnimationFrame(() => document.body.classList.remove('is-resizing'));
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const next =
      event.key === 'ArrowLeft'
        ? value - STEP
        : event.key === 'ArrowRight'
          ? value + STEP
          : event.key === 'Home'
            ? min
            : event.key === 'End'
              ? max
              : null;
    if (next === null) return;
    event.preventDefault();
    apply(next);
  };

  return (
    <div
      className="resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={settle}
      onPointerCancel={settle}
      onDoubleClick={() => apply(reset)}
      onKeyDown={onKeyDown}
    >
      <span className="resizer__grip" aria-hidden="true" />
    </div>
  );
}
