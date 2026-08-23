// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The Pyodide worker entry point.
 *
 * Runs in a browser `Worker` in production and a `node:worker_threads` worker
 * under test, so it must not touch anything that only one of them has. The
 * two differ in exactly one place — how a message is posted — which is
 * resolved once, at startup.
 */
import { toError } from '@code-retrainer/core';

import type { PyodideGlobal, PyodideLoader, PyodideResult } from './engine.ts';
import { PyodideEngine } from './engine.ts';
import type { WorkerRequest, WorkerResponse, WorkerResultValue } from './protocol.ts';

interface Host {
  readonly post: (message: WorkerResponse) => void;
  readonly subscribe: (handler: (message: WorkerRequest) => void) => void;
}

/** The subset of a browser worker scope this module uses. */
interface WorkerScope {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', handler: (event: { data: WorkerRequest }) => void): void;
}

function browserScope(): WorkerScope | null {
  const scope: Partial<WorkerScope> = globalThis as Partial<WorkerScope>;
  return typeof scope.postMessage === 'function' && typeof scope.addEventListener === 'function'
    ? (scope as WorkerScope)
    : null;
}

async function resolveHost(): Promise<Host> {
  // `self.postMessage` in a browser worker; `parentPort` under worker_threads.
  const scope = browserScope();
  if (scope) {
    return {
      post: (message) => scope.postMessage(message),
      subscribe: (handler) => scope.addEventListener('message', (event) => handler(event.data)),
    };
  }

  const { parentPort } = await import('node:worker_threads');
  if (!parentPort) throw new Error('code-retrainer worker started outside a worker context');
  return {
    post: (message) => parentPort.postMessage(message),
    subscribe: (handler) => parentPort.on('message', (message: WorkerRequest) => handler(message)),
  };
}

/**
 * Load Pyodide from wherever this build can reach it.
 *
 * The npm package works in Node and in bundlers; a browser build that prefers
 * the CDN passes an `indexUrl` and lets Pyodide fetch its own assets from
 * there, which keeps the deployed site to a few hundred kilobytes.
 */
/**
 * Adapt Pyodide's API to the narrow one this engine declares.
 *
 * Written out rather than cast, for two reasons: it documents exactly which
 * five capabilities are used, and Pyodide types `runPython` and `pyimport` as
 * returning `any`, which would otherwise spread untyped values through the
 * engine. Narrowing them here confines that to one adapter.
 */
const loadPyodideModule: PyodideLoader = async (options) => {
  const { loadPyodide } = await import('pyodide');
  const api = await loadPyodide(options);

  return {
    FS: {
      mkdirTree: (path: string) => api.FS.mkdirTree(path),
      writeFile: (path: string, data: string) => api.FS.writeFile(path, data),
    },
    globals: {
      set: (name: string, value: PyodideGlobal) => api.globals.set(name, value),
    },
    runPython: (code: string): PyodideResult => api.runPython(code),
    loadPackage: async (names: string | string[]) => {
      await api.loadPackage(names);
    },
    pyimport: (name: string): { install(spec: string): Promise<void> } => api.pyimport(name),
  };
};

export async function startWorker(loader: PyodideLoader = loadPyodideModule): Promise<void> {
  const host = await resolveHost();
  let engine: PyodideEngine | null = null;

  const succeed = (id: number, value: WorkerResultValue): void =>
    host.post({ id, ok: true, value });
  const fail = (id: number, error: string): void => host.post({ id, ok: false, error });

  host.subscribe((request) => {
    void (async () => {
      try {
        switch (request.kind) {
          case 'boot': {
            engine = await PyodideEngine.boot(loader, request.config, (message) =>
              host.post({ id: 0, kind: 'progress', message }),
            );
            succeed(request.id, engine.info);
            return;
          }
          case 'execute': {
            succeed(request.id, requireEngine(engine).execute(request));
            return;
          }
          case 'test': {
            succeed(request.id, requireEngine(engine).test(request));
            return;
          }
          case 'diagnose': {
            succeed(request.id, requireEngine(engine).diagnose(request));
            return;
          }
          case 'trace': {
            succeed(request.id, requireEngine(engine).trace(request));
            return;
          }
        }
      } catch (caught) {
        // Errors cross the boundary as text: an exception object does not
        // survive structured clone with anything useful attached.
        const error = toError(caught);
        fail(request.id, `${error.name}: ${error.message}`);
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
