// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';

/**
 * The Go skill graph.
 *
 * For someone coming from a language with exceptions and inheritance, both
 * of which are absent here. About errors as values, interfaces satisfied
 * implicitly, and concurrency you can reason about.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'go.basics.types',
    name: 'Types and zero values',
    category: 'Basics',
    prerequisites: [],
    description: 'Every type has a usable zero, and that shapes the language.',
  },
  {
    id: 'go.basics.functions',
    name: 'Functions and multiple returns',
    category: 'Basics',
    prerequisites: ['go.basics.types'],
  },
  {
    id: 'go.basics.slices',
    name: 'Slices',
    category: 'Basics',
    prerequisites: ['go.basics.types'],
    description: 'Length, capacity, and the append that shared an array.',
  },
  {
    id: 'go.basics.maps',
    name: 'Maps',
    category: 'Basics',
    prerequisites: ['go.basics.types'],
  },
  {
    id: 'go.basics.structs',
    name: 'Structs',
    category: 'Basics',
    prerequisites: ['go.basics.types'],
  },
  {
    id: 'go.errors.values',
    name: 'Errors are values',
    category: 'Errors',
    prerequisites: ['go.basics.functions'],
  },
  {
    id: 'go.errors.wrapping',
    name: 'Wrapping and unwrapping',
    category: 'Errors',
    prerequisites: ['go.errors.values'],
  },
  {
    id: 'go.errors.sentinel',
    name: 'Sentinel errors and error types',
    category: 'Errors',
    prerequisites: ['go.errors.wrapping'],
  },
  {
    id: 'go.errors.panic',
    name: 'panic, recover, and when neither',
    category: 'Errors',
    prerequisites: ['go.errors.values'],
  },
  {
    id: 'go.types.methods',
    name: 'Methods, and the receiver',
    category: 'Types',
    prerequisites: ['go.basics.structs'],
    description: 'Value or pointer, and the copy you did not mean to make.',
  },
  {
    id: 'go.types.interfaces',
    name: 'Interfaces',
    category: 'Types',
    prerequisites: ['go.types.methods'],
    description: 'Satisfied implicitly, and defined by the consumer.',
  },
  {
    id: 'go.types.embedding',
    name: 'Embedding',
    category: 'Types',
    prerequisites: ['go.types.interfaces'],
  },
  {
    id: 'go.types.nil-interface',
    name: 'The nil that is not nil',
    category: 'Types',
    prerequisites: ['go.types.interfaces'],
    description: 'A typed nil in an interface, and the check that passes when it should not.',
  },
  {
    id: 'go.concurrency.goroutines',
    name: 'Goroutines',
    category: 'Concurrency',
    prerequisites: ['go.basics.functions'],
  },
  {
    id: 'go.concurrency.channels',
    name: 'Channels',
    category: 'Concurrency',
    prerequisites: ['go.concurrency.goroutines'],
  },
  {
    id: 'go.concurrency.select',
    name: 'select',
    category: 'Concurrency',
    prerequisites: ['go.concurrency.channels'],
  },
  {
    id: 'go.concurrency.context',
    name: 'Context, and cancellation',
    category: 'Concurrency',
    prerequisites: ['go.concurrency.select'],
  },
  {
    id: 'go.concurrency.races',
    name: 'Data races',
    category: 'Concurrency',
    prerequisites: ['go.concurrency.goroutines'],
    description: 'Found with the detector rather than by reasoning.',
  },
  {
    id: 'go.concurrency.patterns',
    name: 'Fan-out, fan-in, and bounded work',
    category: 'Concurrency',
    prerequisites: ['go.concurrency.select'],
  },
  {
    id: 'go.engineering.testing',
    name: 'Testing, and table tests',
    category: 'Engineering',
    prerequisites: ['go.errors.values'],
  },
  {
    id: 'go.engineering.packages',
    name: 'Packages and visibility',
    category: 'Engineering',
    prerequisites: ['go.basics.functions'],
  },
];

export const goSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'go',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const goSkillGraph: SkillGraph = SkillGraph.from(goSkills);
