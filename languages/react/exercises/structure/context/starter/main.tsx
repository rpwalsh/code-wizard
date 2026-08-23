// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Context for the far-away value, children for everything else, and an
 * error fallback decided as data.
 */
import { createContext, type ReactNode } from 'react';

export const ThemeContext = createContext('light');

export interface ErrorState {
  readonly error: string | null;
  readonly retries: number;
}

export type ErrorView =
  | { readonly kind: 'content' }
  | { readonly kind: 'fallback'; readonly message: string; readonly canRetry: boolean };

export function Badge({ children }: { children: ReactNode }) {
  return null;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return null;
}

export function errorView(state: ErrorState): ErrorView {
  throw new Error('not implemented');
}

export function StatusPanel({
  state,
  children,
}: {
  state: ErrorState;
  children: ReactNode;
}) {
  return null;
}
