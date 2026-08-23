// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The boundaries: everything at once, nothing, and the guard as a filter. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { atLeast, isLevel, type Level } from '../main.ts';

test(
  'debug keeps everything and error keeps only errors',
  () => {
    const messages: { level: Level; text: string }[] = [
      { level: 'debug', text: 'a' },
      { level: 'error', text: 'b' },
    ];
    expectEqual(atLeast(messages, 'debug').length, 2);
    expectEqual(atLeast(messages, 'error').length, 1);
  },
  { concept: 'typescript.basics.literals' },
);

test(
  'an empty list filters to an empty list',
  () => {
    expectEqual(atLeast([], 'info'), []);
  },
  { concept: 'typescript.basics.literals' },
);

test(
  'the guard narrows runtime strings into the union',
  () => {
    // The realistic use: a query parameter arrives as string, and only the
    // guard can carry it into Level-typed code without a lying cast.
    const fromQuery: string[] = ['warn', 'silly', 'error', 'Error'];
    const levels: Level[] = fromQuery.filter(isLevel);
    expectEqual(levels, ['warn', 'error']);
  },
  { concept: 'typescript.basics.inference' },
);
