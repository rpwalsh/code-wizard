// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';

/**
 * The Rust skill graph.
 *
 * For someone who has bounced off the borrow checker. Built around making
 * ownership feel like a description of what your program already does
 * rather than a tax on writing it.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'rust.own.move',
    name: 'Move semantics',
    category: 'Ownership',
    prerequisites: [],
    description: 'Where the value went, and why the compiler will not let you follow.',
  },
  {
    id: 'rust.own.borrow',
    name: 'Borrowing',
    category: 'Ownership',
    prerequisites: ['rust.own.move'],
  },
  {
    id: 'rust.own.mutable',
    name: 'One mutable borrow',
    category: 'Ownership',
    prerequisites: ['rust.own.borrow'],
    description: 'The rule that removes data races, and the code it refuses.',
  },
  {
    id: 'rust.own.lifetimes',
    name: 'Lifetimes',
    category: 'Ownership',
    prerequisites: ['rust.own.borrow'],
    description: 'Naming how long a reference is good for, and mostly not having to.',
  },
  {
    id: 'rust.own.clone',
    name: 'When cloning is the right answer',
    category: 'Ownership',
    prerequisites: ['rust.own.move'],
  },
  {
    id: 'rust.types.enums',
    name: 'Enums and pattern matching',
    category: 'Types',
    prerequisites: [],
  },
  {
    id: 'rust.types.option',
    name: 'Option',
    category: 'Types',
    prerequisites: ['rust.types.enums'],
    description: 'No null, and the compiler making you say what happens when there is nothing.',
  },
  {
    id: 'rust.types.result',
    name: 'Result',
    category: 'Types',
    prerequisites: ['rust.types.enums'],
  },
  {
    id: 'rust.types.question',
    name: 'The question mark',
    category: 'Types',
    prerequisites: ['rust.types.result'],
  },
  {
    id: 'rust.types.traits',
    name: 'Traits',
    category: 'Types',
    prerequisites: ['rust.types.enums'],
  },
  {
    id: 'rust.types.generics',
    name: 'Generics and bounds',
    category: 'Types',
    prerequisites: ['rust.types.traits'],
  },
  {
    id: 'rust.data.vec',
    name: 'Vec and slices',
    category: 'Data',
    prerequisites: ['rust.own.borrow'],
  },
  {
    id: 'rust.data.strings',
    name: 'String and &str',
    category: 'Data',
    prerequisites: ['rust.own.borrow'],
    description: 'Two string types, and why that is not gratuitous.',
  },
  {
    id: 'rust.data.hashmap',
    name: 'HashMap, and the entry API',
    category: 'Data',
    prerequisites: ['rust.data.vec'],
  },
  {
    id: 'rust.data.iterators',
    name: 'Iterators',
    category: 'Data',
    prerequisites: ['rust.types.traits'],
    description: 'Lazy, chainable, and compiling to the loop you would have written.',
  },
  {
    id: 'rust.errors.types',
    name: 'Error types of your own',
    category: 'Errors',
    prerequisites: ['rust.types.result'],
  },
  {
    id: 'rust.errors.boundaries',
    name: 'Errors across a boundary',
    category: 'Errors',
    prerequisites: ['rust.errors.types'],
  },
  {
    id: 'rust.shared.rc',
    name: 'Shared ownership',
    category: 'Sharing',
    prerequisites: ['rust.own.move'],
    description: 'Rc and RefCell, and the runtime check that replaces the compile-time one.',
  },
  {
    id: 'rust.shared.threads',
    name: 'Threads, and what may cross',
    category: 'Sharing',
    prerequisites: ['rust.own.mutable'],
  },
  {
    id: 'rust.shared.sync',
    name: 'Mutex, and Arc',
    category: 'Sharing',
    prerequisites: ['rust.shared.threads'],
  },
];

export const rustSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'rust',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const rustSkillGraph: SkillGraph = SkillGraph.from(rustSkills);
