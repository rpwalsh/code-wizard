// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Blank values, missing fields and the empty cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { compose, minLength, pattern, required, validateGroup } from '../main.ts';

test(
  'a blank value is not a length error',
  () => {
    // required owns emptiness; showing two messages for one mistake is the bug.
    expectEqual(minLength(3)(''), null);
    expectEqual(minLength(3)(null), null);
    expectEqual(minLength(3)(undefined), null);
  },
  { concept: 'angular.forms.reactive' },
);

test(
  'a blank value is not a pattern error either',
  () => {
    expectEqual(pattern(/@/, 'email')(''), null);
  },
  { concept: 'angular.forms.reactive' },
);

test(
  'an empty field reports only that it is required',
  () => {
    const validator = compose([required, minLength(5), pattern(/@/, 'email')]);
    expectEqual(validator(''), { required: true });
  },
  { concept: 'angular.forms.validation' },
);

test(
  'composing nothing accepts everything',
  () => {
    expectEqual(compose([])('anything'), null);
    expectEqual(compose([])(''), null);
  },
  { concept: 'angular.forms.validation' },
);

test(
  'a rule for a field that was never supplied still runs',
  () => {
    const result = validateGroup({}, { name: required });
    expectEqual(result.valid, false);
    expectEqual(result.errors, { name: { required: true } });
  },
  { concept: 'angular.forms.reactive' },
);

test(
  'a group with no rules is valid and reports nothing',
  () => {
    expectEqual(validateGroup({ anything: 1 }, {}), { valid: true, errors: {} });
  },
  { concept: 'angular.forms.reactive' },
);

test(
  'a number is measured by its written length',
  () => {
    expectEqual(minLength(3)(42), { minLength: { requiredLength: 3, actualLength: 2 } });
    expectEqual(minLength(2)(42), null);
  },
  { concept: 'angular.forms.validation' },
);
