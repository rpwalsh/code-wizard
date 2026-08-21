export type SkillId = string;

export interface Skill {
  readonly id: SkillId;
  readonly name: string;
  /** Taxonomy grouping for display, e.g. `Collections`. Not a dependency. */
  readonly category: string;
  readonly description?: string;
  /** Skills that must be at least partially mastered first (spec §6). */
  readonly prerequisites: readonly SkillId[];
  /** Language this skill belongs to, or `null` for cross-language concepts. */
  readonly language: string | null;
}

export class SkillGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkillGraphError';
  }
}

/**
 * A validated directed acyclic graph of skills. Construction fails loudly on
 * unknown prerequisites or cycles — a broken graph silently mis-sequences the
 * entire curriculum, so it must never be constructible.
 */
export class SkillGraph {
  readonly #skills: ReadonlyMap<SkillId, Skill>;
  readonly #dependents: ReadonlyMap<SkillId, readonly SkillId[]>;
  readonly #order: readonly SkillId[];

  private constructor(
    skills: Map<SkillId, Skill>,
    dependents: Map<SkillId, SkillId[]>,
    order: SkillId[],
  ) {
    this.#skills = skills;
    this.#dependents = dependents;
    this.#order = order;
  }

  static from(skills: readonly Skill[]): SkillGraph {
    const byId = new Map<SkillId, Skill>();
    for (const skill of skills) {
      if (byId.has(skill.id)) {
        throw new SkillGraphError(`Duplicate skill id "${skill.id}".`);
      }
      byId.set(skill.id, skill);
    }

    const dependents = new Map<SkillId, SkillId[]>();
    for (const skill of skills) dependents.set(skill.id, []);
    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) {
        if (!byId.has(prerequisite)) {
          throw new SkillGraphError(
            `Skill "${skill.id}" requires unknown prerequisite "${prerequisite}".`,
          );
        }
        dependents.get(prerequisite)?.push(skill.id);
      }
    }

    return new SkillGraph(byId, dependents, topologicalOrder(skills, byId));
  }

  get size(): number {
    return this.#skills.size;
  }

  has(id: SkillId): boolean {
    return this.#skills.has(id);
  }

  get(id: SkillId): Skill {
    const skill = this.#skills.get(id);
    if (!skill) throw new SkillGraphError(`Unknown skill "${id}".`);
    return skill;
  }

  all(): Skill[] {
    return [...this.#skills.values()];
  }

  /** Prerequisites first. Stable across runs for a given input order. */
  topological(): readonly SkillId[] {
    return this.#order;
  }

  directPrerequisites(id: SkillId): readonly SkillId[] {
    return this.get(id).prerequisites;
  }

  /** Skills that list `id` as a prerequisite. */
  dependents(id: SkillId): readonly SkillId[] {
    this.get(id);
    return this.#dependents.get(id) ?? [];
  }

  /** Transitive prerequisite closure, prerequisites-first. */
  ancestors(id: SkillId): SkillId[] {
    const seen = new Set<SkillId>();
    const result: SkillId[] = [];
    const visit = (current: SkillId): void => {
      for (const prerequisite of this.get(current).prerequisites) {
        if (seen.has(prerequisite)) continue;
        seen.add(prerequisite);
        visit(prerequisite);
        result.push(prerequisite);
      }
    };
    visit(id);
    return result;
  }
}

function topologicalOrder(
  skills: readonly Skill[],
  byId: ReadonlyMap<SkillId, Skill>,
): SkillId[] {
  const state = new Map<SkillId, 'visiting' | 'done'>();
  const order: SkillId[] = [];
  const stack: SkillId[] = [];

  const visit = (id: SkillId): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      const cycle = [...stack.slice(stack.indexOf(id)), id].join(' -> ');
      throw new SkillGraphError(`Cycle detected in skill prerequisites: ${cycle}`);
    }
    state.set(id, 'visiting');
    stack.push(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite);
    stack.pop();
    state.set(id, 'done');
    order.push(id);
  };

  for (const skill of skills) visit(skill.id);
  return order;
}
