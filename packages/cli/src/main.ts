#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { runCurriculumCommand } from './commands/curriculum.ts';
import { runExerciseCommand } from './commands/exercise.ts';
import { runRuntimeCommand } from './commands/runtime.ts';
import { style } from './terminal.ts';

const USAGE = `
${style.bold('forge')} — Code Fluency Training Platform toolkit

${style.bold('Usage')}
  forge runtime doctor [--language <id>]     Check that a language toolchain is usable
  forge exercise list [--language <id>]      List loadable exercises
  forge exercise show <id>                   Print one exercise, including its hints
  forge exercise validate [<id>] [--fast]    Validate exercise content
  forge exercise run <id> [--solution]       Run an exercise's tests
  forge curriculum check                     Check the skill graph and its coverage

${style.bold('Options')}
  --help, -h        Show this message
  --version         Show the version
`.trim();

const VERSION = '0.1.0';

export async function main(argv: readonly string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    strict: false,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean' },
    },
  });

  if (values.version === true) {
    console.log(VERSION);
    return 0;
  }

  const [group, ...rest] = positionals;

  if (values.help === true && group === undefined) {
    console.log(USAGE);
    return 0;
  }

  try {
    switch (group) {
      case 'runtime':
        return await runRuntimeCommand(rest, values);
      case 'exercise':
        return await runExerciseCommand(rest, values);
      case 'curriculum':
        return await runCurriculumCommand(rest, values);
      case undefined:
        console.log(USAGE);
        return 0;
      default:
        console.error(style.red(`Unknown command group "${group}".`));
        console.error(USAGE);
        return 2;
    }
  } catch (error) {
    console.error(style.red(error instanceof Error ? error.message : String(error)));
    if (process.env.FORGE_DEBUG && error instanceof Error && error.stack) {
      console.error(style.grey(error.stack));
    }
    return 1;
  }
}

// True when this module is the process entry point, false when a test imports
// it. Comparing resolved file URLs works both for `main.ts` run through Node's
// type stripping and for the built `main.js`.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exitCode = await main(process.argv.slice(2));
}
