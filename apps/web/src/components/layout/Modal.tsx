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
