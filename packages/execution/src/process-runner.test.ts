// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import os from 'node:os';

import { describe, expect, it } from 'vitest';

import { buildSandboxEnvironment } from './environment.ts';
import { runProcess } from './process-runner.ts';

/**
 * These are the security tests the spec calls for (§35): runaway processes,
 * output flooding, and process trees. They run against a real interpreter
 * because that is the only way the guarantees mean anything.
 */
const python = process.env.CODE_RETRAINER_PYTHON ?? (os.platform() === 'win32' ? 'py' : 'python3');
const prefix = process.env.CODE_RETRAINER_PYTHON ? [] : os.platform() === 'win32' ? ['-3'] : [];

function run(script: string, overrides: Partial<Parameters<typeof runProcess>[0]> = {}) {
  return runProcess({
    command: python,
    args: [...prefix, '-u', '-c', script],
    cwd: os.tmpdir(),
    env: buildSandboxEnvironment(),
    timeoutMs: 10_000,
    maxOutputBytes: 64 * 1024,
    ...overrides,
  });
}

describe('runProcess', () => {
  it('captures stdout, stderr and the exit code', async () => {
    const outcome = await run(
      'import sys; print("out"); print("err", file=sys.stderr); sys.exit(3)',
    );
    expect(outcome.stdout.trim()).toBe('out');
    expect(outcome.stderr.trim()).toBe('err');
    expect(outcome.exitCode).toBe(3);
    expect(outcome.timedOut).toBe(false);
  });

  it('feeds stdin to the child', async () => {
    const outcome = await run('import sys; print(sys.stdin.read().upper())', {
      stdin: 'hello',
    });
    expect(outcome.stdout.trim()).toBe('HELLO');
  });

  it('does not hang when the child ignores stdin', async () => {
    const outcome = await run('print("done")', { stdin: 'x'.repeat(100_000) });
    expect(outcome.stdout.trim()).toBe('done');
  });

  it('terminates a runaway process at the timeout', async () => {
    const outcome = await run('import time\nwhile True: time.sleep(0.05)', { timeoutMs: 1_000 });
    expect(outcome.timedOut).toBe(true);
    expect(outcome.durationMs).toBeLessThan(8_000);
  });

  it('terminates a process that ignores interrupts', async () => {
    // SIGINT-proof on POSIX; the runner must escalate rather than wait.
    const script = [
      'import signal, time',
      'try:',
      '    signal.signal(signal.SIGINT, signal.SIG_IGN)',
      'except Exception:',
      '    pass',
      'while True:',
      '    time.sleep(0.05)',
    ].join('\n');
    const outcome = await run(script, { timeoutMs: 1_000 });
    expect(outcome.timedOut).toBe(true);
  });

  it('caps flooded stdout instead of buffering it all', async () => {
    const outcome = await run('for _ in range(500000): print("x" * 500)', {
      maxOutputBytes: 16 * 1024,
      timeoutMs: 30_000,
    });
    expect(outcome.truncated).toBe(true);
    // The cap plus the truncation notice, not 250MB.
    expect(outcome.stdout.length).toBeLessThan(64 * 1024);
    expect(outcome.stdout).toContain('output truncated');
  });

  it('caps flooded stderr independently of stdout', async () => {
    const outcome = await run(
      'import sys\nfor _ in range(500000): sys.stderr.write("y" * 500 + "\\n")',
      { maxOutputBytes: 16 * 1024, timeoutMs: 30_000 },
    );
    expect(outcome.truncated).toBe(true);
    expect(outcome.stderr.length).toBeLessThan(64 * 1024);
  });

  it('kills the whole process tree, not just the direct child', async () => {
    // The parent spawns a long-lived grandchild that writes a marker file, then
    // sleeps forever. If only the parent were killed, the grandchild would
    // survive and keep the sentinel file growing.
    const script = [
      'import subprocess, sys, time',
      'child = subprocess.Popen([sys.executable, "-c", "import time\\nwhile True: time.sleep(0.05)"])',
      'print(child.pid, flush=True)',
      'while True:',
      '    time.sleep(0.05)',
    ].join('\n');

    const outcome = await run(script, { timeoutMs: 2_000 });
    expect(outcome.timedOut).toBe(true);

    const grandchildPid = Number.parseInt(outcome.stdout.trim(), 10);
    expect(Number.isFinite(grandchildPid)).toBe(true);

    // Give the OS a moment to reap the tree before asserting it is gone.
    await new Promise((resolve) => setTimeout(resolve, 750));
    expect(isAlive(grandchildPid)).toBe(false);
  });

  it('reports a spawn failure rather than throwing', async () => {
    const outcome = await runProcess({
      command: 'code-wizard-definitely-not-a-real-binary',
      args: [],
      cwd: os.tmpdir(),
      env: buildSandboxEnvironment(),
      timeoutMs: 5_000,
      maxOutputBytes: 1024,
    });
    expect(outcome.spawnError).toBeTruthy();
    expect(outcome.exitCode).toBeNull();
  });

  it('does not leak the host environment into the child', async () => {
    process.env.RETRAINER_TEST_SECRET = 'do-not-leak';
    try {
      const outcome = await run(
        'import os; print(os.environ.get("RETRAINER_TEST_SECRET", "absent"))',
      );
      expect(outcome.stdout.trim()).toBe('absent');
    } finally {
      delete process.env.RETRAINER_TEST_SECRET;
    }
  });
});

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}
