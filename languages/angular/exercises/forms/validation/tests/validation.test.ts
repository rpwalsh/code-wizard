// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { compose, minLength, pattern, required, validateGroup } from '../main.ts';

test(
  'required rejects nothing and accepts something',
  () => {
    expectEqual(required(''), { required: true });
    expectEqual(required('   '), { required: true });
    expectEqual(required(null), { required: true });
    expectEqual(required('ada'), null);
  },
  { concept: 'angular.forms.validation' },
);

test(
  'minLength reports both lengths',
  () => {
    expectEqual(minLength(3)('ab'), { minLength: { requiredLength: 3, actualLength: 2 } });
    expectEqual(minLength(3)('abc'), null);
  },
  { concept: 'angular.forms.validation' },
);

test(
  'pattern names the rule that failed',
  () => {
    const email = pattern(/@/, 'email');
    expectEqual(email('nope'), { pattern: 'email' });
    expectEqual(email('a@b'), null);
  },
  { concept: 'angular.forms.validation' },
);

test(
  'compose reports every failure at once',
  () => {
    const validator = compose([required, minLength(5), pattern(/@/, 'email')]);
    expectEqual(validator('ab'), {
      minLength: { requiredLength: 5, actualLength: 2 },
      pattern: 'email',
    });
  },
  { concept: 'angular.forms.validation' },
);

test(
  'a group reports only its failing fields',
  () => {
    const result = validateGroup(
      { name: 'Ada', email: 'nope' },
      { name: required, email: compose([required, pattern(/@/, 'email')]) },
    );
    expectEqual(result.valid, false);
    expectEqual(result.errors, { email: { pattern: 'email' } });
  },
  { concept: 'angular.forms.reactive' },
);
