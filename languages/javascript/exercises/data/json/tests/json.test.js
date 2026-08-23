// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { parseConfig, safeStringify, withDefaults } from '../main.js';

test(
  'good json parses to its object',
  () => {
    expectEqual(parseConfig('{"port": 8080}', 'app.json'), { port: 8080 });
  },
  { concept: 'javascript.data.json' },
);

test(
  'defaults fill only the gaps',
  () => {
    expectEqual(
      withDefaults({ port: 9000 }, { port: 8080, host: 'localhost' }),
      { port: 9000, host: 'localhost' },
    );
  },
  { concept: 'javascript.data.json' },
);

test(
  'unknown config keys are carried through',
  () => {
    expectEqual(
      withDefaults({ extra: true }, { port: 1 }),
      { extra: true, port: 1 },
    );
  },
  { concept: 'javascript.data.json' },
);

test(
  'clean values stringify normally',
  () => {
    expectEqual(safeStringify({ a: [1, 'two', null], b: { c: true } }),
      '{"a":[1,"two",null],"b":{"c":true}}');
  },
  { concept: 'javascript.data.json' },
);
