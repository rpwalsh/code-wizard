// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The Angular skill graph.
 *
 * For someone who knows TypeScript and needs the framework's model rather
 * than its vocabulary. About dependency injection, change detection and
 * reactive data flow.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'angular.components.template',
    name: 'Components and templates',
    category: 'Components',
    prerequisites: [],
  },
  {
    id: 'angular.components.binding',
    name: 'Binding, both ways',
    category: 'Components',
    prerequisites: ['angular.components.template'],
  },
  {
    id: 'angular.components.inputs',
    name: 'Inputs and outputs',
    category: 'Components',
    prerequisites: ['angular.components.binding'],
  },
  {
    id: 'angular.components.lifecycle',
    name: 'Lifecycle',
    category: 'Components',
    prerequisites: ['angular.components.inputs'],
  },
  {
    id: 'angular.components.content',
    name: 'Content projection',
    category: 'Components',
    prerequisites: ['angular.components.template'],
  },
  {
    id: 'angular.di.providers',
    name: 'Dependency injection',
    category: 'Injection',
    prerequisites: [],
    description: 'What is actually being solved, before any syntax.',
  },
  {
    id: 'angular.di.scope',
    name: 'Injector scope',
    category: 'Injection',
    prerequisites: ['angular.di.providers'],
    description: 'Root, component, and the service that turned out to be shared.',
  },
  {
    id: 'angular.di.tokens',
    name: 'Tokens and multi-providers',
    category: 'Injection',
    prerequisites: ['angular.di.scope'],
  },
  {
    id: 'angular.change.detection',
    name: 'Change detection',
    category: 'Change detection',
    prerequisites: ['angular.components.binding'],
    description: 'What triggers it, and how often it actually runs.',
  },
  {
    id: 'angular.change.onpush',
    name: 'OnPush',
    category: 'Change detection',
    prerequisites: ['angular.change.detection'],
  },
  {
    id: 'angular.change.signals',
    name: 'Signals',
    category: 'Change detection',
    prerequisites: ['angular.change.detection'],
  },
  {
    id: 'angular.reactive.observables',
    name: 'Observables',
    category: 'Reactive',
    prerequisites: [],
  },
  {
    id: 'angular.reactive.operators',
    name: 'Operators',
    category: 'Reactive',
    prerequisites: ['angular.reactive.observables'],
    description: 'map, switchMap, and the difference that causes the bug.',
  },
  {
    id: 'angular.reactive.subscriptions',
    name: 'Subscriptions and teardown',
    category: 'Reactive',
    prerequisites: ['angular.reactive.observables'],
  },
  {
    id: 'angular.reactive.state',
    name: 'State without a store',
    category: 'Reactive',
    prerequisites: ['angular.reactive.operators'],
  },
  {
    id: 'angular.forms.reactive',
    name: 'Reactive forms',
    category: 'Forms',
    prerequisites: ['angular.reactive.observables'],
  },
  {
    id: 'angular.forms.validation',
    name: 'Validators',
    category: 'Forms',
    prerequisites: ['angular.forms.reactive'],
  },
  {
    id: 'angular.routing.routes',
    name: 'Routing',
    category: 'Routing',
    prerequisites: ['angular.components.template'],
  },
  {
    id: 'angular.routing.guards',
    name: 'Guards and resolvers',
    category: 'Routing',
    prerequisites: ['angular.routing.routes', 'angular.di.providers'],
  },
  {
    id: 'angular.http.client',
    name: 'Talking to a server',
    category: 'HTTP',
    prerequisites: ['angular.reactive.operators', 'angular.di.providers'],
  },
  {
    id: 'angular.http.interceptors',
    name: 'Interceptors',
    category: 'HTTP',
    prerequisites: ['angular.http.client'],
  },
  {
    id: 'angular.testing.harness',
    name: 'Testing a component',
    category: 'Testing',
    prerequisites: ['angular.components.lifecycle', 'angular.di.scope'],
  },
];

export const angularSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'angular',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const angularSkillGraph: SkillGraph = SkillGraph.from(angularSkills);
