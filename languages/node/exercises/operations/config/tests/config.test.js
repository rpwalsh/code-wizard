// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { loadConfig, logLine, parseArgs } from '../main.js';

test(
  'an empty environment is all defaults',
  () => {
    expectEqual(loadConfig({}), { port: 8080, logLevel: 'info', features: [] });
  },
  { concept: 'node.operations.config' },
);

test(
  'set variables are read with their types',
  () => {
    const config = loadConfig({ PORT: '3000', LOG_LEVEL: 'warn', FEATURES: 'a, b,c' });
    expectEqual(config, { port: 3000, logLevel: 'warn', features: ['a', 'b', 'c'] });
  },
  { concept: 'node.operations.config' },
);

test(
  'a log line is one JSON object',
  () => {
    const line = logLine('info', 'server started', { port: 8080 });
    expectEqual(JSON.parse(line), { level: 'info', message: 'server started', port: 8080 });
  },
  { concept: 'node.operations.logging' },
);

test(
  'flags parse into a map',
  () => {
    // In a --name value grammar, a bare flag is one followed by another
    // flag or by nothing — so the boolean goes last here.
    expectEqual(parseArgs(['--port', '3000', 'input.txt', '--verbose']), {
      _: ['input.txt'],
      port: '3000',
      verbose: true,
    });
  },
  { concept: 'node.runtime.process' },
);
