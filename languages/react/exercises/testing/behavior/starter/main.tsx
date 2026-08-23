// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A search box split for testability: a machine, an async edge, a view.
 */

export type SearchStatus = 'idle' | 'searching' | 'done' | 'failed';

export interface SearchState {
  readonly query: string;
  readonly status: SearchStatus;
  readonly results: readonly string[];
}

export type SearchOutcome =
  | { readonly ok: true; readonly results: readonly string[] }
  | { readonly ok: false };

export function searchMachine(): {
  getState: () => SearchState;
  actions: {
    typed: (query: string) => void;
    resolved: (results: readonly string[]) => void;
    failed: () => void;
  };
} {
  throw new Error('not implemented');
}

export async function search(
  fetcher: (query: string) => Promise<readonly string[]>,
  query: string,
): Promise<SearchOutcome> {
  throw new Error('not implemented');
}

export function ResultList({ state }: { state: SearchState }) {
  return null;
}
