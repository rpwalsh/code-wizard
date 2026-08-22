import type {
  WorkerCallOf,
  WorkerKind,
  WorkerRequest,
  WorkerResponse,
  WorkerResultMap,
  WorkerResultValue,
} from './protocol.ts';
import { isProgress } from './protocol.ts';

/**
 * The minimum a worker host has to provide.
 *
 * Two implementations exist: `Worker` in a browser and `node:worker_threads`
 * under test. Abstracting them is not gold-plating — the timeout guarantee is
 * implemented by *killing* the worker, and a guarantee that can only be
 * exercised in a browser is a guarantee that never gets tested.
 */
export interface WorkerChannel {
  post(message: WorkerRequest): void;
  onMessage(handler: (message: WorkerResponse) => void): void;
  onError(handler: (error: Error) => void): void;
  /** Stop the worker immediately, mid-computation. */
  terminate(): Promise<void>;
}

export type WorkerChannelFactory = () => WorkerChannel | Promise<WorkerChannel>;

/**
 * Wrap an already-constructed browser `Worker`.
 *
 * Takes the worker rather than a URL because bundlers detect worker entry
 * points syntactically: handing this function a URL to construct would leave
 * the worker module out of the build entirely, and the failure would only
 * appear in production.
 *
 * `terminate()` is the browser's answer to killing a process tree: it stops
 * the thread wherever it is, including inside an infinite Python loop that no
 * cooperative cancellation could ever interrupt.
 */
export function browserChannel(worker: Worker): WorkerChannel {
  return {
    post: (message) => worker.postMessage(message),
    onMessage: (handler) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => handler(event.data);
    },
    onError: (handler) => {
      worker.onerror = (event) => handler(new Error(event.message || 'Worker failed to start'));
      worker.onmessageerror = () => handler(new Error('Worker sent an uncloneable message'));
    },
    terminate: async () => {
      worker.terminate();
    },
  };
}

/**
 * A `node:worker_threads` worker, so the browser runtime can be tested in CI
 * without a headless browser.
 */
export async function nodeChannel(scriptUrl: string | URL): Promise<WorkerChannel> {
  const { Worker } = await import('node:worker_threads');
  const worker = new Worker(scriptUrl);
  // A pending worker must not hold the test process open.
  worker.unref();

  return {
    post: (message) => worker.postMessage(message),
    onMessage: (handler) => {
      worker.on('message', (message: WorkerResponse) => handler(message));
    },
    onError: (handler) => {
      worker.on('error', (error: Error) => handler(error));
    },
    terminate: async () => {
      await worker.terminate();
    },
  };
}

export class WorkerCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerCallError';
  }
}

interface PendingCall {
  readonly resolve: (value: WorkerResultValue) => void;
  readonly reject: (error: Error) => void;
}

export class WorkerTerminatedError extends Error {
  constructor(message = 'The worker was terminated.') {
    super(message);
    this.name = 'WorkerTerminatedError';
  }
}

/**
 * Request/response over a channel, with every in-flight call rejected if the
 * worker goes away.
 */
export class WorkerClient {
  #channel: WorkerChannel | null = null;
  #nextId = 1;
  readonly #pending = new Map<number, PendingCall>();

  constructor(
    private readonly factory: WorkerChannelFactory,
    private readonly onProgress?: (message: string) => void,
  ) {}

  get running(): boolean {
    return this.#channel !== null;
  }

  async start(): Promise<void> {
    if (this.#channel) return;
    const channel = await this.factory();

    channel.onMessage((message) => {
      if (isProgress(message)) {
        this.onProgress?.(message.message);
        return;
      }
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.ok) pending.resolve(message.value);
      else pending.reject(new WorkerCallError(message.error));
    });

    channel.onError((error) => {
      this.#rejectAll(error);
    });

    this.#channel = channel;
  }

  /**
   * Send one request and resolve with the result declared for its kind.
   *
   * The kind determines the result type, so callers never say what they expect
   * and never cast what comes back.
   */
  call<K extends WorkerKind>(request: WorkerCallOf<K>): Promise<WorkerResultMap[K]> {
    const channel = this.#channel;
    if (!channel) return Promise.reject(new WorkerTerminatedError('The worker is not running.'));

    const id = this.#nextId++;
    return new Promise<WorkerResultMap[K]>((resolve, reject) => {
      this.#pending.set(id, {
        resolve: (value) => resolve(value as WorkerResultMap[K]),
        reject,
      });
      const outgoing: WorkerRequest = { ...request, id };
      channel.post(outgoing);
    });
  }

  /**
   * Kill the worker. Every in-flight call rejects, because their computation
   * genuinely will not finish — pretending otherwise would leave the caller
   * awaiting forever.
   */
  async terminate(reason = 'The worker was terminated.'): Promise<void> {
    const channel = this.#channel;
    this.#channel = null;
    this.#rejectAll(new WorkerTerminatedError(reason));
    await channel?.terminate();
  }

  #rejectAll(error: Error): void {
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }
}
