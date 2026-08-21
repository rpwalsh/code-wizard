import type { Skill } from '@forge/core';
import { SkillGraph } from '@forge/core';

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
    prerequisites: ['python.collections.comprehensions'],
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

  // -- Data modelling -----------------------------------------------------
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
    name: 'Modelling mutable state',
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
];

export const pythonSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'python',
}));

/** Built once at module load, which also means a bad edit fails fast. */
export const pythonSkillGraph: SkillGraph = SkillGraph.from(pythonSkills);
