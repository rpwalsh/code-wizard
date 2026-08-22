import type { SkillMastery } from '@forge/core';
import type { ExperienceLevel } from '@forge/curriculum';
import {
  groupBySlot,
  planDiagnostic,
  planSession,
  recommend,
  seedFromExperience,
  slotLabel,
} from '@forge/curriculum';

import type { CliContext } from '../context.ts';
import { createContext } from '../context.ts';
import { columns, formatDuration, heading, indent, style, symbol } from '../terminal.ts';
import type { Flags } from './runtime.ts';

const LEVELS: readonly ExperienceLevel[] = [
  'new-to-programming',
  'new-to-language',
  'rusty',
  'working-knowledge',
];

function flagString(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

export async function runPlanCommand(args: readonly string[], flags: Flags): Promise<number> {
  const [subcommand] = args;
  const context = await createContext();

  const requested = flagString(flags, 'level') ?? 'new-to-language';
  if (!LEVELS.includes(requested as ExperienceLevel)) {
    console.error(style.red(`Unknown experience level "${requested}".`));
    console.error(`Choose one of: ${LEVELS.join(', ')}`);
    return 2;
  }
  const level = requested as ExperienceLevel;

  switch (subcommand) {
    case 'diagnostic':
      return diagnostic(context);
    case undefined:
    case 'session':
      return session(context, level);
    case 'next':
      return next(context, level);
    default:
      console.error(style.red(`Unknown plan command "${subcommand}".`));
      console.error('Try: forge plan session | next | diagnostic');
      return 2;
  }
}

/**
 * Every command here runs against a freshly seeded profile rather than stored
 * progress: persistence is not built yet, and inventing a learner would make
 * the output a demo rather than a diagnosis.
 */
function seed(context: CliContext, level: ExperienceLevel): Map<string, SkillMastery> {
  return seedFromExperience(context.skillGraph, level, { at: new Date().toISOString() });
}

function diagnostic(context: CliContext): number {
  const plan = planDiagnostic(context.catalog.all(), context.skillGraph);

  console.log(heading(`Onboarding diagnostic (${plan.exercises.length} exercises)`));
  if (plan.exercises.length === 0) {
    console.log(style.grey('No exercises are suitable for a diagnostic yet.'));
    return 0;
  }

  console.log(
    columns(
      plan.exercises.map((exercise) => [
        `  ${exercise.id}`,
        `${style.grey(`d${exercise.difficulty}`)} ${exercise.title}`,
      ]),
    ),
  );
  console.log('');
  console.log(`Estimated time: ${formatDuration(plan.estimatedSeconds * 1000)}`);
  console.log(`Probes: ${plan.coverage.join(', ')}`);
  if (plan.uncovered.length > 0) {
    console.log(style.yellow(`Cannot probe yet (no exercises): ${plan.uncovered.join(', ')}`));
  }
  return 0;
}

function next(context: CliContext, level: ExperienceLevel): number {
  const result = recommend(
    context.catalog.all(),
    context.skillGraph,
    { mastery: seed(context, level), reviews: new Map(), attempts: new Map(), now: new Date() },
    { limit: 5 },
  );

  console.log(heading(`What to practise next (profile: ${level})`));

  if (result.recommendations.length === 0) {
    console.log(style.yellow('Nothing is unlocked yet. Run the diagnostic first.'));
  }

  for (const recommendation of result.recommendations) {
    console.log(
      `${style.bold(recommendation.exercise.id)} ${style.grey(`score ${recommendation.score}`)}`,
    );
    console.log(indent(recommendation.reason, 2));
    for (const factor of recommendation.factors) {
      const sign =
        factor.delta >= 0 ? style.green(`+${factor.delta}`) : style.red(`${factor.delta}`);
      console.log(indent(`${sign}  ${style.grey(factor.label)}`, 4));
    }
    console.log('');
  }

  if (result.blocked.length > 0) {
    console.log(heading('Locked'));
    console.log(
      columns(
        result.blocked.map((blocked) => [
          `  ${blocked.exercise.id}`,
          style.grey(`needs ${blocked.missing.join(', ')}`),
        ]),
      ),
    );
  }
  return 0;
}

function session(context: CliContext, level: ExperienceLevel): number {
  const now = new Date();
  const result = recommend(context.catalog.all(), context.skillGraph, {
    mastery: seed(context, level),
    reviews: new Map(),
    attempts: new Map(),
    now,
  });

  const plan = planSession(result.recommendations, { dueSkills: new Set() });

  console.log(heading(greeting(now)));
  console.log(style.grey(`Your current focus: Python — Independent Fluency`));
  console.log(heading('Today'));

  if (plan.items.length === 0) {
    console.log(style.yellow('Nothing to practise — no exercises are unlocked yet.'));
  }

  for (const group of groupBySlot(plan)) {
    console.log(`${style.bold(`${group.items.length} × ${slotLabel(group.slot)}`)}`);
    for (const item of group.items) {
      console.log(
        indent(
          `${symbol.bullet} ${item.exercise.title} ${style.grey(
            `· ${formatDuration(item.estimatedSeconds * 1000)}`,
          )}`,
          2,
        ),
      );
      console.log(indent(style.grey(item.reason), 4));
    }
    console.log('');
  }

  console.log(`Estimated time: ${formatDuration(plan.estimatedSeconds * 1000)}`);

  if (plan.gaps.length > 0) {
    console.log('');
    console.log(style.yellow('Could not fill:'));
    for (const gap of plan.gaps) {
      console.log(`  ${symbol.warn} ${slotLabel(gap.slot)} — ${gap.reason}`);
    }
  }
  return 0;
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}
