// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-wizard/core';
import { SkillGraph } from '@code-wizard/core';

/**
 * The React skill graph.
 *
 * For someone who can already write JavaScript and keeps being surprised
 * by when a component runs. About rendering as a function of state, and
 * about the escape hatches you should almost never need.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'react.render.components',
    name: 'Components and props',
    category: 'Rendering',
    prerequisites: [],
    description: 'A function of its inputs, and what that rules out.',
  },
  {
    id: 'react.render.jsx',
    name: 'JSX, and what it compiles to',
    category: 'Rendering',
    prerequisites: ['react.render.components'],
  },
  {
    id: 'react.render.lists',
    name: 'Lists and keys',
    category: 'Rendering',
    prerequisites: ['react.render.jsx'],
    description: 'Why the index is the wrong key, shown by a bug rather than a rule.',
  },
  {
    id: 'react.render.conditional',
    name: 'Conditional rendering',
    category: 'Rendering',
    prerequisites: ['react.render.jsx'],
  },
  {
    id: 'react.state.usestate',
    name: 'State',
    category: 'State',
    prerequisites: ['react.render.components'],
  },
  {
    id: 'react.state.updates',
    name: 'Updates are not immediate',
    category: 'State',
    prerequisites: ['react.state.usestate'],
    description: 'Batching, the stale value, and the updater function.',
  },
  {
    id: 'react.state.derived',
    name: 'Derived state, and not storing it',
    category: 'State',
    prerequisites: ['react.state.usestate'],
  },
  {
    id: 'react.state.lifting',
    name: 'Lifting state up',
    category: 'State',
    prerequisites: ['react.state.usestate'],
  },
  {
    id: 'react.state.reducer',
    name: 'Reducers',
    category: 'State',
    prerequisites: ['react.state.updates'],
    description: 'When several fields have to change together and stay consistent.',
  },
  {
    id: 'react.state.immutability',
    name: 'Updating without mutating',
    category: 'State',
    prerequisites: ['react.state.updates'],
  },
  {
    id: 'react.effects.useeffect',
    name: 'Effects',
    category: 'Effects',
    prerequisites: ['react.state.usestate'],
    description: 'What an effect is for, and the far longer list of what it is not.',
  },
  {
    id: 'react.effects.dependencies',
    name: 'The dependency array',
    category: 'Effects',
    prerequisites: ['react.effects.useeffect'],
  },
  {
    id: 'react.effects.cleanup',
    name: 'Cleanup',
    category: 'Effects',
    prerequisites: ['react.effects.useeffect'],
    description: 'The subscription nobody removed, and the request that resolved after unmount.',
  },
  {
    id: 'react.effects.fetching',
    name: 'Fetching, and the race',
    category: 'Effects',
    prerequisites: ['react.effects.cleanup'],
  },
  {
    id: 'react.hooks.rules',
    name: 'The rules, and why they exist',
    category: 'Hooks',
    prerequisites: ['react.state.usestate'],
  },
  {
    id: 'react.hooks.custom',
    name: 'Custom hooks',
    category: 'Hooks',
    prerequisites: ['react.hooks.rules', 'react.effects.useeffect'],
  },
  {
    id: 'react.hooks.memo',
    name: 'memo, useMemo, useCallback',
    category: 'Hooks',
    prerequisites: ['react.hooks.rules'],
    description: 'What they cost, and the far smaller set of cases where they pay.',
  },
  {
    id: 'react.hooks.ref',
    name: 'Refs',
    category: 'Hooks',
    prerequisites: ['react.hooks.rules'],
    description: 'The escape hatch, and the two legitimate reasons to reach for it.',
  },
  {
    id: 'react.structure.context',
    name: 'Context',
    category: 'Structure',
    prerequisites: ['react.state.lifting'],
  },
  {
    id: 'react.structure.composition',
    name: 'Composition over configuration',
    category: 'Structure',
    prerequisites: ['react.render.components'],
    description: 'Children and slots, instead of a component with fourteen boolean props.',
  },
  {
    id: 'react.structure.forms',
    name: 'Forms',
    category: 'Structure',
    prerequisites: ['react.state.updates'],
    description: 'Controlled, uncontrolled, and validation that does not fight the user.',
  },
  {
    id: 'react.structure.errors',
    name: 'Error boundaries and fallbacks',
    category: 'Structure',
    prerequisites: ['react.render.conditional'],
  },
  {
    id: 'react.testing.behavior',
    name: 'Testing behavior, not implementation',
    category: 'Testing',
    prerequisites: ['react.render.components'],
  },
  {
    id: 'react.testing.async',
    name: 'Testing something that loads',
    category: 'Testing',
    prerequisites: ['react.testing.behavior', 'react.effects.fetching'],
  },
];

export const reactSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'react',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const reactSkillGraph: SkillGraph = SkillGraph.from(reactSkills);
