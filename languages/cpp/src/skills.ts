// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The C++ skill graph.
 *
 * For someone who writes C with classes and keeps meeting the parts that
 * were added since. Built entirely around lifetime: what owns what, and
 * what happens when it goes away.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'cpp.lifetime.raii',
    name: 'RAII',
    category: 'Lifetime',
    prerequisites: [],
    description: 'Acquisition is initialization, and destruction is the cleanup you never write.',
  },
  {
    id: 'cpp.lifetime.rule',
    name: 'Copy, move, and the rule of zero',
    category: 'Lifetime',
    prerequisites: ['cpp.lifetime.raii'],
  },
  {
    id: 'cpp.lifetime.unique',
    name: 'unique_ptr',
    category: 'Lifetime',
    prerequisites: ['cpp.lifetime.raii'],
  },
  {
    id: 'cpp.lifetime.shared',
    name: 'shared_ptr, and the cycle',
    category: 'Lifetime',
    prerequisites: ['cpp.lifetime.unique'],
  },
  {
    id: 'cpp.lifetime.references',
    name: 'References, and dangling ones',
    category: 'Lifetime',
    prerequisites: ['cpp.lifetime.raii'],
  },
  {
    id: 'cpp.values.move',
    name: 'Move semantics',
    category: 'Values',
    prerequisites: ['cpp.lifetime.rule'],
  },
  {
    id: 'cpp.values.const',
    name: 'const, and what it promises',
    category: 'Values',
    prerequisites: ['cpp.lifetime.references'],
  },
  {
    id: 'cpp.values.auto',
    name: 'auto, and when it hides something',
    category: 'Values',
    prerequisites: ['cpp.values.const'],
  },
  {
    id: 'cpp.std.containers',
    name: 'The containers',
    category: 'Standard library',
    prerequisites: ['cpp.lifetime.raii'],
  },
  {
    id: 'cpp.std.algorithms',
    name: 'The algorithms',
    category: 'Standard library',
    prerequisites: ['cpp.std.containers'],
    description: 'The loop you did not write, and the name that says what it does.',
  },
  {
    id: 'cpp.std.strings',
    name: 'Strings and string views',
    category: 'Standard library',
    prerequisites: ['cpp.std.containers'],
  },
  {
    id: 'cpp.std.optional',
    name: 'optional, variant, expected',
    category: 'Standard library',
    prerequisites: ['cpp.std.containers'],
  },
  {
    id: 'cpp.types.classes',
    name: 'Classes and invariants',
    category: 'Types',
    prerequisites: ['cpp.lifetime.rule'],
  },
  {
    id: 'cpp.types.polymorphism',
    name: 'Virtual functions',
    category: 'Types',
    prerequisites: ['cpp.types.classes'],
  },
  {
    id: 'cpp.types.templates',
    name: 'Templates',
    category: 'Types',
    prerequisites: ['cpp.types.classes'],
  },
  {
    id: 'cpp.types.concepts',
    name: 'Constraining a template',
    category: 'Types',
    prerequisites: ['cpp.types.templates'],
  },
  {
    id: 'cpp.errors.exceptions',
    name: 'Exceptions, and exception safety',
    category: 'Errors',
    prerequisites: ['cpp.lifetime.raii'],
  },
  {
    id: 'cpp.errors.guarantees',
    name: 'The three guarantees',
    category: 'Errors',
    prerequisites: ['cpp.errors.exceptions'],
  },
];

export const cppSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'cpp',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const cppSkillGraph: SkillGraph = SkillGraph.from(cppSkills);
