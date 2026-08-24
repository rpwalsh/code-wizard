// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The logic inside a custom hook, extracted so it can be tested without one.
 */

export type Status = 'idle' | 'loading' | 'ready' | 'failed';

export type FetchState<T> = {
  status: Status;
  data: T | null;
  error: string | null;
};

export type FetchAction<T> =
  | { type: 'start' }
  | { type: 'resolved'; data: T; requestId: number }
  | { type: 'rejected'; error: string; requestId: number };

export function initialState<T>(): FetchState<T> {
  return { status: 'idle', data: null, error: null };
}

export function fetchReducer<T>(
  state: FetchState<T>,
  action: FetchAction<T>,
  currentRequestId: number,
): FetchState<T> {
  switch (action.type) {
    case 'start':
      // The previous data is kept while reloading, so a refresh does not
      // blank the screen it is refreshing.
      return { status: 'loading', data: state.data, error: null };

    case 'resolved':
      // An answer to a request that has been superseded is discarded. This
      // is the stale-response bug, and in a hook it is the whole reason the
      // request id exists.
      if (action.requestId !== currentRequestId) return state;
      return { status: 'ready', data: action.data, error: null };

    case 'rejected':
      if (action.requestId !== currentRequestId) return state;
      return { status: 'failed', data: state.data, error: action.error };
  }
}

export function shouldRefetch(previous: string[], next: string[]): boolean {
  // Compared by value, because a dependency array is rebuilt every render
  // and comparing it by identity would refetch on every single one.
  if (previous.length !== next.length) return true;
  return previous.some((value, index) => value !== next[index]);
}

export function selectRetryDelay(attempt: number, base: number, ceiling: number): number {
  if (attempt < 1) return 0;
  // Doubling, capped. Uncapped it reaches days on the eighth attempt, which
  // is indistinguishable from having given up.
  return Math.min(ceiling, base * 2 ** (attempt - 1));
}
