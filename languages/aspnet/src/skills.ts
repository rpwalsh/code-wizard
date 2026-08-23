// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The ASP.NET skill graph.
 *
 * For someone building services on .NET who wants the pipeline rather than
 * the scaffolding. About middleware, model binding, and the parts of a
 * request that fail under load.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'aspnet.pipeline.middleware',
    name: 'The middleware pipeline',
    category: 'Pipeline',
    prerequisites: [],
    description: 'Order matters, and the one that did not call next.',
  },
  {
    id: 'aspnet.pipeline.routing',
    name: 'Routing',
    category: 'Pipeline',
    prerequisites: ['aspnet.pipeline.middleware'],
  },
  {
    id: 'aspnet.pipeline.binding',
    name: 'Model binding',
    category: 'Pipeline',
    prerequisites: ['aspnet.pipeline.routing'],
  },
  {
    id: 'aspnet.pipeline.validation',
    name: 'Validation',
    category: 'Pipeline',
    prerequisites: ['aspnet.pipeline.binding'],
  },
  {
    id: 'aspnet.pipeline.results',
    name: 'Results and status codes',
    category: 'Pipeline',
    prerequisites: ['aspnet.pipeline.routing'],
  },
  {
    id: 'aspnet.di.lifetimes',
    name: 'Service lifetimes',
    category: 'Injection',
    prerequisites: [],
    description: 'Singleton, scoped, transient — and the captive dependency.',
  },
  {
    id: 'aspnet.di.options',
    name: 'Configuration and options',
    category: 'Injection',
    prerequisites: ['aspnet.di.lifetimes'],
  },
  {
    id: 'aspnet.data.context',
    name: 'A database context, scoped correctly',
    category: 'Data',
    prerequisites: ['aspnet.di.lifetimes'],
  },
  {
    id: 'aspnet.data.queries',
    name: 'Queries that translate',
    category: 'Data',
    prerequisites: ['aspnet.data.context'],
    description: 'The LINQ that ran in memory instead of in the database.',
  },
  {
    id: 'aspnet.data.tracking',
    name: 'Tracking, and turning it off',
    category: 'Data',
    prerequisites: ['aspnet.data.queries'],
  },
  {
    id: 'aspnet.data.migrations',
    name: 'Schema changes',
    category: 'Data',
    prerequisites: ['aspnet.data.context'],
  },
  {
    id: 'aspnet.security.authn',
    name: 'Authentication',
    category: 'Security',
    prerequisites: ['aspnet.pipeline.middleware'],
  },
  {
    id: 'aspnet.security.authz',
    name: 'Authorization',
    category: 'Security',
    prerequisites: ['aspnet.security.authn'],
  },
  {
    id: 'aspnet.security.headers',
    name: 'Headers, CORS and forgery',
    category: 'Security',
    prerequisites: ['aspnet.pipeline.middleware'],
  },
  {
    id: 'aspnet.operations.logging',
    name: 'Structured logging',
    category: 'Operations',
    prerequisites: ['aspnet.di.lifetimes'],
  },
  {
    id: 'aspnet.operations.health',
    name: 'Health and readiness',
    category: 'Operations',
    prerequisites: ['aspnet.pipeline.middleware'],
  },
  {
    id: 'aspnet.operations.errors',
    name: 'One error boundary',
    category: 'Operations',
    prerequisites: ['aspnet.pipeline.middleware'],
  },
  {
    id: 'aspnet.operations.testing',
    name: 'Testing against a real host',
    category: 'Operations',
    prerequisites: ['aspnet.pipeline.routing'],
  },
];

export const aspnetSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'aspnet',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const aspnetSkillGraph: SkillGraph = SkillGraph.from(aspnetSkills);
