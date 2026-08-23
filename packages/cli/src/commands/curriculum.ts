// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { checkActivities, loadActivitiesForLanguage } from '@code-retrainer/activities';

import { collectActivitySets } from '../activity-sources.ts';
import { loadPlanned, loadSyllabus } from '@code-retrainer/exercises';
import { readSyllabusProgress, validateSyllabus } from '@code-retrainer/curriculum';

import { createContext, curriculumRoots, plannedRoot } from '../context.ts';
import { columns, heading, indent, pluralize, style, symbol } from '../terminal.ts';
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
    case 'syllabus':
      return syllabus();
    case 'planned':
      return planned();
    case 'activities':
      return activities();
    default:
      console.error(style.red(`Unknown curriculum command "${subcommand}".`));
      console.error(
        'Try: code-retrainer curriculum check | skills | syllabus | planned | activities',
      );
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
      [`${symbol.pass} skills`, style.gray(String(context.skillGraph.size))],
      [`${symbol.pass} acyclic`, style.gray('verified when the graph was built')],
      [`${symbol.pass} exercises`, style.gray(String(context.catalog.size))],
    ]),
  );

  if (context.loadFailures.length > 0) {
    failed = true;
    console.log(heading(`${pluralize(context.loadFailures.length, 'exercise')} failed to load`));
    for (const failure of context.loadFailures) {
      console.log(`${symbol.fail} ${failure.directory}`);
      console.log(indent(style.gray(failure.message), 4));
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
    `${covered}/${context.skillGraph.size} skills have at least one exercise ${style.gray(
      `(${percentage.toFixed(0)}%)`,
    )}`,
  );

  if (uncovered.length > 0) {
    // A coverage hole is a curriculum backlog item, not a build failure.
    console.log('');
    console.log(style.yellow('Skills with no exercise yet:'));
    for (const skill of uncovered) {
      console.log(`  ${symbol.bullet} ${skill} ${style.gray(context.skillGraph.get(skill).name)}`);
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
    const label = `${skill.id} ${style.gray(`— ${skill.name}`)} ${
      count > 0 ? style.green(`(${count})`) : style.gray('(0)')
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

/**
 * The planned course, against what has actually been written.
 *
 * The catalog says what exists. This says what was intended, and the gap is
 * the only honest measure of progress — a number that goes down as content
 * lands, rather than a claim in a README that never moves.
 */
async function syllabus(): Promise<number> {
  const context = await createContext();
  let failures = 0;

  for (const [language, directory] of Object.entries(curriculumRoots())) {
    failures += await reportSyllabus(context, language, directory);
    console.log('');
  }

  return failures === 0 ? 0 : 1;
}

async function reportSyllabus(
  context: Awaited<ReturnType<typeof createContext>>,
  language: string,
  directory: string,
): Promise<number> {
  const loaded = await loadSyllabus(directory);

  if (loaded.stages.length === 0) {
    console.log(heading(language));
    console.log(indent(style.gray('No syllabus written yet.')));
    return 0;
  }

  const issues = validateSyllabus(loaded, context.skillGraph);
  // Only this language's exercises count toward this language's plan.
  const exercises = context.catalog.all().filter((entry) => entry.language === language);
  const progress = readSyllabusProgress(loaded, exercises);

  console.log(heading(language));
  console.log(
    columns([
      ['stages', String(loaded.stages.length)],
      ['lessons', String(progress.total)],
      ['with content', `${progress.covered} (${percent(progress.covered, progress.total)}%)`],
      ['outstanding', String(progress.outstanding.length)],
    ]),
  );

  console.log('');
  console.log(heading('By stage'));
  for (const stage of progress.byStage) {
    const bar = renderBar(stage.covered, stage.total);
    console.log(indent(`${bar}  ${stage.covered}/${stage.total}  ${stage.title}`));
  }

  if (issues.length > 0) {
    console.log('');
    console.log(heading('Problems with the plan itself'));
    for (const issue of issues) {
      console.log(indent(`${symbol.fail} ${issue.lessonId} — ${issue.message}`));
    }
  }

  const next = progress.outstanding.slice(0, 6);
  if (next.length > 0) {
    console.log('');
    console.log(heading('Next to write'));
    for (const entry of next) {
      console.log(indent(`${entry.lesson.id}  ${entry.lesson.title}`));
      console.log(indent(indent(style.gray(entry.lesson.focus))));
    }
    console.log('');
    console.log(
      indent(style.gray(`${pluralize(progress.outstanding.length, 'lesson')} still to write.`)),
    );
  }

  return issues.length;
}

function percent(part: number, whole: number): number {
  return whole === 0 ? 100 : Math.round((part / whole) * 100);
}

/** Ten cells, so every stage is comparable at a glance. */
function renderBar(part: number, whole: number): string {
  const filled = whole === 0 ? 10 : Math.round((part / whole) * 10);
  return style.gray('#'.repeat(filled) + '.'.repeat(10 - filled));
}

/**
 * Curricula that exist as design and not yet as something you can run.
 *
 * Listed separately from the syllabus report on purpose. Mixing a course with
 * no runtime into the same table as one with 228 exercises behind it would
 * make the difference a percentage rather than a fact, and the difference is
 * the whole point.
 */
async function planned(): Promise<number> {
  const curricula = await loadPlanned(plannedRoot);

  if (curricula.length === 0) {
    console.log(heading('Planned curricula'));
    console.log(indent(style.gray('None.')));
    return 0;
  }

  console.log(heading('Planned curricula'));
  console.log(
    indent(
      style.gray(
        'Practisable through activities; not yet writable against tests. Each ' +
          'still needs a runtime that can execute an attempt and judge it before ' +
          'the exercise half exists.',
      ),
    ),
  );
  console.log('');

  let lessons = 0;
  let skills = 0;

  for (const curriculum of curricula) {
    const syllabus = await loadSyllabus(curriculum.directory);
    const count = syllabus.stages.reduce((total, stage) => total + stage.lessons.length, 0);
    lessons += count;
    skills += curriculum.skills.length;

    console.log(indent(`${curriculum.title}`));
    console.log(
      indent(
        indent(
          style.gray(
            `${pluralize(curriculum.skills.length, 'skill')} · ` +
              `${pluralize(syllabus.stages.length, 'stage')} · ` +
              `${pluralize(count, 'lesson')} · ` +
              `${pluralize((await loadActivitiesForLanguage(curriculum.directory)).length, 'activity', 'activities')}`,
          ),
        ),
      ),
    );
    console.log(indent(indent(style.gray(curriculum.summary))));
    console.log(indent(indent(style.gray(`Needs: ${curriculum.blockedBy}`))));
    console.log('');
  }

  console.log(
    indent(
      `${pluralize(curricula.length, 'curriculum', 'curricula')} · ` +
        `${pluralize(skills, 'skill')} · ${pluralize(lessons, 'lesson')} designed.`,
    ),
  );
  return 0;
}

/**
 * Every activity in the product, and whether any of it is wrong.
 *
 * The point of a separate command is that content rot is silent. A wrong
 * answer key still loads, still renders, and still marks correct answers
 * wrong; nothing crashes and nobody finds out except the learner, who
 * concludes they misunderstood something they had right. This is the thing to
 * run after writing content.
 */
async function activities(): Promise<number> {
  const sets = await collectActivitySets();

  console.log(heading('Activities'));
  console.log(
    indent(
      style.gray(
        'Practice that needs no runtime: read the code and answer. Graded by ' +
          'comparison against the answer the author wrote down, never by judgment.',
      ),
    ),
  );
  console.log('');

  let total = 0;
  const problems: string[] = [];

  for (const set of sets) {
    total += set.activities.length;
    const faults = checkActivities(set.activities);
    problems.push(...faults);

    const kinds = [...new Set(set.activities.map((activity) => activity.kind))].sort();
    console.log(
      columns([
        [
          `${faults.length === 0 ? symbol.pass : symbol.fail} ${set.title}`,
          style.gray(`${String(set.activities.length).padStart(2)} · ${kinds.join(', ')}`),
        ],
      ]),
    );
  }

  console.log('');
  if (problems.length > 0) {
    console.log(indent(style.red(`${pluralize(problems.length, 'problem')}:`)));
    for (const problem of problems) console.log(indent(indent(style.red(problem))));
    return 1;
  }

  console.log(
    indent(
      `${pluralize(total, 'activity', 'activities')} across ` +
        `${pluralize(sets.length, 'course')}, all well-formed.`,
    ),
  );
  return 0;
}
