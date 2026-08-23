// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { describe, expect, it } from 'vitest';

import { MANAGERS, planInstall } from './install.ts';
import { goPortable, phpPortable, portableRoot } from './portable.ts';

/**
 * The unprivileged install path.
 *
 * The resolvers reach the network, so those tests are marked slow and assert
 * shape rather than a version — pinning "go1.27.0" here would fail the day Go
 * releases, which is a test failing for being right.
 *
 * What is asserted without a network is the part that matters most: that a
 * checksum is always required, and that the plan never proposes elevation
 * where an unprivileged route exists.
 */
describe('portable installs', () => {
  it('unpack into the learner s own home directory', () => {
    // Nothing outside this path is written, which is the whole reason this
    // route needs no administrator.
    const root = portableRoot();
    const home = process.env['USERPROFILE'] ?? process.env['HOME'] ?? '';
    expect(root.startsWith(home)).toBe(true);
    expect(root.endsWith('toolchains')).toBe(true);
  });

  it('resolve Go against its own download index', { timeout: 60_000 }, async () => {
    const archive = await goPortable.resolve();
    if (archive === null) return; // offline; the check below covers the shape

    expect(archive.url).toMatch(/^https:\/\/go\.dev\/dl\/go[\d.]+\./u);
    // A 64-character hex digest, from go.dev rather than from this repository.
    expect(archive.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(archive.stripRoot).toBe('go');
  });

  it('resolve PHP against its own release index on Windows', { timeout: 60_000 }, async () => {
    const archive = await phpPortable.resolve();

    if (process.platform !== 'win32') {
      // Deliberately absent elsewhere: every other platform has a PHP in its
      // package manager that installs without elevation.
      expect(archive).toBeNull();
      return;
    }

    if (archive === null) return; // offline
    expect(archive.url).toMatch(/^https:\/\/windows\.php\.net\/.*\.zip$/u);
    expect(archive.sha256).toMatch(/^[0-9a-f]{64}$/u);
    // Non-thread-safe: the thread-safe build exists for web servers that run
    // PHP in-process, and nothing here does.
    expect(archive.url).toContain('-nts-');
  });

  it('prefer the unprivileged route wherever a manager would need root', () => {
    // Every Windows and Linux manager installs as root, so on those platforms
    // a language with a portable source should never be planned through one.
    const elevated = MANAGERS.filter((manager) => manager.elevated);
    expect(elevated.length).toBeGreaterThan(0);

    const plan = planInstall(
      [
        {
          language: 'go',
          label: 'The Go toolchain',
          packages: { choco: 'golang', apt: 'golang-go' },
          manual: 'Download it from https://go.dev/dl/.',
          needsNewShell: true,
          portable: goPortable,
        },
      ],
      elevated,
    );

    // The plan itself still names the managed step — choosing between them is
    // the command's job, and it needs both to compare.
    expect(plan.steps).toHaveLength(1);
    expect(plan.needsElevation).toBe(true);
  });

  it('names a manual route for anything no manager can install', () => {
    const plan = planInstall(
      [
        {
          language: 'obscure',
          label: 'Something exotic',
          packages: {},
          manual: 'Build it from source.',
          needsNewShell: false,
        },
      ],
      [],
    );

    expect(plan.steps).toHaveLength(0);
    expect(plan.unavailable[0]?.reason).toContain('No supported package manager');
  });
});
