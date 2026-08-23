// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Skill } from '@code-retrainer/core';
import { SkillGraph } from '@code-retrainer/core';

/**
 * The SQL skill graph.
 *
 * For someone who writes queries that work and cannot say why the slow one
 * is slow. About sets, joins, and reading a query plan.
 *
 * Generated once from the course design and maintained here since. The graph
 * is the spine of everything else: exercises and activities name these ids,
 * the map draws these edges, and mastery is recorded against these nodes. A
 * skill that is not here cannot be practiced, measured or displayed.
 */
const definitions: readonly Omit<Skill, 'language'>[] = [
  {
    id: 'sql.query.select',
    name: 'Selecting and filtering',
    category: 'Querying',
    prerequisites: [],
  },
  {
    id: 'sql.query.ordering',
    name: 'Ordering and limiting',
    category: 'Querying',
    prerequisites: ['sql.query.select'],
  },
  {
    id: 'sql.query.nulls',
    name: 'NULL is not a value',
    category: 'Querying',
    prerequisites: ['sql.query.select'],
    description: 'Three-valued logic, and the WHERE clause that silently drops rows.',
  },
  {
    id: 'sql.query.expressions',
    name: 'Expressions and CASE',
    category: 'Querying',
    prerequisites: ['sql.query.select'],
  },
  {
    id: 'sql.sets.joins',
    name: 'Joins',
    category: 'Sets',
    prerequisites: ['sql.query.select'],
    description: 'Inner, left, and the one that quietly multiplied your rows.',
  },
  {
    id: 'sql.sets.aggregates',
    name: 'Grouping and aggregates',
    category: 'Sets',
    prerequisites: ['sql.query.select'],
  },
  {
    id: 'sql.sets.having',
    name: 'HAVING, and where filtering belongs',
    category: 'Sets',
    prerequisites: ['sql.sets.aggregates'],
  },
  {
    id: 'sql.sets.subqueries',
    name: 'Subqueries',
    category: 'Sets',
    prerequisites: ['sql.sets.joins'],
  },
  {
    id: 'sql.sets.ctes',
    name: 'Common table expressions',
    category: 'Sets',
    prerequisites: ['sql.sets.subqueries'],
  },
  {
    id: 'sql.sets.window',
    name: 'Window functions',
    category: 'Sets',
    prerequisites: ['sql.sets.aggregates'],
    description: 'Ranking and running totals without collapsing the rows.',
  },
  {
    id: 'sql.model.keys',
    name: 'Keys and constraints',
    category: 'Modeling',
    prerequisites: ['sql.query.select'],
  },
  {
    id: 'sql.model.normalization',
    name: 'Normalization, and when to stop',
    category: 'Modeling',
    prerequisites: ['sql.model.keys'],
  },
  {
    id: 'sql.model.types',
    name: 'Types, and what the database refuses',
    category: 'Modeling',
    prerequisites: ['sql.model.keys'],
  },
  {
    id: 'sql.change.insert',
    name: 'Inserting and updating',
    category: 'Changing data',
    prerequisites: ['sql.model.keys'],
  },
  {
    id: 'sql.change.upsert',
    name: 'Upserts and conflicts',
    category: 'Changing data',
    prerequisites: ['sql.change.insert'],
  },
  {
    id: 'sql.change.transactions',
    name: 'Transactions',
    category: 'Changing data',
    prerequisites: ['sql.change.insert'],
  },
  {
    id: 'sql.change.isolation',
    name: 'Isolation, and the anomalies',
    category: 'Changing data',
    prerequisites: ['sql.change.transactions'],
    description: 'The lost update, seen happening rather than described.',
  },
  {
    id: 'sql.speed.indexes',
    name: 'Indexes',
    category: 'Performance',
    prerequisites: ['sql.speed.plans'],
  },
  {
    id: 'sql.speed.plans',
    name: 'Reading a plan',
    category: 'Performance',
    prerequisites: ['sql.sets.joins'],
    description: 'Where the time went, from the database rather than from a guess.',
  },
  {
    id: 'sql.speed.sargable',
    name: 'Queries an index can help',
    category: 'Performance',
    prerequisites: ['sql.speed.plans'],
    description: 'The function around the column that made the index useless.',
  },
];

export const sqlSkills: readonly Skill[] = definitions.map((definition) => ({
  ...definition,
  language: 'sql',
}));

/** Built once at module load, so a bad edit fails immediately rather than later. */
export const sqlSkillGraph: SkillGraph = SkillGraph.from(sqlSkills);
