import { buildRegistry } from '../context.ts';
import { formatDiagnosis } from '../format-results.ts';
import { heading, style } from '../terminal.ts';

export type Flags = Record<string, unknown>;

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
    default:
      console.error(style.red(`Unknown runtime command "${subcommand ?? ''}".`));
      console.error('Try: forge runtime doctor');
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
    console.log(heading(`Forge Runtime Diagnostics — ${runtime.metadata().displayName}`));
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
    console.log(`${metadata.id}  ${style.grey(metadata.displayName)}`);
  }
  return 0;
}
