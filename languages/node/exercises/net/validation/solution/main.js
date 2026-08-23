// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The boundary: unknown input in, known data or a list of complaints out.
 */

const PRIORITIES = ['low', 'normal', 'high'];
const NOTES_LIMIT = 200;

export function validateOrder(body) {
  const errors = [];
  const value = {};

  // Field order is part of the contract: a caller showing the first error
  // beside the first empty box needs the order to match the form.

  // customer -----------------------------------------------------------
  if (!('customer' in body)) {
    errors.push('customer: is required');
  } else if (typeof body.customer !== 'string') {
    errors.push('customer: must be a string');
  } else if (body.customer.trim() === '') {
    errors.push('customer: must not be empty');
  } else {
    value.customer = body.customer.trim();
  }

  // quantity -----------------------------------------------------------
  if (!('quantity' in body)) {
    errors.push('quantity: is required');
  } else if (!Number.isInteger(body.quantity)) {
    // Deliberately not parseInt or Number(): isInteger refuses "3", NaN,
    // Infinity and 3.5, which is every wrong shape this field can take.
    errors.push('quantity: must be an integer');
  } else if (body.quantity < 1) {
    errors.push('quantity: must be at least 1');
  } else {
    value.quantity = body.quantity;
  }

  // priority — optional with a default, so it always has a value after ---
  if (!('priority' in body)) {
    value.priority = 'normal';
  } else if (!PRIORITIES.includes(body.priority)) {
    errors.push(`priority: must be one of ${PRIORITIES.join(', ')}`);
  } else {
    value.priority = body.priority;
  }

  // notes — optional and absent, so the key simply does not appear -------
  if ('notes' in body) {
    if (typeof body.notes !== 'string') {
      errors.push('notes: must be a string');
    } else if (body.notes.length > NOTES_LIMIT) {
      errors.push(`notes: must be ${NOTES_LIMIT} characters or fewer`);
    } else {
      value.notes = body.notes;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value };
}

export function firstProblem(result) {
  if (result.ok) return null;
  return result.errors[0];
}
