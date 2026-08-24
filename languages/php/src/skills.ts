// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';

/**
 * The PHP skill graph.
 *
 * For someone maintaining PHP written across three eras of the language.
 * About types, the request lifecycle, and the security properties that are
 * the whole reason to care.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'php.types.declarations',
    name: 'Type declarations',
    category: 'Types',
    prerequisites: [],
    description: 'Strict types, and what the engine does without them.',
  },
  {
    id: 'php.types.coercion',
    name: 'Coercion, and comparison',
    category: 'Types',
    prerequisites: ['php.types.declarations'],
    description: 'The loose comparison table, and why the strict one is the default worth having.',
  },
  {
    id: 'php.types.arrays',
    name: 'Arrays are both',
    category: 'Types',
    prerequisites: ['php.types.declarations'],
    description: 'A list and a map in one structure, and where that leaks.',
  },
  {
    id: 'php.types.null',
    name: 'null, and the safe operators',
    category: 'Types',
    prerequisites: ['php.types.coercion'],
  },
  {
    id: 'php.structure.functions',
    name: 'Functions and closures',
    category: 'Structure',
    prerequisites: ['php.types.declarations'],
  },
  {
    id: 'php.structure.classes',
    name: 'Classes, and modern syntax',
    category: 'Structure',
    prerequisites: ['php.structure.functions'],
  },
  {
    id: 'php.structure.interfaces',
    name: 'Interfaces and traits',
    category: 'Structure',
    prerequisites: ['php.structure.classes'],
  },
  {
    id: 'php.structure.enums',
    name: 'Enums',
    category: 'Structure',
    prerequisites: ['php.structure.classes'],
  },
  {
    id: 'php.structure.autoload',
    name: 'Namespaces and autoloading',
    category: 'Structure',
    prerequisites: ['php.structure.classes'],
  },
  {
    id: 'php.request.lifecycle',
    name: 'The request lifecycle',
    category: 'Request',
    prerequisites: [],
    description: 'Shared nothing, and what that means for state.',
  },
  {
    id: 'php.request.input',
    name: 'Input, and never trusting it',
    category: 'Request',
    prerequisites: ['php.request.lifecycle'],
  },
  {
    id: 'php.request.output',
    name: 'Output and escaping',
    category: 'Request',
    prerequisites: ['php.request.input'],
  },
  {
    id: 'php.request.sessions',
    name: 'Sessions and cookies',
    category: 'Request',
    prerequisites: ['php.request.lifecycle'],
  },
  {
    id: 'php.data.pdo',
    name: 'Talking to a database',
    category: 'Data',
    prerequisites: ['php.request.input'],
  },
  {
    id: 'php.data.injection',
    name: 'Injection, prevented properly',
    category: 'Data',
    prerequisites: ['php.data.pdo'],
    description: 'Prepared statements, and why escaping by hand is not the same thing.',
  },
  {
    id: 'php.data.transactions',
    name: 'Transactions',
    category: 'Data',
    prerequisites: ['php.data.pdo'],
  },
  {
    id: 'php.errors.exceptions',
    name: 'Exceptions and error levels',
    category: 'Errors',
    prerequisites: ['php.structure.classes'],
  },
  {
    id: 'php.errors.handling',
    name: 'Handling, logging and not leaking',
    category: 'Errors',
    prerequisites: ['php.errors.exceptions'],
  },
  {
    id: 'php.engineering.composer',
    name: 'Dependencies',
    category: 'Engineering',
    prerequisites: ['php.structure.autoload'],
  },
  {
    id: 'php.engineering.testing',
    name: 'Testing',
    category: 'Engineering',
    prerequisites: ['php.structure.classes'],
  },
];

export const phpSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'php',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const phpSkillGraph: SkillGraph = SkillGraph.from(phpSkills);
