// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { ScriptRequest, ScriptResponse } from '@code-retrainer/runtime-web';
import { serveScriptWorker } from '@code-retrainer/runtime-web';

/**
 * The worker that runs a learner's JavaScript.
 *
 * One line of wiring: everything else lives in `serveScriptWorker`, which is
 * importable by a test and knows nothing about `self`. Workers are the one
 * place where a bug is invisible — no console, no breakpoint by default — so
 * the amount of logic that can only run here is kept at zero.
 */
const post = (message: ScriptResponse): void => {
  self.postMessage(message);
};

const handle = serveScriptWorker(post);

self.onmessage = (event: MessageEvent<ScriptRequest>) => {
  handle(event.data);
};
