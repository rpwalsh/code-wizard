// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * One reducer for a small form. The state is four fields that have to agree.
 */

export type State = {
  value: string;
  submitting: boolean;
  error: string | null;
  dirty: boolean;
};

export type Action =
  | { type: 'edit'; value: string }
  | { type: 'submit' }
  | { type: 'succeeded' }
  | { type: 'failed'; message: string }
  | { type: 'unknown' };

export const initialState: State = {
  value: '',
  submitting: false,
  error: null,
  dirty: false,
};

export function reducer(state: State, action: Action): State {
  throw new Error('not implemented');
}

export function canSubmit(state: State): boolean {
  throw new Error('not implemented');
}
