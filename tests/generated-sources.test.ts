import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FORGE_EXPECT_PY, FORGE_REPORT_PY } from '@forge/python/support';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The browser runtime cannot read the .py files off disk, so their contents are
 * inlined into checked-in TypeScript. That duplication is only safe if it
 * cannot silently drift: an edit to forge_report.py that never reached the
 * generated module would mean the two runtimes running different code while
 * every test still passed.
 */
async function onDisk(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), 'utf8');
}

describe('generated Python sources', () => {
  it('matches forge_report.py exactly', async () => {
    expect(FORGE_REPORT_PY).toBe(await onDisk('languages/python/runtime/forge_report.py'));
  });

  it('matches forge_expect.py exactly', async () => {
    expect(FORGE_EXPECT_PY).toBe(await onDisk('languages/python/runtime/forge_expect.py'));
  });

  it('matches forge_web.py exactly', async () => {
    const { FORGE_WEB_PY } = await import('@forge/runtime-web');
    expect(FORGE_WEB_PY).toBe(await onDisk('packages/runtime-web/python/forge_web.py'));
  });
});
