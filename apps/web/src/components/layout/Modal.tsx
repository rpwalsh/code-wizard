// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * One dialog surface for everything that floats.
 *
 * Backdrop, Escape, click-outside and focus containment live here once, so
 * a feature that needs a dialog brings only its content. The alternative —
 * each overlay hand-rolling its own dismissal rules — is how an app ends up
 * with three popups that all close differently.
 */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { useDialogFocus } from './use-dialog-focus.ts';

interface ModalProps {
  readonly open: boolean;
  readonly label: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** Wide for pickers and palettes; narrow for confirmations. */
  readonly size?: 'narrow' | 'wide' | 'full';
}

export function Modal({ open, label, onClose, children, size = 'narrow' }: ModalProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Containment and restoration. The file comment above has claimed these
  // lived here since it was written; until this hook they did not.
  //
  // Before the focus effect below, deliberately: effects run in the order
  // they are declared, so this has to record who opened the dialog while that
  // is still the answer. After it, the opener it remembers is the dialog.
  useDialogFocus(surfaceRef, open);

  // Focus moves into the dialog when it opens, or a keyboard user is left
  // tabbing the page underneath it.
  useEffect(() => {
    if (open) surfaceRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={surfaceRef}
        className="modal__surface"
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
