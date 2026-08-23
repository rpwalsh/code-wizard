// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Context for the far-away value, children for everything else, and an
 * error fallback decided as data.
 */
import { createContext, useContext, type ReactNode } from 'react';

// The default is what a reader sees with no provider above it — tests and
// extracted components meet exactly that case.
export const ThemeContext = createContext('light');

export interface ErrorState {
  readonly error: string | null;
  readonly retries: number;
}

export type ErrorView =
  | { readonly kind: 'content' }
  | { readonly kind: 'fallback'; readonly message: string; readonly canRetry: boolean };

export function Badge({ children }: { children: ReactNode }) {
  const theme = useContext(ThemeContext);
  // Children pass through uninspected — that refusal is what makes this
  // wrap anything.
  return <span className={`badge ${theme}`}>{children}</span>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="body">{children}</div>
    </section>
  );
}

export function errorView(state: ErrorState): ErrorView {
  if (state.error === null) return { kind: 'content' };
  return { kind: 'fallback', message: state.error, canRetry: state.retries < 3 };
}

export function StatusPanel({
  state,
  children,
}: {
  state: ErrorState;
  children: ReactNode;
}) {
  const view = errorView(state);
  if (view.kind === 'content') {
    return <Panel title="Status">{children}</Panel>;
  }
  return (
    <div className="fallback">
      <p>{view.message}</p>
      {view.canRetry && <button>Retry</button>}
    </div>
  );
}
