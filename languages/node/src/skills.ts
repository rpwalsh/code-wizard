// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';

/**
 * The Node skill graph.
 *
 * Server-side JavaScript for someone who can already write the language.
 * About processes, streams, failure and the things that only go wrong
 * under load.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'node.runtime.modules',
    name: 'Modules and resolution',
    category: 'Runtime',
    prerequisites: [],
    description: 'How a specifier becomes a file, and the two module systems.',
  },
  {
    id: 'node.runtime.process',
    name: 'The process',
    category: 'Runtime',
    prerequisites: ['node.runtime.modules'],
    description: 'Arguments, environment, exit codes, and signals.',
  },
  {
    id: 'node.runtime.eventloop',
    name: 'The loop, under load',
    category: 'Runtime',
    prerequisites: ['node.runtime.process'],
    description: 'What blocks it, and how to notice from outside.',
  },
  {
    id: 'node.io.files',
    name: 'Files',
    category: 'Input and output',
    prerequisites: ['node.runtime.modules'],
  },
  {
    id: 'node.io.paths',
    name: 'Paths',
    category: 'Input and output',
    prerequisites: ['node.io.files'],
  },
  {
    id: 'node.io.streams',
    name: 'Streams',
    category: 'Input and output',
    prerequisites: ['node.io.files'],
    description: 'Backpressure, and why reading a file into memory stops working.',
  },
  {
    id: 'node.io.pipelines',
    name: 'Pipelines and cleanup',
    category: 'Input and output',
    prerequisites: ['node.io.streams'],
  },
  {
    id: 'node.net.http-server',
    name: 'An HTTP server',
    category: 'Network',
    prerequisites: ['node.runtime.process'],
  },
  {
    id: 'node.net.http-client',
    name: 'Calling something else',
    category: 'Network',
    prerequisites: ['node.net.http-server'],
    description: 'Timeouts, retries, and the request nobody canceled.',
  },
  {
    id: 'node.net.routing',
    name: 'Routing and middleware',
    category: 'Network',
    prerequisites: ['node.net.http-server'],
  },
  {
    id: 'node.net.validation',
    name: 'Validating a request',
    category: 'Network',
    prerequisites: ['node.net.routing'],
  },
  {
    id: 'node.failure.errors',
    name: 'Errors that survive a boundary',
    category: 'Failure',
    prerequisites: ['node.runtime.process'],
  },
  {
    id: 'node.failure.async',
    name: 'Unhandled rejections and uncaught exceptions',
    category: 'Failure',
    prerequisites: ['node.failure.errors'],
  },
  {
    id: 'node.failure.shutdown',
    name: 'Shutting down without dropping work',
    category: 'Failure',
    prerequisites: ['node.failure.errors', 'node.net.http-server'],
  },
  {
    id: 'node.operations.logging',
    name: 'Logging something you can search',
    category: 'Operations',
    prerequisites: ['node.failure.errors'],
  },
  {
    id: 'node.operations.config',
    name: 'Configuration',
    category: 'Operations',
    prerequisites: ['node.runtime.process'],
  },
  {
    id: 'node.operations.testing',
    name: 'Testing something with I/O in it',
    category: 'Operations',
    prerequisites: ['node.io.files'],
  },
  {
    id: 'node.operations.performance',
    name: 'Finding what is slow',
    category: 'Operations',
    prerequisites: ['node.runtime.eventloop'],
  },
];

export const nodeSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'node',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const nodeSkillGraph: SkillGraph = SkillGraph.from(nodeSkills);
