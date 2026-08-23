// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue, expectFalse } from 'retrainer/expect.js';

import { LEVELS, atLeast, isLevel, severity } from '../main.ts';

test(
  'severities are ordered',
  () => {
    expectEqual(severity('debug'), 0);
    expectEqual(severity('info'), 1);
    expectEqual(severity('warn'), 2);
    expectEqual(severity('error'), 3);
  },
  { concept: 'typescript.basics.literals' },
);

test(
  'atLeast filters by severity, keeping order',
  () => {
    const messages = [
      { level: 'info', text: 'started' },
      { level: 'error', text: 'boom' },
      { level: 'debug', text: 'noise' },
      { level: 'warn', text: 'careful' },
    ] as const;

    expectEqual(
      atLeast([...messages], 'warn').map((message) => message.text),
      ['boom', 'careful'],
    );
  },
  { concept: 'typescript.basics.literals' },
);

test(
  'the guard admits members and refuses strangers',
  () => {
    expectTrue(isLevel('warn'));
    expectTrue(isLevel('debug'));
    expectFalse(isLevel('verbose'));
    expectFalse(isLevel(''));
    expectFalse(isLevel('WARN'));
  },
  { concept: 'typescript.basics.annotations' },
);

test(
  'LEVELS lists all four, lowest first',
  () => {
    expectEqual([...LEVELS], ['debug', 'info', 'warn', 'error']);
  },
  { concept: 'typescript.basics.inference' },
);
