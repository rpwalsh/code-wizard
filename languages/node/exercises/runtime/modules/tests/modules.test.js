// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases: what a specifier is, and what the environment says. */
import path from 'node:path';
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { classify, exitCodeFor, readConfig, resolveRelative } from '../main.js';

test(
  'each kind of specifier is recognized',
  () => {
    expectEqual(classify('node:fs'), 'builtin');
    expectEqual(classify('./helpers.js'), 'relative');
    expectEqual(classify('../lib/helpers.js'), 'relative');
    expectEqual(classify('express'), 'bare');
    expectEqual(classify('#internal/db'), 'imports-field');
  },
  { concept: 'node.runtime.modules' },
);

test(
  'a bare fs is not the builtin fs',
  () => {
    // The difference that the node: prefix exists to remove.
    expectEqual(classify('fs'), 'bare');
    expectEqual(classify('node:fs'), 'builtin');
  },
  { concept: 'node.runtime.modules' },
);

test(
  'a relative specifier resolves against the importing file',
  () => {
    const resolved = resolveRelative(path.join('/app', 'src', 'index.js'), './util.js');
    expectEqual(resolved, path.resolve('/app/src/util.js'));
  },
  { concept: 'node.runtime.modules' },
);

test(
  'a non-relative specifier has no path to resolve',
  () => {
    expectEqual(resolveRelative('/app/src/index.js', 'express'), null);
    expectEqual(resolveRelative('/app/src/index.js', 'node:fs'), null);
  },
  { concept: 'node.runtime.modules' },
);

test(
  'missing variables fall back to their defaults',
  () => {
    expectEqual(readConfig({}, { HOST: 'localhost', PORT: 8080, DEBUG: false }), {
      HOST: 'localhost',
      PORT: 8080,
      DEBUG: false,
    });
  },
  { concept: 'node.runtime.process' },
);

test(
  'values are converted to the type of their default',
  () => {
    const config = readConfig({ PORT: '3000', DEBUG: 'true', HOST: 'example' }, {
      HOST: 'localhost',
      PORT: 8080,
      DEBUG: false,
    });

    expectEqual(config.PORT, 3000);
    expectEqual(config.DEBUG, true);
    expectEqual(config.HOST, 'example');
  },
  { concept: 'node.runtime.process' },
);

test(
  'exit codes distinguish success from the kinds of failure',
  () => {
    expectEqual(exitCodeFor('ok'), 0);
    expectEqual(exitCodeFor('usage'), 2);
    expectEqual(exitCodeFor('failure'), 1);
  },
  { concept: 'node.runtime.process' },
);
