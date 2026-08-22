import { createContext } from '../context.ts';
import { columns, heading, indent, pluralise, style, symbol } from '../terminal.ts';
import type { Flags } from './runtime.ts';

export async function runCurriculumCommand(
  args: readonly string[],
  _flags: Flags,
): Promise<number> {
  const [subcommand] = args;

  switch (subcommand) {
    case undefined:
    case 'check':
      return check();
    case 'skills':
      return skills();
    default:
      console.error(style.red(`Unknown curriculum command "${subcommand}".`));
      console.error('Try: code-retrainer curriculum check | skills');
      return 2;
  }
}

/**
 * Structural health of the curriculum as a whole: the graph is a DAG (enforced
 * at construction), every exercise references real skills, and — the part that
 * silently rots — every skill has something that trains it.
 */
async function check(): Promise<number> {
  const context = await createContext();
  let failed = false;

  console.log(heading('Skill graph'));
  console.log(
    columns([
      [`${symbol.pass} skills`, style.grey(String(context.skillGraph.size))],
      [`${symbol.pass} acyclic`, style.grey('verified when the graph was built')],
      [`${symbol.pass} exercises`, style.grey(String(context.catalog.size))],
    ]),
  );

  if (context.loadFailures.length > 0) {
    failed = true;
    console.log(heading(`${pluralise(context.loadFailures.length, 'exercise')} failed to load`));
    for (const failure of context.loadFailures) {
      console.log(`${symbol.fail} ${failure.directory}`);
      console.log(indent(style.grey(failure.message), 4));
    }
  }

  const unknownSkills = context.catalog
    .referencedSkills()
    .filter((skill) => !context.skillGraph.has(skill));
  if (unknownSkills.length > 0) {
    failed = true;
    console.log(heading('Exercises referencing unknown skills'));
    for (const skill of unknownSkills) console.log(`${symbol.fail} ${skill}`);
  }

  const uncovered = context.catalog.uncoveredSkills(context.skillGraph);
  console.log(heading('Coverage'));
  const covered = context.skillGraph.size - uncovered.length;
  const percentage = context.skillGraph.size === 0 ? 0 : (covered / context.skillGraph.size) * 100;
  console.log(
    `${covered}/${context.skillGraph.size} skills have at least one exercise ${style.grey(
      `(${percentage.toFixed(0)}%)`,
    )}`,
  );

  if (uncovered.length > 0) {
    // A coverage hole is a curriculum backlog item, not a build failure.
    console.log('');
    console.log(style.yellow('Skills with no exercise yet:'));
    for (const skill of uncovered) {
      console.log(`  ${symbol.bullet} ${skill} ${style.grey(context.skillGraph.get(skill).name)}`);
    }
  }

  return failed ? 1 : 0;
}

async function skills(): Promise<number> {
  const context = await createContext();
  const byCategory = new Map<string, string[]>();

  for (const skillId of context.skillGraph.topological()) {
    const skill = context.skillGraph.get(skillId);
    const count = context.catalog.forSkill(skillId).length;
    const label = `${skill.id} ${style.grey(`— ${skill.name}`)} ${
      count > 0 ? style.green(`(${count})`) : style.grey('(0)')
    }`;
    const bucket = byCategory.get(skill.category);
    if (bucket) bucket.push(label);
    else byCategory.set(skill.category, [label]);
  }

  for (const [category, entries] of byCategory) {
    console.log(heading(category));
    for (const entry of entries) console.log(`  ${entry}`);
  }
  return 0;
}
