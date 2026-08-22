import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildSandboxEnvironment } from './environment.ts';
import { maximumLimits, resolveLimits } from './limits.ts';
import {
  assertSafeRelativePath,
  resolveInside,
  Sandbox,
  WorkspacePathError,
  withSandbox,
} from './sandbox.ts';

describe('workspace path safety', () => {
  const hostile = [
    '../escape.py',
    'nested/../../escape.py',
    '/etc/passwd',
    'C:/Windows/System32/drivers/etc/hosts',
    'C:\\Windows\\win.ini',
    '\\\\server\\share\\file.py',
    '..\\escape.py',
    './main.py',
    '',
    'a\0b.py',
  ];

  for (const candidate of hostile) {
    it(`rejects ${JSON.stringify(candidate)}`, () => {
      expect(() => assertSafeRelativePath(candidate)).toThrow(WorkspacePathError);
    });
  }

  it('rejects Windows reserved device names', () => {
    expect(() => assertSafeRelativePath('CON')).toThrow(/reserved device name/);
    expect(() => assertSafeRelativePath('nested/aux.py')).toThrow(/reserved device name/);
  });

  it('accepts ordinary relative paths', () => {
    expect(assertSafeRelativePath('main.py')).toBe('main.py');
    expect(assertSafeRelativePath('tests/test_main.py')).toBe('tests/test_main.py');
    expect(assertSafeRelativePath('.forge/report.json')).toBe('.forge/report.json');
  });

  it('normalises backslash separators to POSIX', () => {
    expect(assertSafeRelativePath('tests\\test_main.py')).toBe('tests/test_main.py');
  });

  it('keeps resolved paths inside the root', () => {
    const root = path.join(os.tmpdir(), 'forge-root');
    expect(resolveInside(root, 'a/b.py')).toBe(path.resolve(root, 'a', 'b.py'));
    expect(() => resolveInside(root, '../sibling/b.py')).toThrow(WorkspacePathError);
  });

  it('does not confuse a sibling directory sharing a name prefix', () => {
    // `forge-root-evil` starts with `forge-root`; a naive prefix check passes it.
    const root = path.join(os.tmpdir(), 'forge-root');
    expect(() => resolveInside(root, '../forge-root-evil/x.py')).toThrow(WorkspacePathError);
  });
});

describe('Sandbox', () => {
  it('materialises files, including nested ones', async () => {
    await withSandbox(
      {
        files: [
          { path: 'main.py', contents: 'print(1)' },
          { path: 'pkg/helper.py', contents: 'VALUE = 2' },
        ],
      },
      async (sandbox) => {
        expect(await sandbox.readFile('main.py')).toBe('print(1)');
        expect(await sandbox.readFile('pkg/helper.py')).toBe('VALUE = 2');
      },
    );
  });

  it('refuses to write a file that escapes the workspace', async () => {
    const sandbox = await Sandbox.create();
    try {
      await expect(
        sandbox.writeFile({ path: '../escaped.py', contents: 'print(1)' }),
      ).rejects.toThrow(WorkspacePathError);
    } finally {
      await sandbox.dispose();
    }
  });

  it('removes the directory on dispose', async () => {
    const sandbox = await Sandbox.create();
    await sandbox.writeFile({ path: 'main.py', contents: 'x' });
    const { root } = sandbox;
    await sandbox.dispose();
    await expect(fs.access(root)).rejects.toThrow();
  });

  it('cleans up even when the body throws', async () => {
    let captured = '';
    await expect(
      withSandbox({ files: [] }, async (sandbox) => {
        captured = sandbox.root;
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await expect(fs.access(captured)).rejects.toThrow();
  });

  it('gives each attempt its own directory', async () => {
    const first = await Sandbox.create();
    const second = await Sandbox.create();
    expect(first.root).not.toBe(second.root);
    await first.dispose();
    await second.dispose();
  });

  it('is safe to dispose twice', async () => {
    const sandbox = await Sandbox.create();
    await sandbox.dispose();
    await expect(sandbox.dispose()).resolves.toBeUndefined();
  });
});

describe('environment allowlisting', () => {
  it('drops variables that are not on the allowlist', () => {
    const environment = buildSandboxEnvironment({
      source: {
        PATH: '/usr/bin',
        ANTHROPIC_API_KEY: 'secret',
        AWS_SECRET_ACCESS_KEY: 'secret',
        FORGE_INTERNAL_TOKEN: 'secret',
      },
    });
    expect(environment.PATH).toBe('/usr/bin');
    expect(environment.ANTHROPIC_API_KEY).toBeUndefined();
    expect(environment.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    expect(environment.FORGE_INTERNAL_TOKEN).toBeUndefined();
  });

  it('does not leak the real process environment by default', () => {
    process.env.FORGE_TEST_LEAK_CANARY = 'leaked';
    try {
      expect(buildSandboxEnvironment().FORGE_TEST_LEAK_CANARY).toBeUndefined();
    } finally {
      delete process.env.FORGE_TEST_LEAK_CANARY;
    }
  });

  it('matches allowlisted names case-insensitively, as Windows supplies them', () => {
    const environment = buildSandboxEnvironment({ source: { Path: 'C:/Python' } });
    expect(Object.values(environment)).toContain('C:/Python');
  });

  it('lets the runtime adapter add what it needs', () => {
    const environment = buildSandboxEnvironment({
      source: {},
      extra: { PYTHONPATH: '/workspace' },
    });
    expect(environment.PYTHONPATH).toBe('/workspace');
  });
});

describe('limit clamping', () => {
  it('applies defaults when nothing is requested', () => {
    expect(resolveLimits(undefined).timeoutMs).toBeGreaterThan(0);
  });

  it('refuses to exceed the hard ceiling however large the request', () => {
    const limits = resolveLimits({ timeoutMs: 60 * 60 * 1000, maxOutputBytes: 1e12 });
    expect(limits.timeoutMs).toBe(maximumLimits.timeoutMs);
    expect(limits.maxOutputBytes).toBe(maximumLimits.maxOutputBytes);
  });

  it('refuses a zero or negative timeout', () => {
    expect(resolveLimits({ timeoutMs: 0 }).timeoutMs).toBeGreaterThan(0);
    expect(resolveLimits({ timeoutMs: -5 }).timeoutMs).toBeGreaterThan(0);
  });
});
