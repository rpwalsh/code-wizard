// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPECT_PY, REPORT_PY } from '@code-retrainer/python/support';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The browser runtime cannot read the .py files off disk, so their contents are
 * inlined into checked-in TypeScript. That duplication is only safe if it
 * cannot silently drift: an edit to retrainer/report.py that never reached the
 * generated module would mean the two runtimes running different code while
 * every test still passed.
 */
async function onDisk(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), 'utf8');
}

describe('generated Python sources', () => {
  it('matches retrainer/report.py exactly', async () => {
    expect(REPORT_PY).toBe(await onDisk('languages/python/runtime/retrainer/report.py'));
  });

  it('matches retrainer/expect.py exactly', async () => {
    expect(EXPECT_PY).toBe(await onDisk('languages/python/runtime/retrainer/expect.py'));
  });

  it('matches pyodide_host.py exactly', async () => {
    const { PYODIDE_HOST_PY } = await import('@code-retrainer/runtime-web');
    expect(PYODIDE_HOST_PY).toBe(await onDisk('packages/runtime-web/python/pyodide_host.py'));
  });
});
