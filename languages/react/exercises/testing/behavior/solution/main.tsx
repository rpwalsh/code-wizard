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
  let current: SearchState = { query: '', status: 'idle', results: [] };

  return {
    getState: () => current,
    actions: {
      typed(query) {
        current =
          query === ''
            ? { query, status: 'idle', results: [] }
            // Old results stay visible while the new search runs — the
            // list dims, it does not flicker empty.
            : { query, status: 'searching', results: current.results };
      },
      resolved(results) {
        // The race guard: a response landing after the user cleared the
        // box must not resurrect an idle screen.
        if (current.status !== 'searching') return;
        current = { ...current, status: 'done', results };
      },
      failed() {
        if (current.status !== 'searching') return;
        current = { ...current, status: 'failed', results: [] };
      },
    },
  };
}

export async function search(
  fetcher: (query: string) => Promise<readonly string[]>,
  query: string,
): Promise<SearchOutcome> {
  try {
    return { ok: true, results: await fetcher(query) };
  } catch {
    return { ok: false };
  }
}

export function ResultList({ state }: { state: SearchState }) {
  if (state.status === 'idle') return <p className="hint">Type to search</p>;
  if (state.status === 'failed') return <p className="error">Search failed</p>;

  if (state.status === 'searching') {
    return (
      <ul className="results dim">
        {state.results.map((result) => (
          <li key={result}>{result}</li>
        ))}
      </ul>
    );
  }

  if (state.results.length === 0) return <p className="hint">No matches</p>;

  return (
    <ul className="results">
      {state.results.map((result) => (
        <li key={result}>{result}</li>
      ))}
    </ul>
  );
}
