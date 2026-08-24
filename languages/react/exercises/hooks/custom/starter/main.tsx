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
  throw new Error('not implemented');
}

export function fetchReducer<T>(
  state: FetchState<T>,
  action: FetchAction<T>,
  currentRequestId: number,
): FetchState<T> {
  throw new Error('not implemented');
}

export function shouldRefetch(previous: string[], next: string[]): boolean {
  throw new Error('not implemented');
}

export function selectRetryDelay(attempt: number, base: number, ceiling: number): number {
  throw new Error('not implemented');
}
