import type { SkillGraph, SkillMastery } from '@forge/core';
import type { ClaimableDimension } from '@forge/core';
import { makeMastery } from '@forge/core';
import type { Exercise } from '@forge/exercises';

/**
 * Onboarding (spec §30).
 *
 * The target user is an experienced programmer, so the platform must not make
 * them grind through material they already know. Two mechanisms do that: a
 * declared prior, which unlocks the graph immediately, and a short diagnostic,
 * which replaces the guess with evidence.
 */
export type ExperienceLevel =
  /** New to programming as well as to the language. */
  | 'new-to-programming'
  /** Fluent in another language, new to this one. */
  | 'new-to-language'
  /** Has used the language, but reaches for documentation constantly. */
  | 'rusty'
  /** Writes it regularly and wants to sharpen speed and recall. */
  | 'working-knowledge';

/**
 * Priors are stated per dimension rather than as one number, because the
 * dimensions genuinely differ. A senior TypeScript engineer knows exactly what
 * a dictionary is and when to reach for one; that says nothing about whether
 * they can write the Python for it without looking.
 *
 * Only the three dimensions in `claimableDimensions` can be claimed. Recall,
 * debugging, transfer, speed, composition, retention and independence are the
 * product's subject matter and start at zero however senior the learner is.
 */
type Prior = Readonly<Record<ClaimableDimension, number>>;

const PRIORS: Readonly<Record<ExperienceLevel, Prior>> = Object.freeze({
  'new-to-programming': { knowledge: 0, recognition: 0, application: 0 },
  'new-to-language': { knowledge: 0.7, recognition: 0.55, application: 0.25 },
  rusty: { knowledge: 0.75, recognition: 0.7, application: 0.45 },
  'working-knowledge': { knowledge: 0.85, recognition: 0.8, application: 0.6 },
});

/**
 * Every level, derived from the table above rather than listed again, so the
 * two cannot drift apart. `PRIORS` is a total record over the union, so these
 * keys are exactly the union.
 */
export const experienceLevels = Object.freeze(Object.keys(PRIORS)) as readonly ExperienceLevel[];

export interface SeedOptions {
  /** Timestamp recorded as the prior's origin. Never counted as practice. */
  readonly at: string;
  /** Restrict the seed to one language's skills. */
  readonly language?: string;
}

/**
 * Turn a declared experience level into an initial mastery map.
 *
 * Knowledge and recognition get the declared prior; recall, speed and
 * independence do not. That is the product's whole thesis expressed as a
 * default: claiming to know Python says nothing about being able to write it
 * from memory, so those dimensions start at zero and must be earned.
 */
export function seedFromExperience(
  graph: SkillGraph,
  level: ExperienceLevel,
  options: SeedOptions,
): Map<string, SkillMastery> {
  const prior = PRIORS[level];
  const seeded = new Map<string, SkillMastery>();

  for (const skill of graph.all()) {
    if (options.language && skill.language !== options.language) continue;
    seeded.set(skill.id, {
      skillId: skill.id,
      vector: makeMastery({ ...prior }),
      observations: 0,
      // Null, not `at`: a claim is not a practice session, and treating it as
      // one would immediately schedule reviews the learner never earned.
      lastPracticedAt: null,
    });
  }

  return seeded;
}

export interface DiagnosticOptions {
  /** How many exercises the diagnostic should contain. */
  readonly size?: number;
  /** Highest difficulty to include. A diagnostic should not be a wall. */
  readonly maximumDifficulty?: number;
}

export interface DiagnosticPlan {
  readonly exercises: readonly Exercise[];
  /** Skill categories the diagnostic manages to probe. */
  readonly coverage: readonly string[];
  /** Categories with no suitable exercise, so the profile stays a guess there. */
  readonly uncovered: readonly string[];
  readonly estimatedSeconds: number;
}

/**
 * Choose a short, broad diagnostic.
 *
 * Breadth beats depth here: the goal is to find the edges of what the learner
 * can already do, not to measure any one skill precisely. Prerequisites are
 * deliberately ignored — the diagnostic is what unlocks the graph, so it
 * cannot be gated by it.
 */
export function planDiagnostic(
  candidates: readonly Exercise[],
  graph: SkillGraph,
  options: DiagnosticOptions = {},
): DiagnosticPlan {
  const size = options.size ?? 10;
  const maximumDifficulty = options.maximumDifficulty ?? 3;

  const byCategory = new Map<string, Exercise[]>();
  for (const exercise of candidates) {
    if (exercise.difficulty > maximumDifficulty) continue;
    const category = categoryOf(exercise, graph);
    if (category === null) continue;
    const bucket = byCategory.get(category);
    if (bucket) bucket.push(exercise);
    else byCategory.set(category, [exercise]);
  }

  for (const bucket of byCategory.values()) {
    bucket.sort(
      (a, b) =>
        a.difficulty - b.difficulty ||
        a.estimatedSeconds - b.estimatedSeconds ||
        a.id.localeCompare(b.id),
    );
  }

  // Round-robin across categories so a category with many exercises cannot
  // dominate a ten-question diagnostic.
  const categories = [...byCategory.keys()].sort();
  const chosen: Exercise[] = [];
  for (let round = 0; chosen.length < size; round += 1) {
    let addedThisRound = false;
    for (const category of categories) {
      if (chosen.length >= size) break;
      const exercise = byCategory.get(category)?.[round];
      if (!exercise) continue;
      chosen.push(exercise);
      addedThisRound = true;
    }
    if (!addedThisRound) break;
  }

  const covered = new Set(chosen.map((exercise) => categoryOf(exercise, graph) ?? ''));
  const allCategories = new Set(graph.all().map((skill) => skill.category));

  return {
    exercises: chosen,
    coverage: [...covered].filter(Boolean).sort(),
    uncovered: [...allCategories].filter((category) => !covered.has(category)).sort(),
    estimatedSeconds: chosen.reduce((total, exercise) => total + exercise.estimatedSeconds, 0),
  };
}

function categoryOf(exercise: Exercise, graph: SkillGraph): string | null {
  for (const skillId of exercise.skills) {
    if (graph.has(skillId)) return graph.get(skillId).category;
  }
  return null;
}
