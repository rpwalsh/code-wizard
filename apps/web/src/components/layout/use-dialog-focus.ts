// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Keeping focus inside a dialog, and handing it back afterwards.
 *
 * `aria-modal` tells a screen reader that the rest of the page is
 * unavailable. That has to be true for the keyboard as well, or the two
 * disagree: the reader says there is nothing behind the dialog while Tab
 * walks straight into it and starts operating the page underneath.
 *
 * Shared rather than written twice. The modal surface and the command palette
 * are two separate dialog implementations, and a rule enforced in one of them
 * is a rule that will be missing from the other.
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useDialogFocus(surface: RefObject<HTMLElement | null>, open: boolean): void {
  // Whoever had focus gets it back on close. Without this a keyboard user is
  // dropped at the top of the document and has to tab back to where they were
  // every single time they open something.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const element = surface.current;
      if (!element) return;

      // getClientRects rather than offsetParent: a fixed-position ancestor
      // makes offsetParent null for everything inside it, which would filter
      // out every control in the dialog and trap focus on the surface.
      const items = [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (candidate) => candidate.getClientRects().length > 0,
      );

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        // Nothing to land on. Hold the surface rather than letting focus
        // escape to a page the dialog claims is unavailable.
        event.preventDefault();
        element.focus();
        return;
      }

      const active = document.activeElement;
      const inside = active instanceof Node && element.contains(active);

      if (event.shiftKey && (!inside || active === first || active === element)) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [surface, open]);
}
