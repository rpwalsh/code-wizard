// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Mid-typing states, and the text that must never be snatched. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { convert } from '../main.js';

const empty = { celsius: '', fahrenheit: '' };

test(
  'the edited field keeps its exact text, even garbage',
  () => {
    expectEqual(convert(empty, 'celsius', '1.2.3').celsius, '1.2.3');
    expectEqual(convert(empty, 'celsius', '-').celsius, '-');
  },
  { concept: 'react.state.usestate' },
);

test(
  'unparseable text blanks the other field',
  () => {
    expectEqual(convert({ celsius: '25', fahrenheit: '77' }, 'celsius', 'abc'), {
      celsius: 'abc',
      fahrenheit: '',
    });
  },
  { concept: 'react.state.usestate' },
);

test(
  'clearing a field clears the other',
  () => {
    // Number("") is 0 — only the empty-string check stops "" becoming "32".
    expectEqual(convert({ celsius: '25', fahrenheit: '77' }, 'celsius', ''), {
      celsius: '',
      fahrenheit: '',
    });
  },
  { concept: 'react.state.usestate' },
);

test(
  'surrounding whitespace still parses',
  () => {
    expectEqual(convert(empty, 'celsius', ' 25 ').fahrenheit, '77');
    expectEqual(convert(empty, 'celsius', ' 25 ').celsius, ' 25 ');
  },
  { concept: 'react.state.usestate' },
);

test(
  'negative temperatures convert like any other',
  () => {
    expectEqual(convert(empty, 'celsius', '-40'), { celsius: '-40', fahrenheit: '-40' });
  },
  { concept: 'react.state.lifting' },
);

test(
  'the input is never mutated',
  () => {
    const state = { celsius: '1', fahrenheit: '33.8' };
    convert(state, 'celsius', '2');
    expectEqual(state, { celsius: '1', fahrenheit: '33.8' });
  },
  { concept: 'react.state.lifting' },
);
