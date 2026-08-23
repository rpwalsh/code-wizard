// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** The ordinary cases. */
import path from 'node:path';
import { test } from 'retrainer/test.js';
import { expectEqual } from 'retrainer/expect.js';

import { classifySpecifier, describePath, safeJoin, toPosix } from '../main.js';

test(
  'a well-behaved request joins under the root',
  () => {
    const root = path.resolve('sandbox-root');
    expectEqual(safeJoin(root, 'docs/guide.md'), path.join(root, 'docs', 'guide.md'));
  },
  { concept: 'node.io.paths' },
);

test(
  'describePath takes a path apart',
  () => {
    const described = describePath(path.join('a', 'b', 'notes.txt'));
    expectEqual(described.base, 'notes.txt');
    expectEqual(described.ext, '.txt');
    expectEqual(described.absolute, false);
  },
  { concept: 'node.io.paths' },
);

test(
  'posix conversion forwards the slashes',
  () => {
    expectEqual(toPosix(['a', 'b', 'c.txt'].join(path.sep)), 'a/b/c.txt');
  },
  { concept: 'node.io.paths' },
);

test(
  'specifiers classify like the resolver',
  () => {
    expectEqual(classifySpecifier('node:fs'), 'builtin');
    expectEqual(classifySpecifier('./util.js'), 'relative');
    expectEqual(classifySpecifier('../up.js'), 'relative');
    expectEqual(classifySpecifier('lodash'), 'bare');
    expectEqual(classifySpecifier('@scope/pkg'), 'bare');
  },
  { concept: 'node.runtime.modules' },
);
