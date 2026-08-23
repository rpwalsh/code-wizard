// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';

import {
  detectManagers,
  installPortable,
  planInstall,
  portableRoot,
  runInstall,
  type InstallablePackage,
  type PortableStep,
} from '@code-retrainer/toolchain';

import { buildRegistry, installableLanguages } from '../context.ts';
import { formatDiagnosis } from '../format-results.ts';
import { heading, indent, pluralize, style, symbol } from '../terminal.ts';

/**
 * Parsed command-line flags.
 *
 * The shape node:util's parseArgs produces: a declared string option yields a
 * string, a boolean option a boolean, and a repeated option an array.
 */
export type FlagValue = string | boolean | (string | boolean)[];

export type Flags = Record<string, FlagValue | undefined>;

function flagString(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

export async function runRuntimeCommand(args: readonly string[], flags: Flags): Promise<number> {
  const [subcommand] = args;

  switch (subcommand) {
    case 'doctor':
      return doctor(flags);
    case 'list':
      return list();
    case 'install':
      return install(args.slice(1), flags);
    default:
      console.error(style.red(`Unknown runtime command "${subcommand ?? ''}".`));
      console.error('Try: code-retrainer runtime doctor | list | install');
      return 2;
  }
}

/**
 * Proves the toolchain works rather than merely reporting versions: the doctor
 * actually executes code, actually trips a timeout, and actually overflows an
 * output buffer (spec §41).
 */
async function doctor(flags: Flags): Promise<number> {
  const registry = buildRegistry();
  const requested = flagString(flags, 'language');
  const languages = requested ? [requested] : registry.languages().map((entry) => entry.id);

  let allReady = true;
  for (const languageId of languages) {
    if (!registry.has(languageId)) {
      console.error(style.red(`No runtime registered for "${languageId}".`));
      return 2;
    }
    const runtime = registry.get(languageId);
    console.log(heading(`Code Retrainer Runtime Diagnostics — ${runtime.metadata().displayName}`));
    const diagnosis = await runtime.doctor();
    console.log(formatDiagnosis(diagnosis));
    allReady &&= diagnosis.ready;
  }

  return allReady ? 0 : 1;
}

function list(): number {
  const registry = buildRegistry();
  console.log(heading('Registered language runtimes'));
  for (const metadata of registry.languages()) {
    console.log(`${metadata.id}  ${style.gray(metadata.displayName)}`);
  }
  return 0;
}

/**
 * Install the toolchains this machine is missing.
 *
 * Prints the plan and stops. Running it needs `--yes`, because a command that
 * installs software as a side effect of being run is a command nobody should
 * trust with a shell — and because on several platforms these need
 * administrator or root, which is not something to spring on somebody.
 *
 * With no arguments it installs whatever `doctor` reports as missing. With
 * language ids it installs exactly those, whether or not they are already
 * present, which is what you want when a toolchain is installed and broken.
 */
async function install(requested: readonly string[], flags: Flags): Promise<number> {
  const registry = buildRegistry();
  const known = installableLanguages();

  let wanted: readonly InstallablePackage[];

  if (requested.length > 0) {
    const unknown = requested.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      console.error(style.red(`Not an installable language: ${unknown.join(', ')}`));
      console.error(`Try: ${[...known.keys()].sort().join(', ')}`);
      return 2;
    }
    wanted = requested.map((id) => known.get(id)!);
  } else {
    console.log(style.gray('Checking which toolchains are missing…'));
    const missing: InstallablePackage[] = [];

    for (const language of registry.languages()) {
      const item = known.get(language.id);
      if (!item) continue;
      const diagnosis = await registry.get(language.id).doctor();
      if (!diagnosis.ready) missing.push(item);
    }

    // Deduplication happens in `planInstall`, keyed on the package a manager
    // would actually install — which is the only key that is right. Two
    // languages can share a package under one manager and not under another.
    wanted = missing;
    console.log('');
  }

  if (wanted.length === 0) {
    console.log(heading('Toolchains'));
    console.log(indent(style.green('Every language already builds and runs here.')));
    return 0;
  }

  const managers = await detectManagers();
  const plan = planInstall(wanted, managers);

  /*
   * The unprivileged route, offered where the managed one needs a right the
   * person may not have.
   *
   * Every package manager on Windows and Linux installs as root. On a machine
   * where they are not an administrator — a work laptop, a locked-down
   * desktop — the managed plan is a dead end, and "run this from an elevated
   * shell" is not advice they can act on. A published archive unpacked into
   * their own home directory is.
   *
   * It is preferred whenever the managed step would need elevation, and used
   * as the only option when no manager can install the thing at all.
   */
  const portable: PortableStep[] = [];
  const managed = [];

  for (const step of plan.steps) {
    const source = wanted.find((item) => step.languages.includes(item.language))?.portable;
    const archive = step.manager.elevated && source ? await source.resolve() : null;

    if (archive && source) {
      portable.push({
        label: step.label,
        archive,
        target: path.join(portableRoot(), source.directory),
      });
    } else {
      managed.push(step);
    }
  }

  for (const entry of plan.unavailable) {
    const source = wanted.find((item) => item.label === entry.label)?.portable;
    const archive = source ? await source.resolve() : null;
    if (archive && source) {
      portable.push({
        label: entry.label,
        archive,
        target: path.join(portableRoot(), source.directory),
      });
    }
  }

  const covered = new Set(portable.map((step) => step.label));
  const stranded = plan.unavailable.filter((entry) => !covered.has(entry.label));

  console.log(heading(`Install ${pluralize(wanted.length, 'toolchain')}`));

  if (managed.length > 0) {
    console.log(indent(style.gray("Through this machine's package manager:")));
    for (const step of managed) {
      console.log(indent(`${step.label}  ${style.gray(`(${step.manager.id})`)}`));
      console.log(indent(style.gray(`${step.command} ${step.args.join(' ')}`), 4));
    }
    console.log('');
  }

  if (portable.length > 0) {
    console.log(
      indent(
        style.gray(
          `Downloaded and unpacked into ${portableRoot()} — no administrator rights needed:`,
        ),
      ),
    );
    for (const step of portable) {
      console.log(indent(`${step.label}  ${style.gray(`(${step.archive.size})`)}`));
      console.log(indent(style.gray(step.archive.url), 4));
      console.log(indent(style.gray(`sha256 ${step.archive.sha256.slice(0, 16)}… (verified)`), 4));
    }
    console.log('');
  }

  for (const entry of stranded) {
    console.log(indent(`${symbol.warn} ${entry.label}`));
    console.log(indent(style.yellow(entry.reason), 4));
  }

  if (managed.length === 0 && portable.length === 0) {
    console.log(indent(style.red('Nothing here can install these automatically.')));
    return 1;
  }

  if (managed.some((step) => step.manager.elevated)) {
    console.log(
      indent(
        style.yellow(
          'Some of these need administrator or root. Run this from an elevated shell — ' +
            'nothing here will elevate itself.',
        ),
      ),
    );
    console.log('');
  }

  if (flags['yes'] !== true) {
    console.log(indent('Nothing has been installed. Add --yes to run the plan above.'));
    return 0;
  }

  let failed = 0;

  if (managed.length > 0) {
    const outcomes = await runInstall({ ...plan, steps: managed }, (step) => {
      console.log(`${symbol.bullet} ${step.label}…`);
    });

    for (const outcome of outcomes) {
      if (outcome.ok) {
        console.log(`${symbol.pass} ${outcome.step.label}`);
        continue;
      }
      failed += 1;
      console.log(`${symbol.fail} ${outcome.step.label}`);
      console.log(indent(style.gray(outcome.output.split('\n').slice(-6).join('\n')), 4));
    }
  }

  for (const step of portable) {
    console.log(`${symbol.bullet} ${step.label}…`);
    const result = await installPortable(step, (message) => {
      console.log(indent(style.gray(message), 4));
    });

    if (result.ok) {
      console.log(`${symbol.pass} ${step.label} — ${relativeHome(result.message)}`);
    } else {
      failed += 1;
      console.log(`${symbol.fail} ${step.label}`);
      console.log(indent(style.red(result.message), 4));
    }
  }

  console.log('');
  if (plan.needsNewShell && managed.length > 0) {
    // The commonest follow-up question, answered before it is asked: the
    // installer edited PATH and this process still has the old one. A portable
    // install needs no new shell, because nothing put it on PATH in the first
    // place — the product looks in `~/toolchains` directly.
    console.log(
      indent(
        style.yellow(
          'Open a new terminal before checking anything installed by a package manager. ' +
            'Anything unpacked into your home directory is found without one.',
        ),
      ),
    );
  }
  console.log(indent('Then run: code-retrainer runtime doctor'));

  return failed > 0 ? 1 : 0;
}

/** `~/toolchains/go` reads better than a forty-character absolute path. */
function relativeHome(absolute: string): string {
  const home = process.env['USERPROFILE'] ?? process.env['HOME'] ?? '';
  return home && absolute.startsWith(home)
    ? `~${absolute.slice(home.length).split('\\').join('/')}`
    : absolute;
}
