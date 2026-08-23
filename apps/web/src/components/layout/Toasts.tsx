// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Snackbars, in the shape every component library converges on: a provider
 * at the root, a hook anywhere below it, and a stack that draws itself in
 * one corner and cleans up after itself.
 *
 * Deliberately small. A toast here is a sentence and a tone — no actions,
 * no progress bars, no queueing policy beyond "newest at the bottom" —
 * because anything that needs more than a sentence deserves layout, not a
 * popup that leaves in four seconds.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

interface ToastApi {
  readonly toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => undefined });

const TOAST_MS = 4000;

export function useToasts(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, TOAST_MS);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* aria-live polite: announced by a screen reader, never interrupting. */}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((entry) => (
          <div key={entry.id} className="toast" data-tone={entry.tone}>
            {entry.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
