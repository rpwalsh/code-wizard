#!/usr/bin/env node
/**
 * Put the copyright notice at the top of every file that can carry a comment.
 *
 * Run with: node scripts/add-copyright.mjs [--check]
 *
 * Idempotent: a file that already carries the notice is left exactly as it is,
 * so this is safe to run repeatedly and safe to run in CI with `--check`, which
 * reports what is missing and changes nothing.
 *
 * Two exclusions are deliberate and matter more than the rest of this file.
 *
 * **Vendored third-party code is never stamped.** `apps/web/public/runtime/`
 * holds Pyodide and esbuild, which belong to their own authors under their own
 * licenses. Putting this project's copyright on somebody else's build output
 * would be a false claim of authorship — the one thing a copyright header must
 * never do.
 *
 * **JSON cannot carry a comment at all.** The format has no syntax for one, and
 * the `//`-tolerating parsers are a convention rather than the standard. Those
 * files are reported rather than mangled.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NOTICE = 'Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Directories never descended into. */
const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', '.git', '.results', 'renderer', '.vite']);

/**
 * Paths never touched, matched against the repository-relative path.
 *
 * The runtime directory is other people's code; the content bundles and
 * generated sources are build output that is rewritten wholesale.
 */
const SKIP_PATHS = [
  'apps/web/public/runtime/',
  'apps/web/public/content/',
  'apps/desktop/content/',
  'apps/web/src/assets/',
];

/**
 * How each extension carries a comment, and what has to stay on line one.
 *
 * `prefix` wraps the notice. `after` is a pattern that must remain first in the
 * file — a shebang, or PHP's opening tag — with the notice inserted below it.
 */
const STYLES = [
  { extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.cs', '.go', '.rs'], line: '// ' },
  { extensions: ['.c', '.h', '.cpp', '.hpp', '.cc'], line: '// ' },
  { extensions: ['.py', '.yaml', '.yml', '.toml', '.sh'], line: '# ' },
  { extensions: ['.php'], line: '// ', after: /^<\?php\r?\n/u },
  { extensions: ['.sql'], line: '-- ' },
  { extensions: ['.css'], block: ['/* ', ' */'] },
  { extensions: ['.md', '.html'], block: ['<!-- ', ' -->'] },
];

/** Formats with no comment syntax at all. Reported, never edited. */
const IMPOSSIBLE = new Set([
  '.json',
  // TypeScript's incremental build cache: JSON, regenerated on every build.
  '.tsbuildinfo',
  '.png',
  '.jpg',
  '.webp',
  '.zip',
  '.whl',
  '.wasm',
  '.pyc',
]);

/** Files with no extension that still take a comment, matched by name. */
const BY_NAME = new Map([
  ['_headers', '# '],
  ['_redirects', '# '],
  ['Dockerfile', '# '],
  ['.gitattributes', '# '],
]);

function styleFor(file) {
  const named = BY_NAME.get(path.basename(file));
  if (named !== undefined) return { line: named };

  const extension = path.extname(file).toLowerCase();
  return STYLES.find((style) => style.extensions.includes(extension)) ?? null;
}

function render(style) {
  return style.block ? `${style.block[0]}${NOTICE}${style.block[1]}` : `${style.line}${NOTICE}`;
}

/**
 * A shebang, or anything else the language insists comes first.
 *
 * `#!/usr/bin/env node` stops being a shebang the moment anything precedes it,
 * and `<?php` after a comment means the comment is emitted as page output.
 * Both would be broken by a naive prepend.
 */
function split(contents, style) {
  const shebang = /^#![^\n]*\r?\n/u.exec(contents);
  if (shebang) return [shebang[0], contents.slice(shebang[0].length)];

  if (style.after) {
    const opener = style.after.exec(contents);
    if (opener) return [opener[0], contents.slice(opener[0].length)];
  }

  return ['', contents];
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRECTORIES.has(entry.name)) continue;

    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const check = process.argv.includes('--check');

const stamped = [];
const already = [];
const impossible = [];
const unknown = [];

for await (const file of walk(root)) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (SKIP_PATHS.some((prefix) => relative.startsWith(prefix))) continue;

  const extension = path.extname(file).toLowerCase();
  if (IMPOSSIBLE.has(extension)) {
    impossible.push(relative);
    continue;
  }

  const style = styleFor(file);
  if (!style) {
    unknown.push(relative);
    continue;
  }

  // A generated file that is about to be rewritten is still worth stamping:
  // the generator emits the notice too, so the two agree.
  const contents = await readFile(file, 'utf8');
  if (contents.includes(NOTICE)) {
    already.push(relative);
    continue;
  }

  stamped.push(relative);
  if (check) continue;

  const [head, body] = split(contents, style);
  await writeFile(file, `${head}${render(style)}\n${body}`, 'utf8');
}

const report = (label, list) => {
  if (list.length === 0) return;
  console.log(`  ${String(list.length).padStart(4)}  ${label}`);
};

console.log(check ? 'Copyright notice — check' : 'Copyright notice');
console.log('─────────────────────────');
report(check ? 'missing the notice' : 'stamped', stamped);
report('already had it', already);
report('cannot carry a comment (JSON, images, archives)', impossible);
report('unrecognized extension, left alone', unknown);

if (unknown.length > 0) {
  console.log('');
  console.log('  Unrecognized:');
  for (const file of unknown.slice(0, 20)) console.log(`    ${file}`);
}

if (check && stamped.length > 0) {
  console.log('');
  console.error(`${stamped.length} file(s) are missing the notice. Run: npm run copyright`);
  process.exitCode = 1;
}

void stat;
