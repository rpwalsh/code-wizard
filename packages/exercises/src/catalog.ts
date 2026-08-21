import type { SkillGraph } from '@forge/core';

import { findExerciseDirectories, loadExercise, ExerciseLoadError } from './loader.ts';
import type { Exercise } from './model.ts';

export interface CatalogLoadReport {
  readonly catalog: ExerciseCatalog;
  /** Directories that failed to load. A broken exercise never silently vanishes. */
  readonly failures: readonly { directory: string; message: string }[];
}

/** An in-memory, immutable index of every loadable exercise. */
export class ExerciseCatalog {
  readonly #byId: ReadonlyMap<string, Exercise>;
  readonly #bySkill: ReadonlyMap<string, readonly Exercise[]>;

  constructor(exercises: readonly Exercise[]) {
    const byId = new Map<string, Exercise>();
    for (const exercise of exercises) {
      const existing = byId.get(exercise.id);
      if (existing) {
        throw new Error(
          `Duplicate exercise id "${exercise.id}" in ${existing.source.directory} and ${exercise.source.directory}.`,
        );
      }
      byId.set(exercise.id, exercise);
    }

    const bySkill = new Map<string, Exercise[]>();
    for (const exercise of exercises) {
      for (const skill of exercise.skills) {
        const bucket = bySkill.get(skill);
        if (bucket) bucket.push(exercise);
        else bySkill.set(skill, [exercise]);
      }
    }

    this.#byId = byId;
    this.#bySkill = bySkill;
  }

  static async load(roots: readonly string[]): Promise<CatalogLoadReport> {
    const exercises: Exercise[] = [];
    const failures: { directory: string; message: string }[] = [];

    for (const root of roots) {
      for (const directory of await findExerciseDirectories(root)) {
        try {
          exercises.push(await loadExercise(directory));
        } catch (error) {
          failures.push({
            directory,
            message: error instanceof ExerciseLoadError ? error.message : String(error),
          });
        }
      }
    }

    return { catalog: new ExerciseCatalog(exercises), failures };
  }

  get size(): number {
    return this.#byId.size;
  }

  has(id: string): boolean {
    return this.#byId.has(id);
  }

  get(id: string): Exercise {
    const exercise = this.#byId.get(id);
    if (!exercise) throw new Error(`Unknown exercise "${id}".`);
    return exercise;
  }

  all(): Exercise[] {
    return [...this.#byId.values()];
  }

  forLanguage(language: string): Exercise[] {
    return this.all().filter((exercise) => exercise.language === language);
  }

  forSkill(skillId: string): readonly Exercise[] {
    return this.#bySkill.get(skillId) ?? [];
  }

  /** Every skill id referenced by any exercise. */
  referencedSkills(): string[] {
    return [...this.#bySkill.keys()].sort();
  }

  /** Skills in the graph that no exercise trains — a curriculum coverage hole. */
  uncoveredSkills(graph: SkillGraph): string[] {
    return graph
      .all()
      .map((skill) => skill.id)
      .filter((id) => this.forSkill(id).length === 0);
  }
}
