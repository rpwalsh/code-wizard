// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The Content Security Policy shipped with the production build.
 *
 * This is what makes "nothing leaves your machine" a property of the runtime
 * rather than a property of the source. A grep over `apps/web/src` can only
 * prove that *this repository* names no external host; it can say nothing
 * about the megabytes of dependencies compiled in beside it. The browser can,
 * and does: with no host in `connect-src`, `img-src` or `script-src`, a
 * request off this origin is refused by the browser before it is made,
 * whoever wrote the code that asked for it.
 *
 * Every relaxation below is here because something the product genuinely does
 * requires it, and each is scheme-limited rather than host-limited, so none of
 * them can name somewhere else:
 *
 * - `wasm-unsafe-eval` — Python and the TypeScript transformer are
 *   WebAssembly, and compiling a module counts as evaluation.
 * - `blob:` in `script-src` and `worker-src` — a learner's own modules are
 *   assembled into a blob module graph and run in a worker. The blob is built
 *   in the page from text the learner typed.
 * - `'unsafe-inline'` in `style-src` — the editor injects its theme as a
 *   style element at runtime. Styles cannot exfiltrate anything here because
 *   no host is reachable to send it to.
 * - `data:` in `img-src` and `font-src` — inlined assets from the bundle.
 * - `file:` throughout — the desktop build loads the same HTML from disk,
 *   where the document origin is opaque and `'self'` matches nothing. It is
 *   inert on the web, since a page served over http(s) cannot fetch `file:`
 *   URLs regardless of policy.
 *
 * `frame-ancestors`, `report-uri` and `sandbox` are deliberately absent: they
 * are ignored when a policy is delivered in a meta element, and listing them
 * would suggest a protection that is not actually in force.
 */
const DIRECTIVES: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'self'", 'file:'],
  'script-src': ["'self'", 'file:', "'wasm-unsafe-eval'", 'blob:'],
  'worker-src': ["'self'", 'file:', 'blob:'],
  'style-src': ["'self'", 'file:', "'unsafe-inline'"],
  'img-src': ["'self'", 'file:', 'data:', 'blob:'],
  'font-src': ["'self'", 'file:', 'data:'],
  // The directive that matters most: every way a page can speak to a server —
  // fetch, XHR, WebSocket, EventSource, sendBeacon — is governed here.
  'connect-src': ["'self'", 'file:', 'blob:', 'data:'],
  'media-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};

export const CONTENT_SECURITY_POLICY = Object.entries(DIRECTIVES)
  .map(([name, values]) => `${name} ${values.join(' ')}`)
  .join('; ');

/** The directives, for tests that check one of them rather than the string. */
export const CSP_DIRECTIVES = DIRECTIVES;
