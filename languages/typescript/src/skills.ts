// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The TypeScript skill graph.
 *
 * For someone who writes JavaScript and treats the types as decoration.
 * The course is about making the compiler carry weight rather than about
 * annotating what you already wrote.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'typescript.basics.annotations',
    name: 'Annotating what you have',
    category: 'Basics',
    prerequisites: ['typescript.basics.inference'],
    description: 'Parameters, returns, and why inference is usually enough.',
  },
  {
    id: 'typescript.basics.inference',
    name: 'What the compiler already knows',
    category: 'Basics',
    prerequisites: [],
    description: 'Where an annotation adds nothing, and where it changes the type.',
  },
  {
    id: 'typescript.basics.literals',
    name: 'Literal and union types',
    category: 'Basics',
    prerequisites: ['typescript.basics.inference'],
  },
  {
    id: 'typescript.basics.narrowing',
    name: 'Narrowing',
    category: 'Basics',
    prerequisites: ['typescript.basics.literals'],
    description: 'How a check in the code becomes knowledge in the type.',
  },
  {
    id: 'typescript.shapes.objects',
    name: 'Object types and interfaces',
    category: 'Shapes',
    prerequisites: ['typescript.basics.annotations'],
  },
  {
    id: 'typescript.shapes.optional',
    name: 'Optional, readonly, and exactness',
    category: 'Shapes',
    prerequisites: ['typescript.shapes.objects'],
  },
  {
    id: 'typescript.shapes.discriminated',
    name: 'Discriminated unions',
    category: 'Shapes',
    prerequisites: ['typescript.shapes.objects', 'typescript.basics.narrowing'],
    description: 'The one pattern that replaces most inheritance in this language.',
  },
  {
    id: 'typescript.shapes.exhaustive',
    name: 'Exhaustiveness',
    category: 'Shapes',
    prerequisites: ['typescript.shapes.discriminated'],
    description: 'Making the compiler fail when a case is added and not handled.',
  },
  {
    id: 'typescript.generics.functions',
    name: 'Generic functions',
    category: 'Generics',
    prerequisites: ['typescript.basics.inference'],
  },
  {
    id: 'typescript.generics.constraints',
    name: 'Constraints',
    category: 'Generics',
    prerequisites: ['typescript.generics.functions'],
  },
  {
    id: 'typescript.generics.inference',
    name: 'Where inference gives up',
    category: 'Generics',
    prerequisites: ['typescript.generics.constraints'],
  },
  {
    id: 'typescript.types.utility',
    name: 'The utility types',
    category: 'Type operations',
    prerequisites: ['typescript.shapes.objects', 'typescript.generics.constraints'],
    description: 'Partial, Pick, Omit, Record — and writing them yourself once.',
  },
  {
    id: 'typescript.types.mapped',
    name: 'Mapped types',
    category: 'Type operations',
    prerequisites: ['typescript.types.utility'],
  },
  {
    id: 'typescript.types.conditional',
    name: 'Conditional types',
    category: 'Type operations',
    prerequisites: ['typescript.types.mapped'],
  },
  {
    id: 'typescript.boundaries.unknown',
    name: 'unknown, and never',
    category: 'Boundaries',
    prerequisites: ['typescript.basics.narrowing'],
    description: 'The two types that mean opposite things and are both about not knowing.',
  },
  {
    id: 'typescript.boundaries.assertions',
    name: 'Assertions, and why they are a promise',
    category: 'Boundaries',
    prerequisites: ['typescript.boundaries.unknown'],
  },
  {
    id: 'typescript.boundaries.validation',
    name: 'Validating at the edge',
    category: 'Boundaries',
    prerequisites: ['typescript.boundaries.unknown', 'typescript.shapes.discriminated'],
    description: 'Turning data that arrived from outside into a type you can trust.',
  },
  {
    id: 'typescript.boundaries.errors',
    name: 'Typed failure',
    category: 'Boundaries',
    prerequisites: ['typescript.shapes.discriminated'],
    description: 'Results as values, because a thrown error has no type.',
  },
  {
    id: 'typescript.config.strictness',
    name: 'The compiler flags that matter',
    category: 'Configuration',
    prerequisites: ['typescript.basics.narrowing'],
  },
  {
    id: 'typescript.config.declaration',
    name: 'Declaration files and library types',
    category: 'Configuration',
    prerequisites: ['typescript.shapes.objects'],
  },
];

export const typescriptSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'typescript',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const typescriptSkillGraph: SkillGraph = SkillGraph.from(typescriptSkills);
