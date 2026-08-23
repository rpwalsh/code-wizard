// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The Python skill graph (spec §6, §31).
 *
 * Prerequisites encode *what you must already be able to write*, not what you
 * must have read about. The target user is an experienced programmer, so the
 * graph is shallow on concepts and deep on language-specific production.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  // -- Syntax -------------------------------------------------------------
  {
    id: 'python.syntax.expressions',
    name: 'Expressions and operators',
    category: 'Syntax',
    prerequisites: [],
    description: 'Arithmetic, comparison, boolean and membership operators.',
  },
  {
    id: 'python.syntax.variables',
    name: 'Variables and assignment',
    category: 'Syntax',
    prerequisites: ['python.syntax.expressions'],
  },
  {
    id: 'python.syntax.strings',
    name: 'Strings and f-strings',
    category: 'Syntax',
    prerequisites: ['python.syntax.variables'],
  },
  {
    id: 'python.syntax.indentation',
    name: 'Blocks and indentation',
    category: 'Syntax',
    prerequisites: ['python.syntax.variables'],
  },
  {
    id: 'python.syntax.imports',
    name: 'Imports',
    category: 'Syntax',
    prerequisites: ['python.syntax.variables'],
  },

  // -- Control flow -------------------------------------------------------
  {
    id: 'python.control.conditionals',
    name: 'if / elif / else',
    category: 'Control Flow',
    prerequisites: ['python.syntax.indentation'],
  },
  {
    id: 'python.control.for',
    name: 'for loops',
    category: 'Control Flow',
    prerequisites: ['python.syntax.indentation'],
  },
  {
    id: 'python.control.while',
    name: 'while loops',
    category: 'Control Flow',
    prerequisites: ['python.control.conditionals'],
  },
  {
    id: 'python.control.loop-control',
    name: 'break and continue',
    category: 'Control Flow',
    prerequisites: ['python.control.for', 'python.control.while'],
  },
  {
    id: 'python.control.range-enumerate-zip',
    name: 'range, enumerate and zip',
    category: 'Control Flow',
    prerequisites: ['python.control.for'],
  },

  // -- Functions ----------------------------------------------------------
  {
    id: 'python.functions.definition',
    name: 'Defining and returning from functions',
    category: 'Functions',
    prerequisites: ['python.syntax.indentation'],
  },
  {
    id: 'python.functions.arguments',
    name: 'Positional, keyword and default arguments',
    category: 'Functions',
    prerequisites: ['python.functions.definition'],
  },
  {
    id: 'python.functions.varargs',
    name: '*args and **kwargs',
    category: 'Functions',
    prerequisites: ['python.functions.arguments'],
  },
  {
    id: 'python.functions.scope',
    name: 'Scope and closures',
    category: 'Functions',
    prerequisites: ['python.functions.definition'],
  },

  // -- Collections --------------------------------------------------------
  {
    id: 'python.collections.list',
    name: 'Lists',
    category: 'Collections',
    prerequisites: ['python.syntax.variables'],
  },
  {
    id: 'python.collections.tuple',
    name: 'Tuples and unpacking',
    category: 'Collections',
    prerequisites: ['python.collections.list'],
  },
  {
    id: 'python.collections.dict',
    name: 'Dictionaries',
    category: 'Collections',
    prerequisites: ['python.syntax.variables'],
  },
  {
    id: 'python.collections.dict-lookup',
    name: 'Safe dictionary lookup',
    category: 'Collections',
    description: 'dict.get, membership tests, and handling a missing key without KeyError.',
    prerequisites: ['python.collections.dict', 'python.control.conditionals'],
  },
  {
    id: 'python.collections.dict-mutation',
    name: 'Dictionary mutation',
    category: 'Collections',
    prerequisites: ['python.collections.dict-lookup'],
  },
  {
    id: 'python.collections.set',
    name: 'Sets',
    category: 'Collections',
    prerequisites: ['python.collections.list'],
  },
  {
    id: 'python.collections.slicing',
    name: 'Slicing',
    category: 'Collections',
    prerequisites: ['python.collections.list'],
  },
  {
    id: 'python.collections.comprehensions',
    name: 'Comprehensions',
    category: 'Collections',
    prerequisites: ['python.collections.list', 'python.control.for'],
  },
  {
    id: 'python.collections.nested',
    name: 'Nested collections',
    category: 'Collections',
    prerequisites: ['python.collections.dict-mutation', 'python.collections.list'],
  },

  // -- Pythonic patterns --------------------------------------------------
  {
    id: 'python.idioms.sorting',
    name: 'sorted with a key function',
    category: 'Pythonic Patterns',
    prerequisites: ['python.collections.list', 'python.functions.definition'],
  },
  {
    id: 'python.idioms.aggregation',
    name: 'any, all, sum, min and max',
    category: 'Pythonic Patterns',
    // Not comprehensions. `sum([1, 2, 3])` and `max(prices)` need a sequence
    // and nothing else; requiring comprehensions first made every lesson that
    // teaches a running total unreachable until forty lessons later, which the
    // syllabus ordering test caught.
    prerequisites: ['python.collections.list'],
  },
  {
    id: 'python.idioms.grouping',
    name: 'Grouping records with setdefault or defaultdict',
    category: 'Pythonic Patterns',
    prerequisites: ['python.collections.dict-mutation', 'python.control.for'],
  },

  // -- Errors -------------------------------------------------------------
  {
    id: 'python.errors.exceptions',
    name: 'Raising and catching exceptions',
    category: 'Errors',
    prerequisites: ['python.functions.definition', 'python.control.conditionals'],
  },
  {
    id: 'python.errors.custom',
    name: 'Custom exception types',
    category: 'Errors',
    prerequisites: ['python.errors.exceptions', 'python.modeling.classes'],
  },
  {
    id: 'python.errors.validation',
    name: 'Input validation and guard clauses',
    category: 'Errors',
    prerequisites: ['python.errors.exceptions'],
  },

  // -- Data modeling -----------------------------------------------------
  {
    id: 'python.modeling.classes',
    name: 'Classes and __init__',
    category: 'Data Modeling',
    prerequisites: ['python.functions.arguments'],
  },
  {
    id: 'python.modeling.dataclasses',
    name: 'Dataclasses',
    category: 'Data Modeling',
    prerequisites: ['python.modeling.classes', 'python.syntax.imports'],
  },
  {
    id: 'python.modeling.composition',
    name: 'Composition and delegation',
    category: 'Data Modeling',
    prerequisites: ['python.modeling.classes'],
  },
  {
    id: 'python.modeling.state',
    name: 'Modeling mutable state',
    category: 'Data Modeling',
    description: 'Holding, updating and querying state that outlives one call.',
    prerequisites: ['python.collections.nested', 'python.modeling.classes'],
  },

  // -- Standard library ---------------------------------------------------
  {
    id: 'python.stdlib.collections',
    name: 'collections: Counter, defaultdict, deque',
    category: 'Standard Library',
    prerequisites: ['python.idioms.grouping', 'python.syntax.imports'],
  },
  {
    id: 'python.stdlib.itertools',
    name: 'itertools',
    category: 'Standard Library',
    prerequisites: ['python.collections.comprehensions', 'python.syntax.imports'],
  },
  {
    id: 'python.stdlib.pathlib',
    name: 'pathlib',
    category: 'Standard Library',
    prerequisites: ['python.syntax.imports'],
  },
  {
    id: 'python.stdlib.datetime',
    name: 'datetime',
    category: 'Standard Library',
    prerequisites: ['python.syntax.imports'],
  },
  {
    id: 'python.stdlib.json',
    name: 'json',
    category: 'Standard Library',
    prerequisites: ['python.collections.nested', 'python.syntax.imports'],
  },

  // -- Engineering --------------------------------------------------------
  {
    id: 'python.engineering.testing',
    name: 'Writing tests with pytest',
    category: 'Engineering',
    prerequisites: ['python.functions.definition', 'python.syntax.imports'],
  },
  {
    id: 'python.engineering.files',
    name: 'Reading and writing files',
    category: 'Engineering',
    prerequisites: ['python.stdlib.pathlib', 'python.errors.exceptions'],
  },
  {
    id: 'python.engineering.cli',
    name: 'Command-line programs',
    category: 'Engineering',
    prerequisites: ['python.functions.arguments', 'python.syntax.imports'],
  },

  // -- Advanced -----------------------------------------------------------
  {
    id: 'python.advanced.generators',
    name: 'Generators and yield',
    category: 'Advanced',
    prerequisites: ['python.functions.definition', 'python.control.for'],
  },
  {
    id: 'python.advanced.context-managers',
    name: 'Context managers',
    category: 'Advanced',
    prerequisites: ['python.modeling.classes', 'python.errors.exceptions'],
  },
  {
    id: 'python.advanced.decorators',
    name: 'Decorators',
    category: 'Advanced',
    prerequisites: ['python.functions.scope', 'python.functions.varargs'],
  },
  {
    id: 'python.advanced.typing',
    name: 'Type annotations',
    category: 'Advanced',
    prerequisites: ['python.functions.arguments', 'python.modeling.dataclasses'],
  },

  // -- Recursion ----------------------------------------------------------
  //
  // Split from Functions because the failure mode is different. People do not
  // fail at recursion because they cannot write a function; they fail because
  // they cannot see the base case, or because they will not trust a recursive
  // call they have not finished writing yet. Both are practiced, not read.
  {
    id: 'python.recursion.base-case',
    name: 'Base cases and termination',
    category: 'Recursion',
    prerequisites: ['python.functions.definition', 'python.control.conditionals'],
    description: 'Recognizing what stops the recursion, before writing what continues it.',
  },
  {
    id: 'python.recursion.linear',
    name: 'Linear recursion',
    category: 'Recursion',
    prerequisites: ['python.recursion.base-case', 'python.collections.slicing'],
  },
  {
    id: 'python.recursion.tree',
    name: 'Tree recursion',
    category: 'Recursion',
    prerequisites: ['python.recursion.linear'],
    description: 'Two or more recursive calls per frame, and the branching that follows.',
  },
  {
    id: 'python.recursion.accumulator',
    name: 'Accumulator passing',
    category: 'Recursion',
    prerequisites: ['python.recursion.linear', 'python.functions.arguments'],
  },
  {
    id: 'python.recursion.memoization',
    name: 'Memoization',
    category: 'Recursion',
    prerequisites: ['python.recursion.tree', 'python.collections.dict-mutation'],
    description: 'Trading memory for repeated work, and seeing which calls actually repeat.',
  },

  // -- Complexity ---------------------------------------------------------
  //
  // Not a math topic here. The only question that matters is whether the
  // learner can predict which of two versions dies on real input, and that is
  // something to measure rather than assert.
  {
    id: 'python.complexity.counting',
    name: 'Counting operations',
    category: 'Complexity',
    prerequisites: ['python.control.for', 'python.collections.list'],
    description: 'Counting what actually runs, rather than reasoning about what should.',
  },
  {
    id: 'python.complexity.growth',
    name: 'Growth rates',
    category: 'Complexity',
    prerequisites: ['python.complexity.counting'],
  },
  {
    id: 'python.complexity.data-structure-choice',
    name: 'Choosing a data structure',
    category: 'Complexity',
    prerequisites: ['python.complexity.growth', 'python.collections.set'],
    description: 'Why membership in a list is a bug and membership in a set is not.',
  },

  // -- Data structures ----------------------------------------------------
  {
    id: 'python.structures.stack-queue',
    name: 'Stacks and queues',
    category: 'Data Structures',
    prerequisites: ['python.collections.list', 'python.stdlib.collections'],
  },
  {
    id: 'python.structures.linked',
    name: 'Linked structures',
    category: 'Data Structures',
    prerequisites: ['python.modeling.classes', 'python.recursion.linear'],
  },
  {
    id: 'python.structures.tree',
    name: 'Trees',
    category: 'Data Structures',
    prerequisites: ['python.structures.linked', 'python.recursion.tree'],
  },
  {
    id: 'python.structures.heap',
    name: 'Heaps and priority queues',
    category: 'Data Structures',
    prerequisites: ['python.structures.stack-queue', 'python.complexity.growth'],
  },
  {
    id: 'python.structures.graph-representation',
    name: 'Representing a graph',
    category: 'Data Structures',
    prerequisites: ['python.collections.nested', 'python.collections.set'],
    description: 'Adjacency lists and matrices, and what each one makes cheap.',
  },

  // -- Algorithms ---------------------------------------------------------
  {
    id: 'python.algorithms.linear-search',
    name: 'Linear scan',
    category: 'Algorithms',
    prerequisites: ['python.control.for', 'python.control.loop-control'],
  },
  {
    id: 'python.algorithms.binary-search',
    name: 'Binary search',
    category: 'Algorithms',
    prerequisites: ['python.algorithms.linear-search', 'python.complexity.growth'],
    description: 'The loop invariant, and the off-by-one that eats everyone.',
  },
  {
    id: 'python.algorithms.two-pointer',
    name: 'Two pointers and sliding windows',
    category: 'Algorithms',
    prerequisites: ['python.algorithms.linear-search', 'python.collections.slicing'],
  },
  {
    id: 'python.algorithms.sorting',
    name: 'Sorting algorithms',
    category: 'Algorithms',
    prerequisites: ['python.recursion.tree', 'python.complexity.growth'],
  },
  {
    id: 'python.algorithms.traversal',
    name: 'Breadth-first and depth-first traversal',
    category: 'Algorithms',
    prerequisites: [
      'python.structures.graph-representation',
      'python.structures.stack-queue',
      'python.recursion.base-case',
    ],
    description: 'The visited set is the algorithm. Everything else is bookkeeping.',
  },
  {
    id: 'python.algorithms.shortest-path',
    name: 'Shortest paths',
    category: 'Algorithms',
    prerequisites: ['python.algorithms.traversal', 'python.structures.heap'],
  },
  {
    id: 'python.algorithms.topological',
    name: 'Topological ordering and cycles',
    category: 'Algorithms',
    prerequisites: ['python.algorithms.traversal'],
  },
  {
    id: 'python.algorithms.dynamic-programming',
    name: 'Dynamic programming',
    category: 'Algorithms',
    prerequisites: ['python.recursion.memoization', 'python.complexity.growth'],
  },

  // -- Numerical ----------------------------------------------------------
  //
  // The last stretch before PageRank. Iterating a computation until it stops
  // moving is a different mental model from looping a fixed number of times,
  // and it is where "it runs" and "it is correct" finally come apart.
  {
    id: 'python.algorithms.backtracking',
    name: 'Backtracking',
    category: 'Algorithms',
    prerequisites: ['python.recursion.tree', 'python.collections.list'],
    description: 'Choose, recurse, and undo the choice. The undo is the part people forget.',
  },
  {
    id: 'python.algorithms.intervals',
    name: 'Intervals',
    category: 'Algorithms',
    prerequisites: ['python.idioms.sorting'],
    description: 'Overlap, merge and insertion — almost always a sort followed by one pass.',
  },
  {
    id: 'python.structures.trie',
    name: 'Prefix trees',
    category: 'Data Structures',
    prerequisites: ['python.structures.tree', 'python.collections.dict-mutation'],
  },

  {
    id: 'python.numerical.floats',
    name: 'Floating point behavior',
    category: 'Numerical',
    prerequisites: ['python.syntax.expressions'],
    description: 'Why equality is the wrong question, and what to ask instead.',
  },
  {
    id: 'python.numerical.vectors',
    name: 'Vectors and normalization',
    category: 'Numerical',
    prerequisites: ['python.numerical.floats', 'python.idioms.aggregation'],
  },
  {
    id: 'python.numerical.iteration',
    name: 'Iterating to convergence',
    category: 'Numerical',
    prerequisites: ['python.numerical.vectors', 'python.control.while'],
  },
  {
    id: 'python.numerical.pagerank',
    name: 'PageRank',
    category: 'Numerical',
    prerequisites: [
      'python.numerical.iteration',
      'python.structures.graph-representation',
      'python.algorithms.traversal',
    ],
    description: 'A graph, a vector, and a loop that stops when nothing changes.',
  },
];

export const pythonSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'python',
}));

/** Built once at module load, which also means a bad edit fails fast. */
export const pythonSkillGraph: SkillGraph = SkillGraph.from(pythonSkills);
