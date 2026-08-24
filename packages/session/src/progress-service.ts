// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { SkillGraph, SkillMastery } from '@code-wizard/core';
import { headlineMastery, weakestDimensions } from '@code-wizard/core';
import type {
  ExerciseHistory,
  LearnerState,
  Recommendation,
  SessionPlan,
} from '@code-wizard/curriculum';
import { planSession, recommend } from '@code-wizard/curriculum';
import type { ExerciseCatalog } from '@code-wizard/exercises';
import type { Attempt } from '@code-wizard/learning';
import { buildHistory, computeMetrics, independentCompletionRate } from '@code-wizard/learning';
import type { ProgressStore, StoredReview } from '@code-wizard/storage';

import type { Constraint, FluencyReading, SkillMap, TrajectoryPoint } from './analytics.ts';
import { buildSkillMap, findConstraints, readFluency, replayTrajectory } from './analytics.ts';
import type { AssistancePoint, BaselineComparison } from './baseline.ts';
import { compareToBaseline, readAssistance } from './baseline.ts';

/** The window the home screen reports change over. */
const TRAJECTORY_DAYS = 30;

export interface DashboardSkill {
  readonly skillId: string;
  readonly name: string;
  readonly category: string;
  readonly mastery: number;
  readonly weakest: readonly { dimension: string; value: number }[];
}

export interface RecentImprovement {
  readonly exerciseId: string;
  readonly title: string;
  readonly fromMs: number;
  readonly toMs: number;
}

export interface Dashboard {
  /** The headline instrument reading. */
  readonly fluency: FluencyReading;
  readonly trajectory: readonly TrajectoryPoint[];
  readonly plan: SessionPlan;
  readonly recommendations: readonly Recommendation[];
  /** Skills below the weakness threshold, weakest first. */
  readonly weaknesses: readonly DashboardSkill[];
  readonly improvements: readonly RecentImprovement[];
  /** Fraction of solved attempts completed with no assistance at all. */
  readonly independentCompletion: number | null;
  /**
   * Where they started, beside where they are. Null until there is enough
   * history for the two windows not to overlap.
   */
  readonly baseline: BaselineComparison | null;
  /** How much help they leaned on, day by day. */
  readonly assistance: readonly AssistancePoint[];
  readonly dueCount: number;
  readonly totalAttempts: number;
  /**
   * Exercises already seen. A demonstration cannot use one of these: passing
   * an exercise you have met before demonstrates that you have met it before.
   */
  readonly attemptedExerciseIds: ReadonlySet<string>;
}

/**
 * Reads stored progress and answers the two questions the home screen asks:
 * what should I do today, and what am I actually getting better at.
 *
 * Everything here is derived. Nothing is cached in the database, so a change
 * to how a metric is defined shows up in history rather than invalidating it.
 */
export class ProgressService {
  constructor(
    private readonly store: ProgressStore,
    private readonly catalog: ExerciseCatalog,
    private readonly skillGraph: SkillGraph,
  ) {}

  async learnerState(now = new Date()): Promise<LearnerState> {
    const [mastery, reviews, attempts] = await Promise.all([
      this.store.allMastery(),
      this.store.allReviews(),
      this.store.allAttempts(),
    ]);

    return {
      mastery,
      reviews: reviews as ReadonlyMap<string, StoredReview>,
      attempts: summarizeAttempts(attempts),
      now,
    };
  }

  /** The skill graph with measured mastery on it, for the map screen. */
  async skillMap(): Promise<SkillMap> {
    const [mastery, reviews] = await Promise.all([
      this.store.allMastery(),
      this.store.allReviews(),
    ]);
    return buildSkillMap(this.skillGraph, mastery, reviews, this.catalog);
  }

  /** What is structurally holding one skill back. */
  async constraints(skillId: string): Promise<Constraint[]> {
    return findConstraints(this.skillGraph, await this.store.allMastery(), skillId);
  }

  /**
   * The home screen's numbers, optionally scoped to one language.
   *
   * The scope is applied to the evidence — exercises, attempts, mastery,
   * reviews — before any metric is computed, so a JavaScript dashboard's
   * fluency is JavaScript fluency rather than a Python average wearing the
   * wrong heading. Unscoped behavior is unchanged.
   */
  async dashboard(
    now = new Date(),
    options: { readonly language?: string } = {},
  ): Promise<Dashboard> {
    const { language } = options;
    const state = await this.learnerState(now);
    const allAttempts = await this.store.allAttempts();

    const inLanguage = (skillId: string): boolean =>
      language === undefined ||
      (this.skillGraph.has(skillId) && this.skillGraph.get(skillId).language === language);

    const pool =
      language === undefined
        ? this.catalog.all()
        : this.catalog.all().filter((exercise) => exercise.language === language);

    const attempts =
      language === undefined
        ? allAttempts
        : allAttempts.filter(
            (attempt) =>
              this.catalog.has(attempt.exerciseId) &&
              this.catalog.get(attempt.exerciseId).language === language,
          );

    const mastery =
      language === undefined
        ? state.mastery
        : new Map([...state.mastery].filter(([skillId]) => inLanguage(skillId)));

    const scoped: LearnerState = {
      ...state,
      mastery,
      attempts: summarizeAttempts(attempts),
    };

    const { recommendations } = recommend(pool, this.skillGraph, scoped);

    const dueSkills = new Set(
      [...state.reviews.values()]
        .filter((review) => Date.parse(review.dueAt) <= now.getTime())
        .map((review) => review.skillId)
        .filter(inLanguage),
    );

    const trajectory = replayTrajectory(attempts, this.catalog, {
      days: TRAJECTORY_DAYS,
      now,
    });

    return {
      fluency: readFluency(mastery, trajectory, TRAJECTORY_DAYS),
      trajectory,
      plan: planSession(recommendations, { dueSkills }),
      recommendations,
      weaknesses: this.#weaknesses(mastery),
      improvements: this.#improvements(attempts),
      independentCompletion: independentCompletionRate(attempts),
      baseline: compareToBaseline(attempts),
      assistance: readAssistance(attempts, { days: TRAJECTORY_DAYS, now }),
      dueCount: dueSkills.size,
      totalAttempts: attempts.length,
      attemptedExerciseIds: new Set(attempts.map((attempt) => attempt.exerciseId)),
    };
  }

  #weaknesses(mastery: ReadonlyMap<string, SkillMastery>): DashboardSkill[] {
    return (
      [...mastery.values()]
        // A skill nobody has practiced is not a weakness, it is unexplored;
        // listing it would bury the things the learner is genuinely losing.
        .filter((record) => record.observations > 0)
        .map((record) => ({
          skillId: record.skillId,
          name: this.skillGraph.has(record.skillId)
            ? this.skillGraph.get(record.skillId).name
            : record.skillId,
          category: this.skillGraph.has(record.skillId)
            ? this.skillGraph.get(record.skillId).category
            : 'Unknown',
          mastery: headlineMastery(record.vector),
          weakest: weakestDimensions(record.vector).slice(0, 3),
        }))
        .filter((entry) => entry.mastery < 0.7)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 5)
    );
  }

  #improvements(attempts: readonly Attempt[]): RecentImprovement[] {
    const exerciseIds = [...new Set(attempts.map((attempt) => attempt.exerciseId))];

    return exerciseIds
      .flatMap((exerciseId) => {
        if (!this.catalog.has(exerciseId)) return [];
        const exercise = this.catalog.get(exerciseId);
        const history = buildHistory(exerciseId, attempts, exercise.estimatedSeconds);
        const solved = history.attempts.filter((summary) => summary.metrics.solved);
        const first = solved[0]?.metrics.totalMs;
        const latest = solved.at(-1)?.metrics.totalMs;

        if (first === undefined || latest === undefined || solved.length < 2) return [];
        if (latest >= first) return [];

        return [{ exerciseId, title: exercise.title, fromMs: first, toMs: latest }];
      })
      .sort((a, b) => b.fromMs - b.toMs - (a.fromMs - a.toMs))
      .slice(0, 3);
  }
}

/** Collapse the raw attempt log into what the recommender needs per exercise. */
export function summarizeAttempts(attempts: readonly Attempt[]): Map<string, ExerciseHistory> {
  const byExercise = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const bucket = byExercise.get(attempt.exerciseId);
    if (bucket) bucket.push(attempt);
    else byExercise.set(attempt.exerciseId, [attempt]);
  }

  const summaries = new Map<string, ExerciseHistory>();
  for (const [exerciseId, group] of byExercise) {
    const ordered = [...group].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
    const metrics = ordered.map((attempt) => computeMetrics(attempt));
    const solved = metrics.filter((entry) => entry.solved);

    // Failures since the last success: an exercise failed three times last
    // month and solved since is not urgent, one failed three times running is.
    let recentFailures = 0;
    for (let index = metrics.length - 1; index >= 0; index -= 1) {
      if (metrics[index]?.solved) break;
      recentFailures += 1;
    }

    summaries.set(exerciseId, {
      attempts: ordered.length,
      solvedAttempts: solved.length,
      lastAttemptAt: ordered.at(-1)?.startedAt ?? null,
      lastWasIndependent: solved.at(-1)?.independent ?? false,
      recentFailures,
    });
  }

  return summaries;
}
