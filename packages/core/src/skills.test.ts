import { describe, expect, it } from 'vitest';

import type { Skill } from './skills.ts';
import { SkillGraph, SkillGraphError } from './skills.ts';

function skill(id: string, prerequisites: string[] = []): Skill {
  return { id, name: id, category: 'Test', prerequisites, language: 'test' };
}

describe('SkillGraph', () => {
  it('orders prerequisites before the skills that need them', () => {
    const graph = SkillGraph.from([skill('c', ['b']), skill('a'), skill('b', ['a'])]);

    const order = graph.topological();
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
  });

  it('refuses to build a graph with a cycle', () => {
    expect(() => SkillGraph.from([skill('a', ['b']), skill('b', ['a'])])).toThrow(SkillGraphError);
  });

  it('names the skills involved in a cycle', () => {
    expect(() =>
      SkillGraph.from([skill('a', ['c']), skill('b', ['a']), skill('c', ['b'])]),
    ).toThrow(/Cycle detected/);
  });

  it('refuses to build a graph with a dangling prerequisite', () => {
    expect(() => SkillGraph.from([skill('a', ['ghost'])])).toThrow(/unknown prerequisite "ghost"/);
  });

  it('refuses duplicate skill ids', () => {
    expect(() => SkillGraph.from([skill('a'), skill('a')])).toThrow(/Duplicate skill id/);
  });

  it('reports transitive prerequisites, prerequisites first', () => {
    const graph = SkillGraph.from([skill('a'), skill('b', ['a']), skill('c', ['b'])]);
    expect(graph.ancestors('c')).toEqual(['a', 'b']);
  });

  it('deduplicates a prerequisite reachable by two paths', () => {
    const graph = SkillGraph.from([
      skill('base'),
      skill('left', ['base']),
      skill('right', ['base']),
      skill('top', ['left', 'right']),
    ]);
    expect(graph.ancestors('top').filter((id) => id === 'base')).toHaveLength(1);
  });

  it('reports dependents', () => {
    const graph = SkillGraph.from([skill('a'), skill('b', ['a']), skill('c', ['a'])]);
    expect([...graph.dependents('a')].sort()).toEqual(['b', 'c']);
    expect(graph.dependents('b')).toEqual([]);
  });

  it('throws a helpful error for an unknown skill', () => {
    const graph = SkillGraph.from([skill('a')]);
    expect(() => graph.get('nope')).toThrow(/Unknown skill "nope"/);
  });
});
