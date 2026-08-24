// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: levels, fields, redaction, and a measured call. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createLogger, redact, shouldLog, withTiming } from '../main.js';

/** A sink that keeps what it was given, and a clock that does not move. */
function collector() {
  const lines = [];
  return { lines, sink: (line) => lines.push(line), records: () => lines.map((l) => JSON.parse(l)) };
}

test(
  'a level writes itself and everything more severe',
  () => {
    expectEqual(shouldLog('info', 'info'), true);
    expectEqual(shouldLog('info', 'warn'), true);
    expectEqual(shouldLog('info', 'error'), true);
    expectEqual(shouldLog('info', 'debug'), false);
  },
  { concept: 'node.operations.logging' },
);

test(
  'debug configured writes everything',
  () => {
    expectEqual(shouldLog('debug', 'debug'), true);
    expectEqual(shouldLog('error', 'warn'), false);
  },
  { concept: 'node.operations.logging' },
);

test(
  'a record carries the level, the message and the time',
  () => {
    const { sink, records } = collector();
    const log = createLogger({ level: 'info', sink, now: () => 1700 });

    log.info('login failed');

    expectEqual(records().length, 1);
    expectEqual(records()[0], { level: 'info', message: 'login failed', time: 1700 });
  },
  { concept: 'node.operations.logging' },
);

test(
  'fields become their own keys rather than part of the sentence',
  () => {
    const { sink, records } = collector();
    const log = createLogger({ level: 'info', sink, now: () => 1 });

    log.warn('slow query', { route: '/orders', ms: 812 });

    // Queryable, which is the entire point of the convention.
    expectEqual(records()[0].route, '/orders');
    expectEqual(records()[0].ms, 812);
  },
  { concept: 'node.operations.logging' },
);

test(
  'a filtered message writes nothing at all',
  () => {
    const { sink, lines } = collector();
    const log = createLogger({ level: 'warn', sink, now: () => 1 });

    log.debug('noisy');
    log.info('also noisy');

    expectEqual(lines.length, 0);
  },
  { concept: 'node.operations.logging' },
);

test(
  'secrets are replaced on the way out',
  () => {
    expectEqual(redact({ user: 'ada', password: 'hunter2' }), {
      user: 'ada',
      password: '[redacted]',
    });
  },
  { concept: 'node.operations.logging' },
);

test(
  'withTiming returns the value and how long it took',
  async () => {
    let clock = 100;
    const { value, ms } = await withTiming(
      async () => {
        clock = 175;
        return 'done';
      },
      () => clock,
    );

    expectEqual(value, 'done');
    expectEqual(ms, 75);
  },
  { concept: 'node.operations.performance' },
);
