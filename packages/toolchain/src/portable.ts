// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { runProcess } from '@code-retrainer/execution';

import { inheritedPath } from './discovery.ts';

/**
 * Installing a toolchain without administrator rights.
 *
 * The package-manager path is the right default and it has one hard limit:
 * Chocolatey, apt, dnf and pacman all need root or an elevated shell. On a
 * managed laptop — which is most corporate machines, and a good number of the
 * machines belonging to people between jobs — that is the end of the road, and
 * the honest report "run this from an elevated shell" is a dead end for
 * somebody who cannot.
 *
 * So there is a second path. Several toolchains publish a plain archive that
 * works from anywhere it is unpacked: Go and PHP both do, and neither needs a
 * registry entry, a service, or a single byte written outside the directory it
 * lands in. Unpacking one into `~/toolchains` needs no privileges at all, and
 * `discovery.ts` already looks there.
 *
 * Three properties make this safe enough to offer.
 *
 * **The checksum is verified against the vendor's own published value.** Go
 * publishes SHA-256 in its download index and PHP on its release page. A
 * download whose hash does not match is deleted, not unpacked — that check is
 * the only thing standing between a proxy and arbitrary code execution, so it
 * is not optional and there is no flag to skip it.
 *
 * **Nothing outside the target directory is touched.** No PATH edit, no
 * registry, no profile script. Removing a toolchain is deleting a folder.
 *
 * **It is still opt-in.** Same rule as the package-manager path: the plan is
 * printed, and `--yes` is what runs it.
 */
export interface PortableArchive {
  /** Where to download from, and what it should hash to. */
  readonly url: string;
  /** Lower-case hex SHA-256, as the vendor publishes it. */
  readonly sha256: string;
  /** Human size, for the plan: "75.3 MB". */
  readonly size: string;
  /**
   * A directory the archive creates that should be unwrapped.
   *
   * Go's archive contains a single `go/` directory; PHP's contains its files
   * at the root. Naming it lets both land at `~/toolchains/<language>`.
   */
  readonly stripRoot?: string;
}

export interface PortableSource {
  /** Directory under `~/toolchains` this unpacks into. */
  readonly directory: string;
  /**
   * Work out the download for this platform, asking the vendor if need be.
   *
   * A function rather than a table because the current version is not known
   * until it is looked up, and pinning one here would mean shipping a stale
   * toolchain until somebody remembered to edit this file.
   *
   * Returns null when there is no portable build for this platform — PHP on
   * Linux, say, where the distribution package is the right answer anyway.
   */
  resolve(): Promise<PortableArchive | null>;
}

export interface PortableStep {
  readonly label: string;
  readonly archive: PortableArchive;
  /** Absolute path this will unpack into. */
  readonly target: string;
}

/** `~/toolchains`, where an unprivileged install lands. */
export function portableRoot(): string {
  const home = process.env['USERPROFILE'] ?? process.env['HOME'] ?? tmpdir();
  return path.join(home, 'toolchains');
}

/**
 * Download, verify, and unpack.
 *
 * The download goes to a temporary file first and is only unpacked once its
 * hash matches. Unpacking straight from a stream would be faster and would
 * mean a corrupted or substituted archive had already written files by the
 * time anyone noticed.
 */
export async function installPortable(
  step: PortableStep,
  onProgress: (message: string) => void = () => {},
): Promise<{ ok: boolean; message: string }> {
  const staging = await mkdtemp(path.join(tmpdir(), 'retrainer-download-'));
  const archivePath = path.join(staging, path.basename(new URL(step.archive.url).pathname));

  try {
    onProgress(`downloading ${step.archive.size}`);

    const response = await fetch(step.archive.url);
    if (!response.ok) {
      return { ok: false, message: `download failed: HTTP ${response.status}` };
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = createHash('sha256').update(bytes).digest('hex');

    if (digest !== step.archive.sha256.toLowerCase()) {
      // Not a warning. A mismatch means the bytes are not what the vendor
      // published, and unpacking them would be running unknown code.
      return {
        ok: false,
        message:
          `checksum mismatch — expected ${step.archive.sha256}, got ${digest}. ` +
          'Nothing was unpacked.',
      };
    }

    await writeFile(archivePath, bytes);
    onProgress('verified, unpacking');

    await rm(step.target, { recursive: true, force: true });
    await mkdir(step.target, { recursive: true });

    const unpacked = await unpack(archivePath, step.target, step.archive.stripRoot);
    if (!unpacked.ok) return unpacked;

    return { ok: true, message: step.target };
  } catch (caught) {
    return { ok: false, message: caught instanceof Error ? caught.message : String(caught) };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

/**
 * Unpack a `.zip` or a `.tar.gz`.
 *
 * bsdtar first: it ships in Windows 10 and later as `System32\\tar.exe`, is the
 * default `tar` on macOS, and reads both formats. GNU tar — which is what Git
 * for Windows puts on PATH, and what most Linux boxes have — reads tar and
 * *not* zip, so finding "tar" on PATH is not enough to know a zip can be
 * opened.
 *
 * Python is the fallback, and is a reasonable one here rather than an odd
 * dependency: this product already requires Python for its own courses, and
 * `zipfile` and `tarfile` handle both formats identically on every platform.
 */
async function unpack(
  archive: string,
  target: string,
  stripRoot: string | undefined,
): Promise<{ ok: boolean; message: string }> {
  const strip = stripRoot ? ['--strip-components=1'] : [];

  for (const tar of tarCandidates()) {
    const outcome = await runProcess({
      command: tar,
      args: ['-xf', archive, '-C', target, ...strip],
      cwd: target,
      env: inheritedPath(),
      timeoutMs: 10 * 60_000,
      maxOutputBytes: 256 * 1024,
    });

    if (!outcome.spawnError && outcome.exitCode === 0) return { ok: true, message: 'unpacked' };
    // A tar that cannot read the format is not a reason to stop; the next
    // candidate, or Python, may manage it.
  }

  return unpackWithPython(archive, target, stripRoot);
}

function tarCandidates(): readonly string[] {
  if (process.platform !== 'win32') return ['tar'];

  // The system one first: Git for Windows puts GNU tar ahead of it on PATH,
  // and GNU tar cannot open a zip.
  const system = path.join(process.env['SYSTEMROOT'] ?? 'C:/Windows', 'System32', 'tar.exe');
  return existsSync(system) ? [system, 'tar'] : ['tar'];
}

async function unpackWithPython(
  archive: string,
  target: string,
  stripRoot: string | undefined,
): Promise<{ ok: boolean; message: string }> {
  const script = [
    'import pathlib, shutil, sys, tarfile, zipfile',
    'archive, target, strip = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3]',
    'opener = zipfile.ZipFile if zipfile.is_zipfile(archive) else tarfile.open',
    'with opener(archive) as handle: handle.extractall(target)',
    // The strip is done after extraction rather than by rewriting each member
    // name, because both libraries make that awkward and a move is atomic
    // enough for a directory nothing else is looking at yet.
    'root = target / strip if strip else None',
    'if root and root.is_dir():',
    '    for entry in list(root.iterdir()): shutil.move(str(entry), str(target / entry.name))',
    '    root.rmdir()',
  ].join('\n');

  for (const python of ['python3', 'python', 'py']) {
    const outcome = await runProcess({
      command: python,
      args: ['-c', script, archive, target, stripRoot ?? ''],
      cwd: target,
      env: inheritedPath(),
      timeoutMs: 10 * 60_000,
      maxOutputBytes: 256 * 1024,
    });

    if (!outcome.spawnError && outcome.exitCode === 0) return { ok: true, message: 'unpacked' };
    if (!outcome.spawnError) {
      return { ok: false, message: `could not unpack: ${outcome.stderr.slice(0, 400)}` };
    }
  }

  return {
    ok: false,
    message:
      'No archive tool available. Install Python 3, or unpack the download by hand into ' +
      portableRoot(),
  };
}

/* -- the sources ---------------------------------------------------------- */

interface GoFile {
  readonly filename?: string;
  readonly os?: string;
  readonly arch?: string;
  readonly kind?: string;
  readonly sha256?: string;
  readonly size?: number;
}

function megabytes(bytes: number | undefined): string {
  return bytes === undefined ? 'unknown size' : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function goArchitecture(): string {
  return process.arch === 'arm64' ? 'arm64' : process.arch === 'ia32' ? '386' : 'amd64';
}

/**
 * Go, from go.dev's own download index.
 *
 * The index is JSON, lists every build of the current release, and carries the
 * SHA-256 for each — so the version is never pinned here and the checksum
 * always comes from the vendor rather than from this file.
 */
export const goPortable: PortableSource = {
  directory: 'go',
  async resolve(): Promise<PortableArchive | null> {
    const response = await fetch('https://go.dev/dl/?mode=json');
    if (!response.ok) return null;

    const releases = (await response.json()) as { files?: readonly GoFile[] }[];
    const files = releases[0]?.files ?? [];

    const wanted = files.find(
      (file) =>
        file.os === platformName() && file.arch === goArchitecture() && file.kind === 'archive',
    );
    if (!wanted?.filename || !wanted.sha256) return null;

    return {
      url: `https://go.dev/dl/${wanted.filename}`,
      sha256: wanted.sha256,
      size: megabytes(wanted.size),
      stripRoot: 'go',
    };
  },
};

function platformName(): string {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'darwin';
  return 'linux';
}

/**
 * PHP, from windows.php.net.
 *
 * Windows only, and deliberately so: every other platform has a PHP in its
 * package manager that does not need elevation to be useful, and building one
 * from source is not something to do behind a progress bar.
 *
 * The release page publishes a SHA-256 beside each build, which is scraped
 * rather than assumed — a hard-coded hash would pin a version that stops being
 * downloadable when the next patch release lands.
 */
export const phpPortable: PortableSource = {
  directory: 'php',
  async resolve(): Promise<PortableArchive | null> {
    if (process.platform !== 'win32') return null;

    // The JSON index, not the plain-text checksum list: the text file
    // redirects and the JSON carries the version, the filename, the size and
    // the SHA-256 together, which is exactly what a verified download needs.
    const response = await fetch('https://windows.php.net/downloads/releases/releases.json', {
      redirect: 'follow',
    });
    if (!response.ok) return null;

    const index = (await response.json()) as Record<string, PhpBranch>;
    const architecture = process.arch === 'arm64' ? 'arm64' : 'x64';

    let best: { archive: PortableArchive; version: string } | null = null;

    for (const branch of Object.values(index)) {
      const version = branch.version;
      if (typeof version !== 'string') continue;

      for (const [build, value] of Object.entries(branch)) {
        // Non-thread-safe is the right build for a command-line PHP: the
        // thread-safe one exists for web servers that run PHP in-process, and
        // nothing here does.
        if (!build.startsWith('nts-') || !build.endsWith(architecture)) continue;

        // `version` is a string on the same object; everything else is a
        // build. The guard is what makes that distinction at run time.
        const zip = typeof value === 'object' ? value?.zip : undefined;
        if (!zip?.path || !zip.sha256) continue;
        if (best && compareVersions(version, best.version) <= 0) continue;

        best = {
          version,
          archive: {
            url: `https://windows.php.net/downloads/releases/${zip.path}`,
            sha256: zip.sha256,
            size: zip.size ?? 'unknown size',
          },
        };
      }
    }

    return best?.archive ?? null;
  },
};

interface PhpBuild {
  readonly zip?: { readonly path?: string; readonly sha256?: string; readonly size?: string };
}

/**
 * One branch of the PHP release index.
 *
 * The build keys are dynamic — `nts-vs17-x64`, `ts-vs17-x86` and so on — so
 * the index signature is unavoidable, but its *value* is not: every one of
 * them is a build description, and saying so keeps the field access below
 * checked rather than opaque.
 */
type PhpBranch = { readonly version?: string } & Record<string, PhpBuild | string | undefined>;

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
