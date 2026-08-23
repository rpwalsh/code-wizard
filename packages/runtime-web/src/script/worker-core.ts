// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type {
  ScriptExecuteResult,
  ScriptFile,
  ScriptRequest,
  ScriptResponse,
  ScriptTestResult,
} from './protocol.ts';
import { BoundedText } from './protocol.ts';

/**
 * Running a learner's JavaScript inside a Web Worker.
 *
 * The browser is already a JavaScript runtime, which makes this the one
 * language where the web build needs nothing downloaded, nothing compiled to
 * WebAssembly and nothing installed on the machine. Python needs ten megabytes
 * of interpreter; this needs a worker.
 *
 * ## How the modules are loaded
 *
 * Each file becomes a `blob:` URL, and the imports between them are rewritten
 * to point at the right blob before it is created. That is the only mechanism
 * a browser offers for importing a module graph that exists only in memory:
 * there is no filesystem to write to, and a data URL cannot import a relative
 * sibling.
 *
 * The rewrite is deliberately narrow. A specifier is rewritten only when it
 * resolves to a file that was actually supplied — `retrainer/test.js` finds the
 * harness because the harness is in the file set, while `react` finds nothing
 * and is left exactly as written, so the browser's own error names it rather
 * than this silently importing something else.
 *
 * ## Isolation
 *
 * A worker is a separate global with no DOM, no `window` and no access to the
 * page. It cannot touch the learner's progress, their storage or the UI. What
 * it *can* do is loop forever, which is why the page owns the clock and answers
 * a timeout by terminating the thread — a guarantee no cooperative
 * cancellation inside the worker could make.
 */

/** Where a blob URL was minted for each supplied path. */
type BlobMap = ReadonlyMap<string, string>;

/**
 * Every import specifier in a module, relative or bare.
 *
 * Bare ones matter as much as relative ones here: a test file written for the
 * desktop imports `retrainer/test.js`, which a browser cannot resolve because
 * there is no `node_modules` to look in. Mapping it onto the copy supplied in
 * the file set is what lets one test file run unchanged in both places.
 */
const SPECIFIER = /(\bfrom\s*|\bimport\s*|\bexport\s+[^;]*?\bfrom\s*)(['"])([^'"]+)\2/gu;

/**
 * The stand-in written into a module before its dependency has a URL.
 *
 * A printable, unmistakable prefix rather than a control character: it has to
 * survive being written to disk, read back and searched for, and a NUL byte in
 * a source file makes every ordinary tool treat that file as binary. No real
 * module specifier begins with this, so a collision is not possible in
 * practice.
 */
const PENDING = 'retrainer-pending:';
const PENDING_PATTERN = /retrainer-pending:([^'"]+)/gu;

/**
 * Resolve a specifier against the importing file.
 *
 * Bare specifiers are looked for under `node_modules`, which is where the
 * runtime puts the harness. Relative ones resolve against the importing file's
 * directory and are then retried with the extensions this product's module
 * graphs actually use — so `../main.js` finds `main.ts` after a transform has
 * renamed it, which is exactly what an exercise's test file needs.
 */
function resolve(from: string, specifier: string, available: ReadonlySet<string>): string | null {
  if (!specifier.startsWith('.')) {
    const vendored = `node_modules/${specifier}`;
    if (available.has(vendored)) return vendored;
    const asJs = vendored.replace(/\.[cm]?[jt]sx?$/u, '.js');
    return available.has(asJs) ? asJs : null;
  }

  const base = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
  const stack: string[] = [];

  for (const part of (base ? `${base}/${specifier}` : specifier).split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }

  const target = stack.join('/');
  if (available.has(target)) return target;

  const stem = target.replace(/\.[cm]?[jt]sx?$/u, '');
  for (const extension of ['.js', '.mjs', '.ts', '.tsx', '.jsx']) {
    if (available.has(stem + extension)) return stem + extension;
  }
  return null;
}

/**
 * Turn the file set into blob URLs, rewriting the imports between them.
 *
 * Two passes are unavoidable: a module's URL cannot exist until its text is
 * final, and its text is not final until every module it imports has a URL. The
 * loop mints URLs for whatever is fully resolved, repeatedly, until nothing
 * moves — then emits any remainder with its placeholders left in place, so a
 * cycle among the learner's own modules produces a real module error from the
 * browser instead of hanging here.
 */
function toBlobUrls(files: readonly ScriptFile[]): BlobMap {
  const available = new Set(files.map((file) => file.path));
  const urls = new Map<string, string>();

  const rewritten = files.map((file) => ({
    path: file.path,
    contents: file.contents.replace(
      SPECIFIER,
      (_match: string, lead: string, quote: string, specifier: string) => {
        const target = resolve(file.path, specifier, available);
        return target === null
          ? `${lead}${quote}${specifier}${quote}`
          : `${lead}${quote}${PENDING}${target}${quote}`;
      },
    ),
  }));

  const substitute = (text: string): string =>
    text.replace(PENDING_PATTERN, (whole: string, path: string) => urls.get(path) ?? whole);

  const settled = (text: string): boolean =>
    [...text.matchAll(PENDING_PATTERN)].every((match) => urls.has(match[1] ?? ''));

  const mint = (path: string, contents: string): void => {
    urls.set(path, URL.createObjectURL(new Blob([contents], { type: 'text/javascript' })));
  };

  // Bounded: every pass either mints a URL or the graph has a cycle, so
  // `files.length` passes is always enough and this cannot spin.
  for (let pass = 0; pass <= rewritten.length; pass += 1) {
    let progressed = false;
    for (const file of rewritten) {
      if (urls.has(file.path) || !settled(file.contents)) continue;
      mint(file.path, substitute(file.contents));
      progressed = true;
    }
    if (!progressed) break;
  }

  for (const file of rewritten) {
    if (!urls.has(file.path)) mint(file.path, substitute(file.contents));
  }

  return urls;
}

/**
 * Anything a learner might hand to `console.log`.
 *
 * Written out rather than left opaque, because the set really is closed —
 * these are the JavaScript value kinds — and an enumerated union says what is
 * being handled where an opaque type only says that something is.
 */
type Printable = string | number | boolean | bigint | symbol | object | null | undefined;

/** Capture everything the learner's code prints, bounded. */
function captureConsole(limit: number): {
  readonly out: BoundedText;
  readonly err: BoundedText;
  restore(): void;
} {
  const out = new BoundedText(limit);
  const err = new BoundedText(limit);
  const original = { ...console };

  const render = (values: readonly Printable[]): string =>
    values
      .map((value) => {
        if (typeof value === 'string') return value;
        try {
          return JSON.stringify(value) ?? String(value);
        } catch {
          // A cycle, or a BigInt. Neither is a reason to lose the line.
          return String(value);
        }
      })
      .join(' ');

  console.log = (...values: Printable[]) => out.push(`${render(values)}\n`);
  console.info = console.log;
  console.debug = console.log;
  console.warn = (...values: Printable[]) => err.push(`${render(values)}\n`);
  console.error = console.warn;

  return { out, err, restore: () => Object.assign(console, original) };
}

function revoke(urls: BlobMap): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
}

function describe(caught: Printable): string {
  return caught instanceof Error ? (caught.stack ?? caught.message) : String(caught);
}

async function execute(
  request: Extract<ScriptRequest, { kind: 'execute' }>,
): Promise<ScriptExecuteResult> {
  const urls = toBlobUrls(request.files);
  const capture = captureConsole(request.maxOutputBytes);
  let exitCode = 0;

  try {
    const entry = urls.get(request.entryPoint);
    if (!entry) throw new Error(`No such file: ${request.entryPoint}`);
    await import(/* @vite-ignore */ entry);
  } catch (caught) {
    exitCode = 1;
    capture.err.push(`${describe(caught as Printable)}\n`);
  } finally {
    capture.restore();
    revoke(urls);
  }

  return {
    exitCode,
    stdout: capture.out.text,
    stderr: capture.err.text,
    truncated: capture.out.truncated || capture.err.truncated,
  };
}

async function test(request: Extract<ScriptRequest, { kind: 'test' }>): Promise<ScriptTestResult> {
  const urls = toBlobUrls(request.files);
  const capture = captureConsole(request.maxOutputBytes);
  let report = '';

  try {
    // The harness the desktop build runs, unchanged. It was written to know
    // nothing about files or processes precisely so that this could import it
    // and get a byte-identical report.
    const runnerUrl = urls.get('node_modules/retrainer/run.js');
    if (!runnerUrl) throw new Error('The test harness was not supplied to the worker.');

    // Declared rather than inferred: it arrives through a blob URL, which no
    // compiler can look inside.
    const runner = (await import(/* @vite-ignore */ runnerUrl)) as {
      runTargets(
        targets: readonly { path: string; load: () => Promise<object> }[],
      ): Promise<object>;
    };

    const document = await runner.runTargets(
      request.testFiles.map((path) => ({
        path,
        load: async () => {
          const url = urls.get(path);
          if (!url) throw new Error(`No such test file: ${path}`);
          return (await import(/* @vite-ignore */ url)) as object;
        },
      })),
    );

    report = JSON.stringify(document);
  } catch (caught) {
    capture.err.push(`${describe(caught as Printable)}\n`);
  } finally {
    capture.restore();
    revoke(urls);
  }

  return {
    report,
    stdout: capture.out.text,
    stderr: capture.err.text,
    truncated: capture.out.truncated || capture.err.truncated,
  };
}

/**
 * Wire the worker's message port to the two operations.
 *
 * Exported rather than executed, so the entry point is one line in the app and
 * the amount of logic that can only run inside a worker — where there is no
 * console and no breakpoint by default — stays at zero.
 */
export function serveScriptWorker(
  post: (message: ScriptResponse) => void,
): (request: ScriptRequest) => void {
  return (request: ScriptRequest) => {
    void (async () => {
      try {
        if (request.kind === 'execute') {
          post({ id: request.id, ok: true, kind: 'execute', result: await execute(request) });
        } else {
          post({ id: request.id, ok: true, kind: 'test', result: await test(request) });
        }
      } catch (caught) {
        post({ id: request.id, ok: false, error: describe(caught as Printable) });
      }
    })();
  };
}
