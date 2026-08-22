import type { MasteryDimension, SkillGraph, SkillMastery } from '@code-retrainer/core';
import { headlineMastery, masteryDimensions } from '@code-retrainer/core';
import type { ExerciseCatalog } from '@code-retrainer/exercises';
import type { Attempt } from '@code-retrainer/learning';
import {
  applyObservation,
  emptyMastery,
  gradeAttempt,
  gradingContext,
  reinforceRetention,
} from '@code-retrainer/learning';

/**
 * The single number on the home screen.
 *
 * Scaled 0–100 because that is how it reads as an instrument, but it is the
 * same weighted vector the mastery model produces — weighted toward
 * independent recall, because that is the thing being trained.
 */
export interface FluencyReading {
  readonly score: number;
  /** Change over the trailing window. Null until there is enough history. */
  readonly change: number | null;
  readonly windowDays: number;
  readonly dimensions: Readonly<Record<MasteryDimension, number>>;
  /** Skills with any evidence at all. A score over two skills is not a score. */
  readonly measuredSkills: number;
}

export interface TrajectoryPoint {
  /** ISO date, midnight UTC. */
  readonly date: string;
  readonly score: number;
}

export interface SkillNode {
  readonly skillId: string;
  readonly name: string;
  readonly category: string;
  /** Longest path from a root skill. Drives vertical placement. */
  readonly depth: number;
  readonly mastery: number;
  readonly observations: number;
  readonly lastPracticedAt: string | null;
  readonly dueAt: string | null;
  readonly exerciseCount: number;
  /** True when nothing has been measured — unexplored, not weak. */
  readonly unmeasured: boolean;
}

export interface SkillMap {
  readonly nodes: readonly SkillNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
  readonly maximumDepth: number;
}

export interface Constraint {
  readonly skillId: string;
  readonly name: string;
  readonly mastery: number;
  /** True when the skill has never been practised, so 0 means untested. */
  readonly unmeasured: boolean;
}

/**
 * Replay the attempt log to recover mastery as it was on each past day.
 *
 * The alternative — storing a daily snapshot — would freeze history against
 * whatever the grading rules were that day, so changing a rule would leave the
 * chart disagreeing with the numbers beside it. Recomputing costs one pass and
 * always tells the same story as everything else on the screen.
 */
export function replayTrajectory(
  attempts: readonly Attempt[],
  catalog: ExerciseCatalog,
  options: { days: number; now: Date },
): TrajectoryPoint[] {
  const ordered = [...attempts].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));

  const mastery = new Map<string, SkillMastery>();
  const points: TrajectoryPoint[] = [];

  const start = startOfDay(new Date(options.now.getTime() - options.days * 86_400_000));
  let cursor = start.getTime();
  let index = 0;

  // Fold in everything that happened before the window so the first point is
  // where the learner actually stood, not zero.
  while (index < ordered.length && Date.parse(ordered[index]?.startedAt ?? '') < cursor) {
    absorb(mastery, ordered[index], catalog, ordered);
    index += 1;
  }

  const end = startOfDay(options.now).getTime();
  while (cursor <= end) {
    const dayEnd = cursor + 86_400_000;
    while (index < ordered.length && Date.parse(ordered[index]?.startedAt ?? '') < dayEnd) {
      absorb(mastery, ordered[index], catalog, ordered);
      index += 1;
    }
    points.push({ date: new Date(cursor).toISOString().slice(0, 10), score: score(mastery) });
    cursor = dayEnd;
  }

  return points;
}

function absorb(
  mastery: Map<string, SkillMastery>,
  attempt: Attempt | undefined,
  catalog: ExerciseCatalog,
  all: readonly Attempt[],
): void {
  if (!attempt || !catalog.has(attempt.exerciseId)) return;
  const exercise = catalog.get(attempt.exerciseId);

  // The same history the live grading saw, so the chart cannot disagree with
  // the number beside it.
  const history = gradingContext(
    all,
    { exerciseId: exercise.id, skills: exercise.skills },
    (exerciseId) => (catalog.has(exerciseId) ? catalog.get(exerciseId).skills : []),
    attempt.startedAt,
  );

  for (const observation of gradeAttempt(
    attempt,
    {
      id: exercise.id,
      version: exercise.version,
      skills: exercise.skills,
      difficulty: exercise.difficulty,
      estimatedSeconds: exercise.estimatedSeconds,
      kind: exercise.kind,
    },
    history,
  )) {
    const current = mastery.get(observation.skillId) ?? emptyMastery(observation.skillId);
    const updated = applyObservation(current, observation);
    mastery.set(observation.skillId, reinforceRetention(updated.mastery, observation));
  }
}

/** Mean headline mastery over measured skills, on a 0–100 scale. */
function score(mastery: ReadonlyMap<string, SkillMastery>): number {
  const measured = [...mastery.values()].filter((record) => record.observations > 0);
  if (measured.length === 0) return 0;
  const total = measured.reduce((sum, record) => sum + headlineMastery(record.vector), 0);
  return round((total / measured.length) * 100);
}

export function readFluency(
  mastery: ReadonlyMap<string, SkillMastery>,
  trajectory: readonly TrajectoryPoint[],
  windowDays: number,
): FluencyReading {
  const measured = [...mastery.values()].filter((record) => record.observations > 0);

  const dimensions: Record<MasteryDimension, number> = Object.fromEntries(
    masteryDimensions.map((dimension) => [dimension, 0]),
  ) as Record<MasteryDimension, number>;

  for (const dimension of masteryDimensions) {
    if (measured.length === 0) continue;
    const total = measured.reduce((sum, record) => sum + record.vector[dimension], 0);
    dimensions[dimension] = round(total / measured.length);
  }

  const current = trajectory.at(-1)?.score ?? score(mastery);
  const first = trajectory[0]?.score;
  // Only a real comparison: a change from a standing start is not improvement,
  // it is the first measurement.
  const change =
    first !== undefined && trajectory.length > 1 && first > 0 ? round(current - first) : null;

  return {
    score: current,
    change,
    windowDays,
    dimensions,
    measuredSkills: measured.length,
  };
}

/**
 * The skill graph as a layered map.
 *
 * Depth is the longest path from a root, so a skill always sits below
 * everything it depends on. Deterministic, unlike a force-directed layout, and
 * that determinism is what makes "trace backward from state modeling"
 * something a learner can actually do.
 */
export function buildSkillMap(
  graph: SkillGraph,
  mastery: ReadonlyMap<string, SkillMastery>,
  reviews: ReadonlyMap<string, { dueAt: string }>,
  catalog: ExerciseCatalog,
): SkillMap {
  const depths = new Map<string, number>();
  for (const skillId of graph.topological()) {
    const prerequisites = graph.directPrerequisites(skillId);
    const depth =
      prerequisites.length === 0
        ? 0
        : Math.max(...prerequisites.map((id) => (depths.get(id) ?? 0) + 1));
    depths.set(skillId, depth);
  }

  const nodes: SkillNode[] = graph.all().map((skill) => {
    const record = mastery.get(skill.id);
    return {
      skillId: skill.id,
      name: skill.name,
      category: skill.category,
      depth: depths.get(skill.id) ?? 0,
      mastery: record ? headlineMastery(record.vector) : 0,
      observations: record?.observations ?? 0,
      lastPracticedAt: record?.lastPracticedAt ?? null,
      dueAt: reviews.get(skill.id)?.dueAt ?? null,
      exerciseCount: catalog.forSkill(skill.id).length,
      unmeasured: (record?.observations ?? 0) === 0,
    };
  });

  const edges = graph
    .all()
    .flatMap((skill) => skill.prerequisites.map((from) => ({ from, to: skill.id })));

  return {
    nodes,
    edges,
    maximumDepth: Math.max(0, ...nodes.map((node) => node.depth)),
  };
}

/**
 * What is structurally holding a skill back.
 *
 * Walks the prerequisite closure and returns the weakest links, so the app can
 * say "your state-modeling performance is currently constrained by dictionary
 * mutation" instead of just showing a low number and leaving the learner to
 * work out what to do about it.
 */
export function findConstraints(
  graph: SkillGraph,
  mastery: ReadonlyMap<string, SkillMastery>,
  skillId: string,
  options: { threshold?: number; limit?: number } = {},
): Constraint[] {
  const threshold = options.threshold ?? 0.7;
  if (!graph.has(skillId)) return [];

  const constraints = graph.ancestors(skillId).map((ancestorId) => {
    const record = mastery.get(ancestorId);
    const observations = record?.observations ?? 0;
    return {
      skillId: ancestorId,
      name: graph.get(ancestorId).name,
      mastery: record ? headlineMastery(record.vector) : 0,
      unmeasured: observations === 0,
    };
  });

  return constraints
    .filter((constraint) => constraint.unmeasured || constraint.mastery < threshold)
    .sort((a, b) => {
      // A measured weakness is evidence; an unpractised prerequisite is only
      // an absence of it. Evidence goes first, or "you have never tried this"
      // buries "you tried this and could not do it".
      if (a.unmeasured !== b.unmeasured) return a.unmeasured ? 1 : -1;
      return a.mastery - b.mastery;
    })
    .slice(0, options.limit ?? 3);
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
