// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The values JSON lies about, and the errors that carry their origin. */
import { test } from 'retrainer/test.js';
import { expectEqual, expectTrue } from 'retrainer/expect.js';

import { ConfigError, parseConfig, safeStringify, withDefaults } from '../main.js';

function catching(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

test(
  'a parse failure names its source in message and field',
  () => {
    const error = catching(() => parseConfig('{nope', 'deploy.json'));
    expectTrue(error instanceof ConfigError);
    expectTrue(error.message.includes('deploy.json'));
    expectEqual(error.source, 'deploy.json');
  },
  { concept: 'javascript.engineering.errors' },
);

test(
  'valid json that is not an object is refused',
  () => {
    expectTrue(catching(() => parseConfig('[1,2]', 'a.json')) instanceof ConfigError);
    expectTrue(catching(() => parseConfig('"text"', 'a.json')) instanceof ConfigError);
    expectTrue(catching(() => parseConfig('null', 'a.json')) instanceof ConfigError);
  },
  { concept: 'javascript.engineering.errors' },
);

test(
  'zero, false and empty string beat the default',
  () => {
    // || would flatten all three; ?? keeps them.
    expectEqual(
      withDefaults(
        { retries: 0, verbose: false, prefix: '' },
        { retries: 3, verbose: true, prefix: '>' },
      ),
      { retries: 0, verbose: false, prefix: '' },
    );
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'null and undefined take the default',
  () => {
    expectEqual(
      withDefaults({ host: null }, { host: 'localhost', port: 1 }),
      { host: 'localhost', port: 1 },
    );
  },
  { concept: 'javascript.syntax.nullish' },
);

test(
  'the values stringify would mangle are refused',
  () => {
    expectTrue(catching(() => safeStringify({ fn: () => 1 })) instanceof ConfigError);
    expectTrue(catching(() => safeStringify({ x: undefined })) instanceof ConfigError);
    expectTrue(catching(() => safeStringify({ n: NaN })) instanceof ConfigError);
    expectTrue(catching(() => safeStringify({ n: Infinity })) instanceof ConfigError);
    expectTrue(catching(() => safeStringify([1, undefined, 3])) instanceof ConfigError);
    expectTrue(catching(() => safeStringify(undefined)) instanceof ConfigError);
  },
  { concept: 'javascript.engineering.errors' },
);

test(
  'the mangle check reaches into nesting',
  () => {
    expectTrue(
      catching(() => safeStringify({ deep: { deeper: { bad: NaN } } })) instanceof ConfigError,
    );
  },
  { concept: 'javascript.engineering.errors' },
);

test(
  'null is JSON and passes untouched',
  () => {
    expectEqual(safeStringify({ empty: null }), '{"empty":null}');
    expectEqual(safeStringify(null), 'null');
  },
  { concept: 'javascript.data.json' },
);
