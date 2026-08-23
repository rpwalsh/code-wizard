// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Garbage at boot, errors in logs, and the double dash. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { loadConfig, logLine, parseArgs } from '../main.js';

function throws(fn, naming) {
  try {
    fn();
    return false;
  } catch (error) {
    return error.message.includes(naming);
  }
}

test(
  'garbage config dies at boot, naming the variable',
  () => {
    expectTrue(throws(() => loadConfig({ PORT: '80O0' }), 'PORT'));
    expectTrue(throws(() => loadConfig({ PORT: '0' }), 'PORT'));
    expectTrue(throws(() => loadConfig({ PORT: '70000' }), 'PORT'));
    expectTrue(throws(() => loadConfig({ LOG_LEVEL: 'loud' }), 'LOG_LEVEL'));
  },
  { concept: 'node.operations.config' },
);

test(
  'a blank features list is empty, not [""]',
  () => {
    expectEqual(loadConfig({ FEATURES: '' }).features, []);
    expectEqual(loadConfig({ FEATURES: ' , ,a' }).features, ['a']);
  },
  { concept: 'node.operations.config' },
);

test(
  'an Error in the fields keeps its message',
  () => {
    // JSON.stringify(new Error) is {} — the classic empty log.
    const line = logLine('error', 'request failed', { cause: new Error('socket hang up') });
    expectEqual(JSON.parse(line).cause, 'socket hang up');
  },
  { concept: 'node.operations.logging' },
);

test(
  'fields cannot spoof level or message',
  () => {
    const line = logLine('info', 'real', { level: 'fake', message: 'fake' });
    expectEqual(JSON.parse(line).level, 'info');
    expectEqual(JSON.parse(line).message, 'real');
  },
  { concept: 'node.operations.logging' },
);

test(
  'double dash ends flag parsing',
  () => {
    expectEqual(parseArgs(['--a', '1', '--', '--b', '2']), { _: ['--b', '2'], a: '1' });
  },
  { concept: 'node.runtime.process' },
);

test(
  'a trailing flag is a boolean',
  () => {
    expectEqual(parseArgs(['--dry-run']), { _: [], 'dry-run': true });
  },
  { concept: 'node.runtime.process' },
);
