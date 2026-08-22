import type { Diagnostic } from '@code-retrainer/core';

/**
 * The wire format between the page and the Pyodide worker.
 *
 * Deliberately plain data: structured clone has to carry it, and keeping the
 * boundary dumb is what allows the worker to be killed and replaced at any
 * moment without the page holding a stale object graph.
 */
export interface BootConfig {
  /**
   * Where Pyodide's own assets live. A CDN URL keeps the deployed site small;
   * a same-origin path makes the app work offline once cached.
   */
  readonly indexUrl?: string;
  /** Python source of the in-WASM host helpers. */
  readonly hostSource: string;
  /** Support modules written under the support directory, keyed by relative path. */
  readonly supportModules: Readonly<Record<string, string>>;
  /** Packages to install with micripip before anything runs. */
  readonly packages?: readonly string[];
}

/**
 * `Omit` over a union collapses it to the keys they share, which would erase
 * every request's payload. Distributing first keeps each member intact.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends T ? Omit<T, K> : never;

/** A request as the caller writes it: the client assigns the id. */
export type WorkerCall = DistributiveOmit<WorkerRequest, 'id'>;

export type WorkerRequest =
  | { readonly id: number; readonly kind: 'boot'; readonly config: BootConfig }
  | {
      readonly id: number;
      readonly kind: 'execute';
      readonly files: Readonly<Record<string, string>>;
      readonly entryPoint: string;
      readonly args: readonly string[];
      readonly stdin: string;
      readonly maxOutputBytes: number;
    }
  | {
      readonly id: number;
      readonly kind: 'test';
      readonly files: Readonly<Record<string, string>>;
      readonly targets: readonly string[];
      readonly maxOutputBytes: number;
    }
  | {
      readonly id: number;
      readonly kind: 'diagnose';
      readonly files: Readonly<Record<string, string>>;
      readonly paths: readonly string[];
    }
  | {
      readonly id: number;
      readonly kind: 'trace';
      readonly files: Readonly<Record<string, string>>;
      /** A pytest node id, when tracing a test rather than a program. */
      readonly test: string | null;
      readonly entryPoint: string;
      readonly stdin: string;
      readonly maxSteps: number;
      readonly maxOutputBytes: number;
    };

export interface BootResult {
  readonly pythonVersion: string;
  readonly pytestVersion: string | null;
  readonly bootMs: number;
}

export interface ExecuteResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly truncated: boolean;
}

export interface TestRunResult {
  readonly exitStatus: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly truncated: boolean;
  /** Raw JSON written by the pytest plugin, or null when it never ran. */
  readonly report: string | null;
}

export interface DiagnoseResult {
  readonly diagnostics: readonly Diagnostic[];
}

/** The raw trace JSON, narrowed on the page rather than in the worker. */
export interface TraceRunResult {
  readonly document: string;
}

/** Which result each request kind produces. */
export interface WorkerResultMap {
  readonly boot: BootResult;
  readonly execute: ExecuteResult;
  readonly test: TestRunResult;
  readonly diagnose: DiagnoseResult;
  readonly trace: TraceRunResult;
}

export type WorkerKind = WorkerRequest['kind'];

/** Every result the worker can send back, as one union. */
export type WorkerResultValue = WorkerResultMap[WorkerKind];

/** The request for one kind, as the caller writes it. */
export type WorkerCallOf<K extends WorkerKind> = Extract<WorkerCall, { kind: K }>;

export type WorkerResponse =
  | { readonly id: number; readonly ok: true; readonly value: WorkerResultValue }
  | { readonly id: number; readonly ok: false; readonly error: string }
  /** Boot progress, so a five-second first load can say what it is doing. */
  | { readonly id: 0; readonly kind: 'progress'; readonly message: string };

export type ProgressMessage = {
  readonly id: 0;
  readonly kind: 'progress';
  readonly message: string;
};

export function isProgress(message: WorkerResponse): message is ProgressMessage {
  return 'kind' in message && message.kind === 'progress';
}
