// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The corners: depth, mutation, the clock that must not be read, failures. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { createLogger, redact, withTiming } from '../main.js';

test(
  'a secret nested three objects deep is still redacted',
  () => {
    const body = {
      request: { headers: { authorization: 'Bearer abc' }, body: { user: { password: 'x' } } },
    };

    const clean = redact(body);
    expectEqual(clean.request.headers.authorization, '[redacted]');
    expectEqual(clean.request.body.user.password, '[redacted]');
    // The shallow version passes the top-level test and fails this one,
    // which is the one that reaches production.
  },
  { concept: 'node.operations.logging' },
);

test(
  'secrets inside arrays are redacted too',
  () => {
    const clean = redact({ users: [{ name: 'ada', token: 't1' }, { name: 'bob', token: 't2' }] });
    expectEqual(clean.users[0].token, '[redacted]');
    expectEqual(clean.users[1].token, '[redacted]');
    expectEqual(clean.users[0].name, 'ada');
  },
  { concept: 'node.operations.logging' },
);

test(
  'key matching ignores case',
  () => {
    const clean = redact({ Password: 'x', TOKEN: 'y', Authorization: 'z' });
    expectEqual(clean.Password, '[redacted]');
    expectEqual(clean.TOKEN, '[redacted]');
    expectEqual(clean.Authorization, '[redacted]');
  },
  { concept: 'node.operations.logging' },
);

test(
  'the caller keeps their own data intact',
  () => {
    const original = { user: { name: 'ada', password: 'hunter2' } };
    redact(original);

    // Mutating here is worse than not redacting: the log looks clean and
    // the application now believes the password is '[redacted]'.
    expectEqual(original.user.password, 'hunter2');
  },
  { concept: 'node.operations.logging' },
);

test(
  'values that are not objects pass through unchanged',
  () => {
    expectEqual(redact('plain'), 'plain');
    expectEqual(redact(42), 42);
    expectEqual(redact(null), null);
    expectEqual(redact(undefined), undefined);
    expectEqual(redact([1, 2, 3]), [1, 2, 3]);
  },
  { concept: 'node.operations.logging' },
);

test(
  'a filtered message does not even read the clock',
  () => {
    let asked = 0;
    const log = createLogger({
      level: 'error',
      sink: () => undefined,
      now: () => {
        asked += 1;
        return 1;
      },
    });

    log.debug('a', { password: 'x' });
    log.info('b');
    log.warn('c');

    // The expensive part of a debug log is assembling it. A logger that
    // formats first and discards second makes debug calls costly in
    // production, and the usual response is to delete them.
    expectEqual(asked, 0);

    log.error('d');
    expectEqual(asked, 1);
  },
  { concept: 'node.operations.performance' },
);

test(
  'logging with no fields still produces a complete record',
  () => {
    const lines = [];
    const log = createLogger({ level: 'debug', sink: (line) => lines.push(line), now: () => 9 });

    log.debug('bare');
    expectEqual(JSON.parse(lines[0]), { level: 'debug', message: 'bare', time: 9 });
  },
  { concept: 'node.operations.logging' },
);

test(
  'a failing call is measured before its error escapes',
  async () => {
    // Starting at a non-zero instant on purpose: with began at zero,
    // subtracting and adding it give the same answer, and a timer that
    // adds the start time would pass unnoticed.
    let clock = 1000;
    let caught = null;

    try {
      await withTiming(
        async () => {
          clock = 1040;
          throw new Error('upstream refused');
        },
        () => clock,
      );
    } catch (error) {
      caught = error;
    }

    // A timing that drops failures reports a fast service during an
    // outage, because every slow call now ends in an error.
    expectTrue(caught !== null);
    expectEqual(caught.message, 'upstream refused');
    expectEqual(caught.ms, 40);
  },
  { concept: 'node.operations.performance' },
);

test(
  'work that finishes instantly is measured as no time at all',
  async () => {
    // The clock reads five hundred both times, so the elapsed time is zero
    // and not a thousand — the same reason the failure test starts late.
    const { value, ms } = await withTiming(async () => 'quick', () => 500);
    expectEqual(value, 'quick');
    expectEqual(ms, 0);
  },
  { concept: 'node.operations.performance' },
);
