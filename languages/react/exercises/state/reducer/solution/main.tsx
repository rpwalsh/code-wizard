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
  switch (action.type) {
    case 'edit':
      // Editing is how the user answers an error, so the error goes with it.
      return { ...state, value: action.value, dirty: true, error: null };

    case 'submit':
      // A second click while the first save is in flight changes nothing.
      if (state.submitting) return state;
      return { ...state, submitting: true, error: null };

    case 'succeeded':
      return { ...state, submitting: false, dirty: false, error: null };

    case 'failed':
      // dirty stays: the edit still has not reached the server.
      return { ...state, submitting: false, error: action.message };

    default:
      return state;
  }
}

export function canSubmit(state: State): boolean {
  return state.dirty && !state.submitting && state.value.trim() !== '';
}
