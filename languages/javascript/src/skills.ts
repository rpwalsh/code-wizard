import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The JavaScript skill graph.
 *
 * Deliberately not a translation of the Python one. The two languages fail
 * differently, and a graph that mirrors another language's shape teaches the
 * first language's habits in the second language's syntax — which is the exact
 * thing the translation exercises exist to unlearn.
 *
 * What is specific here: equality and coercion get their own thread, because
 * they are the single largest source of confident wrong answers. `this` and
 * asynchrony get more room than their conceptual weight suggests, because they
 * are where working programmers actually lose time. And modules come early
 * rather than late, because nothing in this ecosystem is one file.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  // -- Syntax -------------------------------------------------------------
  {
    id: 'javascript.syntax.values',
    name: 'Values and operators',
    category: 'Syntax',
    prerequisites: [],
    description: 'Numbers, strings, booleans, and the operators that combine them.',
  },
  {
    id: 'javascript.syntax.bindings',
    name: 'const, let and scope',
    category: 'Syntax',
    prerequisites: ['javascript.syntax.values'],
    description: 'Block scope, reassignment, and why const does not mean immutable.',
  },
  {
    id: 'javascript.syntax.strings',
    name: 'Strings and templates',
    category: 'Syntax',
    prerequisites: ['javascript.syntax.bindings'],
  },
  {
    id: 'javascript.syntax.equality',
    name: 'Equality and coercion',
    category: 'Syntax',
    prerequisites: ['javascript.syntax.values'],
    description: 'Why == has its own rules, and the values that are falsy but present.',
  },
  {
    id: 'javascript.syntax.nullish',
    name: 'null, undefined and the nullish operators',
    category: 'Syntax',
    prerequisites: ['javascript.syntax.equality'],
    description: 'Two kinds of absent, and the operators that tell them from falsy.',
  },
  {
    id: 'javascript.syntax.modules',
    name: 'Modules',
    category: 'Syntax',
    prerequisites: ['javascript.syntax.bindings'],
    description: 'import, export, and what a module does at load time.',
  },

  // -- Control flow -------------------------------------------------------
  {
    id: 'javascript.control.conditionals',
    name: 'Conditionals',
    category: 'Control Flow',
    prerequisites: ['javascript.syntax.equality'],
  },
  {
    id: 'javascript.control.loops',
    name: 'Loops',
    category: 'Control Flow',
    prerequisites: ['javascript.syntax.bindings'],
    description: 'for, for...of, for...in, while — and which of them lies about arrays.',
  },
  {
    id: 'javascript.control.exceptions',
    name: 'throw, try and catch',
    category: 'Control Flow',
    prerequisites: ['javascript.functions.declaration'],
  },

  // -- Functions ----------------------------------------------------------
  {
    id: 'javascript.functions.declaration',
    name: 'Functions and arrows',
    category: 'Functions',
    prerequisites: ['javascript.syntax.bindings'],
  },
  {
    id: 'javascript.functions.parameters',
    name: 'Parameters, defaults and rest',
    category: 'Functions',
    prerequisites: ['javascript.functions.declaration'],
  },
  {
    id: 'javascript.functions.closures',
    name: 'Closures',
    category: 'Functions',
    prerequisites: ['javascript.functions.declaration'],
  },
  {
    id: 'javascript.functions.this',
    name: 'this, and how it is decided',
    category: 'Functions',
    prerequisites: ['javascript.functions.closures'],
    description: 'Call-site binding, and the one thing arrow functions really change.',
  },
  {
    id: 'javascript.functions.higher-order',
    name: 'Functions as values',
    category: 'Functions',
    prerequisites: ['javascript.functions.closures'],
  },

  // -- Data ---------------------------------------------------------------
  {
    id: 'javascript.data.arrays',
    name: 'Arrays',
    category: 'Data',
    prerequisites: ['javascript.syntax.bindings'],
  },
  {
    id: 'javascript.data.array-methods',
    name: 'map, filter, reduce',
    category: 'Data',
    prerequisites: ['javascript.data.arrays', 'javascript.functions.higher-order'],
  },
  {
    id: 'javascript.data.objects',
    name: 'Objects',
    category: 'Data',
    prerequisites: ['javascript.syntax.bindings'],
  },
  {
    id: 'javascript.data.destructuring',
    name: 'Destructuring and spread',
    category: 'Data',
    prerequisites: ['javascript.data.objects', 'javascript.data.arrays'],
  },
  {
    id: 'javascript.data.reference',
    name: 'References and copying',
    category: 'Data',
    prerequisites: ['javascript.data.objects'],
    description: 'Shallow versus deep, and what spread actually duplicates.',
  },
  {
    id: 'javascript.data.collections',
    name: 'Map, Set and when to use them',
    category: 'Data',
    prerequisites: ['javascript.data.objects'],
  },
  {
    id: 'javascript.data.json',
    name: 'JSON',
    category: 'Data',
    prerequisites: ['javascript.data.objects'],
  },

  // -- Asynchrony ---------------------------------------------------------
  {
    id: 'javascript.async.callbacks',
    name: 'The event loop',
    category: 'Asynchrony',
    prerequisites: ['javascript.functions.higher-order'],
    description: 'Why nothing runs in the middle of your function, and what that buys.',
  },
  {
    id: 'javascript.async.promises',
    name: 'Promises',
    category: 'Asynchrony',
    prerequisites: ['javascript.async.callbacks'],
  },
  {
    id: 'javascript.async.await',
    name: 'async and await',
    category: 'Asynchrony',
    prerequisites: ['javascript.async.promises'],
  },
  {
    id: 'javascript.async.concurrency',
    name: 'Running several at once',
    category: 'Asynchrony',
    prerequisites: ['javascript.async.await'],
    description: 'all, allSettled, race — and the await inside a loop that serialised everything.',
  },
  {
    id: 'javascript.async.errors',
    name: 'Failure in asynchronous code',
    category: 'Asynchrony',
    prerequisites: ['javascript.async.await', 'javascript.control.exceptions'],
    description: 'The rejection nobody caught, and the promise nobody awaited.',
  },

  // -- Modelling ----------------------------------------------------------
  {
    id: 'javascript.modeling.classes',
    name: 'Classes',
    category: 'Modelling',
    prerequisites: ['javascript.functions.this'],
  },
  {
    id: 'javascript.modeling.prototypes',
    name: 'Prototypes',
    category: 'Modelling',
    prerequisites: ['javascript.modeling.classes'],
    description: 'What a class is underneath, and why that still shows through.',
  },
  {
    id: 'javascript.modeling.immutability',
    name: 'Working without mutating',
    category: 'Modelling',
    prerequisites: ['javascript.data.reference', 'javascript.data.destructuring'],
    description: 'Producing a changed copy, which is the whole discipline behind modern UI state.',
  },

  // -- Iteration ----------------------------------------------------------
  {
    id: 'javascript.iteration.iterables',
    name: 'Iterables and iterators',
    category: 'Iteration',
    prerequisites: ['javascript.control.loops', 'javascript.data.objects'],
  },
  {
    id: 'javascript.iteration.generators',
    name: 'Generators',
    category: 'Iteration',
    prerequisites: ['javascript.iteration.iterables'],
  },

  // -- Engineering --------------------------------------------------------
  {
    id: 'javascript.engineering.testing',
    name: 'Writing tests',
    category: 'Engineering',
    prerequisites: ['javascript.syntax.modules', 'javascript.functions.declaration'],
  },
  {
    id: 'javascript.engineering.errors',
    name: 'Error types and boundaries',
    category: 'Engineering',
    prerequisites: ['javascript.control.exceptions', 'javascript.modeling.classes'],
  },
  {
    id: 'javascript.engineering.api',
    name: 'Designing a module interface',
    category: 'Engineering',
    prerequisites: ['javascript.syntax.modules', 'javascript.functions.parameters'],
  },
];

export const javascriptSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'javascript',
}));

/** Built once at module load, which also means a bad edit fails fast. */
export const javascriptSkillGraph: SkillGraph = SkillGraph.from(javascriptSkills);
