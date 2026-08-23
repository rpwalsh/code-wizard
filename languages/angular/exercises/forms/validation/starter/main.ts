// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Validators as pure functions, in the shape Angular's reactive forms expect.
 */

export type Errors = Record<string, unknown> | null;
export type Validator = (value: unknown) => Errors;

export function required(value: unknown): Errors {
  throw new Error('not implemented');
}

export function minLength(length: number): Validator {
  throw new Error('not implemented');
}

export function pattern(expression: RegExp, name: string): Validator {
  throw new Error('not implemented');
}

export function compose(validators: Validator[]): Validator {
  throw new Error('not implemented');
}

export function validateGroup(
  values: Record<string, unknown>,
  rules: Record<string, Validator>,
): { valid: boolean; errors: Record<string, Record<string, unknown>> } {
  throw new Error('not implemented');
}
