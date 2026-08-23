// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Real HTTP both ways, and the clock that cannot run backward.
 */
import http from 'node:http';
import { performance } from 'node:perf_hooks';

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

export function createApp() {
  return http.createServer((request, response) => {
    // request.url is only the path; the URL class needs a base.
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/health') {
      send(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/echo') {
      send(response, 200, { echo: url.searchParams.get('msg') ?? '' });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/sum') {
      let raw = '';
      request.on('data', (chunk) => {
        raw += chunk;
      });
      request.on('end', () => {
        try {
          const values = JSON.parse(raw);
          if (!Array.isArray(values)) throw new Error('not an array');
          send(response, 200, { sum: values.reduce((total, n) => total + n, 0) });
        } catch {
          send(response, 400, { error: 'bad json' });
        }
      });
      return;
    }

    send(response, 404, { error: 'not found' });
  });
}

export function startServer(app) {
  return new Promise((resolve) => {
    // Port 0: the OS picks a free port and no two runs can collide.
    app.listen(0, () => {
      resolve({
        port: app.address().port,
        // A server left listening keeps the process alive — the suite
        // that "hangs at the end" almost always forgot this promise.
        close: () => new Promise((done) => app.close(done)),
      });
    });
  });
}

export async function fetchJson(url, options = {}) {
  const { timeoutMs = 2000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    // A fired-and-forgotten timer keeps the loop alive past the last test.
    clearTimeout(timer);
  }
}

export async function timed(fn) {
  // Monotonic by contract; Date.now steps backward under NTP correction
  // exactly often enough to poison a latency dashboard.
  const before = performance.now();
  const result = await fn();
  return { result, elapsedMs: performance.now() - before };
}
