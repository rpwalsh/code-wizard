// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ProcessRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Record<string, string>;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly stdin?: string;
}

export interface ProcessOutcome {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly truncated: boolean;
  readonly timedOut: boolean;
  readonly durationMs: number;
  /** Set when the process could not be spawned at all (e.g. ENOENT). */
  readonly spawnError?: string;
}

/**
 * Bounded byte sink. Once the cap is reached, further chunks are counted and
 * dropped rather than buffered — an infinite `print` loop must not be able to
 * exhaust the application's memory (spec §14).
 */
class BoundedBuffer {
  readonly #chunks: Buffer[] = [];
  #size = 0;
  #truncated = false;

  constructor(private readonly limit: number) {}

  push(chunk: Buffer): void {
    if (this.#size >= this.limit) {
      this.#truncated = true;
      return;
    }
    const remaining = this.limit - this.#size;
    if (chunk.length <= remaining) {
      this.#chunks.push(chunk);
      this.#size += chunk.length;
      return;
    }
    this.#chunks.push(chunk.subarray(0, remaining));
    this.#size = this.limit;
    this.#truncated = true;
  }

  get truncated(): boolean {
    return this.#truncated;
  }

  toString(): string {
    const text = Buffer.concat(this.#chunks).toString('utf8');
    return this.#truncated ? `${text}\n... output truncated ...` : text;
  }
}

/**
 * Kill the entire process tree. A learner program that spawns children (or a
 * test runner that forks workers) must not leave orphans behind, and on
 * Windows killing only the direct child reliably does exactly that.
 */
export async function killProcessTree(pid: number): Promise<void> {
  if (os.platform() === 'win32') {
    try {
      await execFileAsync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
    } catch {
      // taskkill exits non-zero when the tree is already gone; nothing to do.
    }
    return;
  }
  // Spawned detached, so the child leads its own process group: negating the
  // pid signals the whole group.
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already exited.
    }
  }
}

export function runProcess(request: ProcessRequest): Promise<ProcessOutcome> {
  const startedAt = performance.now();

  return new Promise<ProcessOutcome>((resolve) => {
    const stdout = new BoundedBuffer(request.maxOutputBytes);
    const stderr = new BoundedBuffer(request.maxOutputBytes);
    let timedOut = false;
    let settled = false;

    const child = spawn(request.command, [...request.args], {
      cwd: request.cwd,
      env: request.env,
      windowsHide: true,
      // Own process group on POSIX so the whole tree can be signaled.
      detached: os.platform() !== 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const finish = (outcome: Omit<ProcessOutcome, 'durationMs'>): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...outcome, durationMs: Math.round(performance.now() - startedAt) });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid !== undefined) void killProcessTree(child.pid);
    }, request.timeoutMs);
    // A pending kill timer must not keep the host process alive.
    timer.unref?.();

    child.stdout?.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk));

    child.on('error', (error: NodeJS.ErrnoException) => {
      finish({
        exitCode: null,
        signal: null,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        truncated: stdout.truncated || stderr.truncated,
        timedOut,
        spawnError: `${error.code ?? 'ERROR'}: ${error.message}`,
      });
    });

    child.on('close', (code, signal) => {
      finish({
        exitCode: code,
        signal,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        truncated: stdout.truncated || stderr.truncated,
        timedOut,
      });
    });

    if (child.stdin) {
      child.stdin.on('error', () => {
        // The program may exit without reading stdin; EPIPE is expected.
      });
      if (request.stdin !== undefined) child.stdin.write(request.stdin);
      child.stdin.end();
    }
  });
}
