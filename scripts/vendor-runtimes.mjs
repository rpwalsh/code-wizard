#!/usr/bin/env node
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Copy the WebAssembly runtimes into the web build, so the site works offline.
 *
 * The first version of this product fetched Pyodide from a CDN. That is the
 * conventional choice and it is wrong for this product, for three reasons that
 * only became clear once there was something to be wrong about.
 *
 * **It is not offline.** A tool for practicing on a train, in a waiting room,
 * or on a laptop with no connection cannot depend on a network round trip to
 * start. That is exactly the situation someone between jobs is often in.
 *
 * **It is a third party in the trust boundary.** The product's claim is that it
 * talks to nothing. "Nothing except a CDN" is a different, weaker claim, and it
 * is one a learner cannot verify without reading a network tab.
 *
 * **It can disappear.** A pinned version on someone else's infrastructure is
 * still someone else's infrastructure.
 *
 * The cost is honest and it is the whole argument against doing this: about
 * twenty-four megabytes of WebAssembly in the deploy. It is cached after the
 * first load, it is the same bytes a CDN would have served, and it buys a
 * product that works with the network unplugged.
 *
 * Run with: node scripts/vendor-runtimes.mjs
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'apps', 'web', 'public', 'runtime');

/** Where a package actually lives, resolved rather than assumed. */
function packageRoot(name) {
  return path.dirname(require.resolve(`${name}/package.json`));
}

/**
 * Pyodide: the interpreter, its standard library, and the wheels pytest needs.
 *
 * The curriculum is standard-library Python by design, so almost nothing is
 * installed at runtime — but the *test harness* is pytest, and pytest is a
 * package rather than part of the stdlib. Its wheels and micropip's come to
 * about six hundred kilobytes, which is nothing beside the interpreter.
 *
 * Leaving them out was the first version of this script, and the symptom was
 * exact and unhelpful: the interpreter booted, then every exercise reported
 * `runtime-unavailable` because `pyimport('micropip')` found nothing. Whatever
 * the package ships is copied wholesale for that reason — guessing at a
 * dependency list is how this breaks again on the next Pyodide release.
 */
const PYODIDE_FILES = [
  { name: 'pyodide.asm.wasm', required: true },
  // The loader shim. Which extension the package ships has changed between
  // Pyodide releases, so both are looked for and at least one must be found.
  { name: 'pyodide.asm.mjs', required: false },
  { name: 'pyodide.asm.js', required: false },
  { name: 'pyodide.mjs', required: false },
  { name: 'pyodide.js', required: false },
  { name: 'pyodide-lock.json', required: true },
  { name: 'python_stdlib.zip', required: true },
  { name: 'package.json', required: true },
];

async function vendorPyodide() {
  const source = packageRoot('pyodide');
  const destination = path.join(target, 'pyodide');
  await mkdir(destination, { recursive: true });

  let copied = 0;
  const found = [];

  for (const file of PYODIDE_FILES) {
    try {
      await cp(path.join(source, file.name), path.join(destination, file.name));
      copied += (await stat(path.join(destination, file.name))).size;
      found.push(file.name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      // A missing *required* file is a broken deploy that only shows up as a
      // failed fetch in a worker — the least debuggable failure this build can
      // produce. The first version of this script skipped silently and shipped
      // a site where Python never started.
      if (file.required) {
        throw new Error(
          `Pyodide is missing ${file.name}. The installed package may be a different ` +
            'layout than this script expects; update PYODIDE_FILES.',
        );
      }
    }
  }

  if (!found.some((name) => name.startsWith('pyodide.asm.'))) {
    throw new Error('Pyodide shipped no pyodide.asm.* loader; nothing would boot.');
  }

  // Every wheel the package ships. There are a dozen and they are pytest and
  // its dependencies; copying the directory rather than a hand-written list
  // means a new transitive dependency in a future release cannot silently go
  // missing.
  let wheels = 0;
  for (const entry of await readdir(source)) {
    if (!entry.endsWith('.whl')) continue;
    await cp(path.join(source, entry), path.join(destination, entry));
    wheels += (await stat(path.join(destination, entry))).size;
  }

  if (wheels === 0) {
    throw new Error('Pyodide shipped no wheels; pytest could not be installed offline.');
  }

  return { name: 'Pyodide (CPython + pytest)', bytes: copied + wheels };
}

/**
 * esbuild's WebAssembly build, for TypeScript and JSX in the browser.
 *
 * Only the `.wasm` is vendored: the JavaScript half is a normal dependency and
 * goes through the bundler like any other module, where it is code-split and
 * fetched only when a TypeScript or React exercise is opened.
 */
async function vendorEsbuild() {
  const source = path.join(packageRoot('esbuild-wasm'), 'esbuild.wasm');
  const destination = path.join(target, 'esbuild', 'esbuild.wasm');
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
  return { name: 'esbuild (TypeScript and JSX)', bytes: (await stat(destination)).size };
}

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    total += entry.isDirectory() ? await directorySize(full) : (await stat(full)).size;
  }
  return total;
}

// A clean copy every time: a stale runtime left from a previous version is the
// kind of thing that works locally and fails once deployed.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const results = [await vendorPyodide(), await vendorEsbuild()];

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

console.log('Vendored runtimes');
console.log('─────────────────');
for (const result of results) {
  console.log(`  ${result.name.padEnd(32)} ${megabytes(result.bytes).padStart(8)}`);
}
console.log(`  ${'total'.padEnd(32)} ${megabytes(await directorySize(target)).padStart(8)}`);
console.log('');
console.log('  The site now runs with no network at all.');
