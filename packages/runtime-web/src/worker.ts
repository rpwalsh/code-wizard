/**
 * The Pyodide worker entry point.
 *
 * Runs in a browser `Worker` in production and a `node:worker_threads` worker
 * under test, so it must not touch anything that only one of them has. The
 * two differ in exactly one place — how a message is posted — which is
 * resolved once, at startup.
 */
import type { PyodideLoader, PyodideLoadOptions } from './engine.ts';
import { PyodideEngine } from './engine.ts';
import type { WorkerRequest, WorkerResponse } from './protocol.ts';

type Post = (message: WorkerResponse) => void;
type Subscribe = (handler: (message: WorkerRequest) => void) => void;

interface Host {
  readonly post: Post;
  readonly subscribe: Subscribe;
}

async function resolveHost(): Promise<Host> {
  // `self.postMessage` in a browser worker; `parentPort` under worker_threads.
  const scope = globalThis as unknown as {
    postMessage?: (message: unknown) => void;
    addEventListener?: (type: string, handler: (event: MessageEvent) => void) => void;
  };

  if (typeof scope.postMessage === 'function' && typeof scope.addEventListener === 'function') {
    return {
      post: (message) => scope.postMessage?.(message),
      subscribe: (handler) =>
        scope.addEventListener?.('message', (event: MessageEvent) =>
          handler(event.data as WorkerRequest),
        ),
    };
  }

  const { parentPort } = await import('node:worker_threads');
  if (!parentPort) throw new Error('forge worker started outside a worker context');
  return {
    post: (message) => parentPort.postMessage(message),
    subscribe: (handler) =>
      parentPort.on('message', (message) => handler(message as WorkerRequest)),
  };
}

/**
 * Load Pyodide from wherever this build can reach it.
 *
 * The npm package works in Node and in bundlers; a browser build that prefers
 * the CDN passes an `indexUrl` and lets Pyodide fetch its own assets from
 * there, which keeps the deployed site to a few hundred kilobytes.
 */
const loadPyodideModule: PyodideLoader = async (options) => {
  const module = (await import('pyodide')) as unknown as {
    loadPyodide: (config: PyodideLoadOptions) => Promise<never>;
  };
  return module.loadPyodide(options);
};

export async function startWorker(loader: PyodideLoader = loadPyodideModule): Promise<void> {
  const host = await resolveHost();
  let engine: PyodideEngine | null = null;

  const respond = (id: number, body: { ok: true; value: unknown } | { ok: false; error: string }) =>
    host.post({ id, ...body } as WorkerResponse);

  host.subscribe((request) => {
    void (async () => {
      try {
        switch (request.kind) {
          case 'boot': {
            engine = await PyodideEngine.boot(loader, request.config, (message) =>
              host.post({ id: 0, kind: 'progress', message }),
            );
            respond(request.id, { ok: true, value: engine.info });
            return;
          }
          case 'execute': {
            respond(request.id, { ok: true, value: requireEngine(engine).execute(request) });
            return;
          }
          case 'test': {
            respond(request.id, { ok: true, value: requireEngine(engine).test(request) });
            return;
          }
          case 'diagnose': {
            respond(request.id, { ok: true, value: requireEngine(engine).diagnose(request) });
            return;
          }
        }
      } catch (error) {
        // Errors cross the boundary as text: an exception object does not
        // survive structured clone with anything useful attached.
        respond(request.id, {
          ok: false,
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        });
      }
    })();
  });
}

function requireEngine(engine: PyodideEngine | null): PyodideEngine {
  if (!engine) throw new Error('The Python runtime has not finished starting.');
  return engine;
}

// Started on import: a worker module has nothing else to do.
void startWorker();
