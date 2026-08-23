// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Validators as pure functions, in the shape Angular's reactive forms expect.
 */

export type Errors = Record<string, unknown> | null;
export type Validator = (value: unknown) => Errors;

/**
 * Whether there is nothing here to check.
 *
 * Every validator except `required` defers to this, so an untouched field
 * shows one message rather than every message at once.
 */
function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === 'string' && value.trim() === '';
}

export function required(value: unknown): Errors {
  return isBlank(value) ? { required: true } : null;
}

export function minLength(length: number): Validator {
  return (value) => {
    if (isBlank(value)) return null;

    const actualLength = String(value).length;
    if (actualLength >= length) return null;
    return { minLength: { requiredLength: length, actualLength } };
  };
}

export function pattern(expression: RegExp, name: string): Validator {
  return (value) => {
    if (isBlank(value)) return null;
    return expression.test(String(value)) ? null : { pattern: name };
  };
}

export function compose(validators: Validator[]): Validator {
  return (value) => {
    const found = validators
      .map((validator) => validator(value))
      .filter((errors): errors is Record<string, unknown> => errors !== null);

    // An empty object would read as a failure, so nothing found means null.
    if (found.length === 0) return null;
    return Object.assign({}, ...found);
  };
}

export function validateGroup(
  values: Record<string, unknown>,
  rules: Record<string, Validator>,
): { valid: boolean; errors: Record<string, Record<string, unknown>> } {
  const errors: Record<string, Record<string, unknown>> = {};

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(values[field]);
    if (result !== null) errors[field] = result;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
