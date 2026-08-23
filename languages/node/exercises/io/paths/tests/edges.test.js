// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The traversal attempts, and the classifier's corners. */
import path from 'node:path';
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { classifySpecifier, safeJoin } from '../main.js';

const root = path.resolve('served-files');

test(
  'plain traversal is refused',
  () => {
    expectEqual(safeJoin(root, '../etc/passwd'), null);
    expectEqual(safeJoin(root, '..'), null);
  },
  { concept: 'node.io.paths' },
);

test(
  'traversal hidden mid-path is refused too',
  () => {
    // Input inspection misses this; resolving first catches it.
    expectEqual(safeJoin(root, 'docs/../../secret'), null);
  },
  { concept: 'node.io.paths' },
);

test(
  'a sibling directory sharing the prefix does not pass',
  () => {
    // /data-evil must not pass a check for /data: the + sep detail.
    expectEqual(safeJoin(root, `${'..' + path.sep}served-files-evil${path.sep}x`), null);
  },
  { concept: 'node.io.paths' },
);

test(
  'the root itself is inside the root',
  () => {
    expectEqual(safeJoin(root, '.'), root);
    expectEqual(safeJoin(root, 'a/../b/..'), root);
  },
  { concept: 'node.io.paths' },
);

test(
  'a bare specifier with a slash is still bare',
  () => {
    expectEqual(classifySpecifier('lodash/fp'), 'bare');
  },
  { concept: 'node.runtime.modules' },
);

test(
  'an absolute specifier is absolute',
  () => {
    expectEqual(classifySpecifier(path.resolve('anything.js')), 'absolute');
  },
  { concept: 'node.runtime.modules' },
);
