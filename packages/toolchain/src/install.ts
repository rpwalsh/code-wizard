// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { runProcess } from '@code-retrainer/execution';

import { inheritedPath } from './discovery.ts';
import type { PortableSource } from './portable.ts';

/**
 * Installing the toolchains, rather than telling someone else to.
 *
 * "Install Go 1.21 or later from https://go.dev/dl/" is honest and it is
 * still a chore: find the page, pick the right architecture, run an
 * installer, restart the shell, come back. A product that knows exactly what
 * is missing and exactly how this machine installs things should offer to do
 * it.
 *
 * Three rules keep that from being alarming.
 *
 * **Nothing runs without being asked for.** The default prints the plan —
 * every command, verbatim, in the order it would run — and stops. Executing
 * requires `--yes`. A tool that installs software as a side effect of a
 * diagnostic command is a tool nobody should trust with a shell.
 *
 * **Nothing is elevated silently.** Where a manager needs administrator or
 * root, the plan says so up front rather than surprising someone with a UAC
 * prompt half way through, and the command is never re-run under `sudo`
 * automatically.
 *
 * **Only the machine's own package manager is used.** Nothing here downloads
 * an installer from a URL, and nothing pipes a script into a shell. Whatever
 * winget, Homebrew or apt would have installed is what gets installed, with
 * that manager's signing and its uninstall path intact.
 */
export type PackageManager = 'winget' | 'choco' | 'scoop' | 'brew' | 'apt' | 'dnf' | 'pacman';

export interface ManagerSpec {
  readonly id: PackageManager;
  readonly command: string;
  /** Arguments that install a package without prompting. */
  install(packageName: string): readonly string[];
  /** True when the install needs administrator or root. */
  readonly elevated: boolean;
  readonly platforms: readonly NodeJS.Platform[];
  /** How to get the manager itself, if it is missing. */
  readonly obtain: string;
}

/**
 * The managers this knows how to drive, in preference order per platform.
 *
 * winget before Chocolatey on Windows because it ships with the OS and needs
 * no elevation for most packages; Homebrew on macOS because it is the only
 * one anybody has; apt then dnf then pacman on Linux, which covers nearly
 * everything and fails clearly on the rest.
 */
export const MANAGERS: readonly ManagerSpec[] = [
  {
    id: 'winget',
    command: 'winget',
    install: (name) => [
      'install',
      '--id',
      name,
      '--exact',
      '--silent',
      '--accept-package-agreements',
      '--accept-source-agreements',
    ],
    elevated: false,
    platforms: ['win32'],
    obtain:
      'winget ships with Windows 11 and recent Windows 10; update "App Installer" from the Microsoft Store.',
  },
  {
    id: 'choco',
    command: 'choco',
    install: (name) => ['install', name, '-y', '--no-progress'],
    elevated: true,
    platforms: ['win32'],
    obtain: 'See https://chocolatey.org/install — installation itself needs an elevated shell.',
  },
  {
    id: 'scoop',
    command: 'scoop',
    install: (name) => ['install', name],
    elevated: false,
    platforms: ['win32'],
    obtain: 'See https://scoop.sh.',
  },
  {
    id: 'brew',
    command: 'brew',
    install: (name) => ['install', name],
    elevated: false,
    platforms: ['darwin', 'linux'],
    obtain: 'See https://brew.sh.',
  },
  {
    id: 'apt',
    command: 'apt-get',
    install: (name) => ['install', '-y', name],
    elevated: true,
    platforms: ['linux'],
    obtain: 'Debian, Ubuntu and derivatives have it already.',
  },
  {
    id: 'dnf',
    command: 'dnf',
    install: (name) => ['install', '-y', name],
    elevated: true,
    platforms: ['linux'],
    obtain: 'Fedora, RHEL and derivatives have it already.',
  },
  {
    id: 'pacman',
    command: 'pacman',
    install: (name) => ['-S', '--noconfirm', name],
    elevated: true,
    platforms: ['linux'],
    obtain: 'Arch and derivatives have it already.',
  },
];

/**
 * What a language is called in each package manager.
 *
 * Written out per manager rather than guessed, because the names genuinely
 * differ — the Go toolchain is `GoLang.Go` to winget, `golang` to Chocolatey
 * and Homebrew, `golang-go` to apt and `go` to pacman — and a wrong guess
 * either installs nothing or installs something else.
 *
 * A language absent from a manager's map means that manager cannot install
 * it, and the plan says so rather than inventing a name.
 */
export type PackageNames = Partial<Record<PackageManager, string>>;

export interface InstallablePackage {
  /**
   * An unprivileged fallback, when no package manager here can do the job.
   *
   * Every manager on Windows and Linux needs elevation, so on a machine where
   * the person is not an administrator the package-manager plan is a dead end.
   * A published archive unpacked into their own home directory is not.
   */
  readonly portable?: PortableSource;

  /** The language id this satisfies. */
  readonly language: string;
  /** Human name, for the plan. */
  readonly label: string;
  readonly packages: PackageNames;
  /** Shown when no manager on this machine can install it. */
  readonly manual: string;
  /**
   * True when a new shell is needed before the tool is on PATH.
   *
   * Almost always, on Windows especially: the installer edits the machine's
   * PATH and the already-running process keeps the environment it started
   * with. Saying so afterwards prevents "I installed it and it still says it
   * is missing", which is the commonest support question any tool like this
   * gets.
   */
  readonly needsNewShell: boolean;
}

export interface PlannedInstall {
  /** Every language this one install satisfies. */
  readonly languages: readonly string[];
  readonly label: string;
  readonly manager: ManagerSpec;
  readonly packageName: string;
  readonly command: string;
  readonly args: readonly string[];
}

export interface InstallPlan {
  readonly steps: readonly PlannedInstall[];
  /** Languages nothing on this machine can install, with what to do instead. */
  readonly unavailable: readonly { readonly label: string; readonly reason: string }[];
  /** True when at least one step needs administrator or root. */
  readonly needsElevation: boolean;
  readonly needsNewShell: boolean;
}

/** Which managers are actually installed here, in preference order. */
export async function detectManagers(): Promise<readonly ManagerSpec[]> {
  const candidates = MANAGERS.filter((manager) => manager.platforms.includes(process.platform));

  const found: ManagerSpec[] = [];
  for (const manager of candidates) {
    const outcome = await runProcess({
      command: manager.command,
      args: ['--version'],
      cwd: process.cwd(),
      env: inheritedPath(),
      timeoutMs: 20_000,
      maxOutputBytes: 32 * 1024,
    });
    // pacman answers `--version` with exit 0; some managers answer non-zero
    // but still exist, so a successful spawn is the real signal.
    if (!outcome.spawnError) found.push(manager);
  }

  return found;
}

/**
 * Work out what to run, without running any of it.
 *
 * Pure given the detected managers, so the plan can be printed, reviewed,
 * and tested without a package manager anywhere near the test.
 */
export function planInstall(
  wanted: readonly InstallablePackage[],
  managers: readonly ManagerSpec[],
): InstallPlan {
  const steps: PlannedInstall[] = [];
  const unavailable: { label: string; reason: string }[] = [];

  for (const item of wanted) {
    const manager = managers.find((candidate) => item.packages[candidate.id] !== undefined);
    const packageName = manager ? item.packages[manager.id] : undefined;

    if (!manager || packageName === undefined) {
      unavailable.push({
        label: item.label,
        reason:
          managers.length === 0
            ? `No supported package manager found. ${installAManager()}`
            : `None of the package managers here (${managers
                .map((candidate) => candidate.id)
                .join(', ')}) has a package for it. ${item.manual}`,
      });
      continue;
    }

    // One package can satisfy several languages: C and C++ are the same
    // Build Tools install, and the two .NET courses are one SDK. Planning it
    // twice would download a gigabyte twice and read like a bug.
    const already = steps.find(
      (step) => step.manager.id === manager.id && step.packageName === packageName,
    );
    if (already) {
      steps[steps.indexOf(already)] = {
        ...already,
        languages: [...already.languages, item.language],
        label: mergeLabels(already.label, item.label),
      };
      continue;
    }

    steps.push({
      languages: [item.language],
      label: item.label,
      manager,
      packageName,
      command: manager.command,
      args: manager.install(packageName),
    });
  }

  return {
    steps,
    unavailable,
    needsElevation: steps.some((step) => step.manager.elevated),
    needsNewShell: wanted.some((item) => item.needsNewShell),
  };
}

/**
 * One label for an install that covers two languages.
 *
 * "A C compiler" and "A C++ compiler" become "A C and C++ compiler" rather
 * than a slash-separated pile, because this line is read by a person deciding
 * whether to let it run.
 */
function mergeLabels(first: string, second: string): string {
  if (first === second) return first;

  // `C++` before `C`, or the alternation matches the first character of
  // `C++` and the suffixes stop lining up.
  const shared = /^(.*?)(C\+\+|C|\.NET SDK)(.*)$/u;
  const a = shared.exec(first);
  const b = shared.exec(second);
  if (a && b && a[1] === b[1] && a[3] === b[3]) {
    return `${a[1]}${a[2]} and ${b[2]}${a[3]}`;
  }
  return `${first} and ${second}`;
}

function installAManager(): string {
  const options = MANAGERS.filter((manager) => manager.platforms.includes(process.platform));
  return options.length === 0
    ? 'This platform is not one the installer knows.'
    : `Install one of: ${options.map((manager) => `${manager.id} (${manager.obtain})`).join(' ')}`;
}

export interface StepOutcome {
  readonly step: PlannedInstall;
  readonly ok: boolean;
  readonly output: string;
}

/**
 * Run the plan.
 *
 * Sequential rather than parallel: two package managers writing to the same
 * machine at once is how a half-installed toolchain happens, and most of them
 * take a global lock and simply fail anyway.
 *
 * A failing step does not stop the rest. Installing four of five toolchains is
 * a better outcome than installing none because the third needed elevation,
 * and every failure is reported with its output.
 */
export async function runInstall(
  plan: InstallPlan,
  onStep: (step: PlannedInstall) => void = () => {},
): Promise<readonly StepOutcome[]> {
  const outcomes: StepOutcome[] = [];

  for (const step of plan.steps) {
    onStep(step);
    const outcome = await runProcess({
      command: step.command,
      args: [...step.args],
      cwd: process.cwd(),
      env: inheritedPath(),
      // Toolchains are large and some of these download a gigabyte.
      timeoutMs: 30 * 60_000,
      maxOutputBytes: 512 * 1024,
    });

    outcomes.push({
      step,
      ok: !outcome.spawnError && !outcome.timedOut && outcome.exitCode === 0,
      output: [outcome.stdout, outcome.stderr, outcome.spawnError]
        .filter(Boolean)
        .join('\n')
        .trim(),
    });
  }

  return outcomes;
}
