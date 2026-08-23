// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { buildRegistry, buildSkillGraph, curriculumRoots } from '@code-retrainer/cli/context';
import { loadActivitiesForLanguage } from '@code-retrainer/activities';
import { loadSyllabus } from '@code-retrainer/exercises';
import { validateSyllabus } from '@code-retrainer/curriculum';
import { SkillGraph } from '@code-retrainer/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Every language, held to the same contract.
 *
 * The `LanguageRuntime` interface is the one boundary in this system, and its
 * value is entirely in being honored identically by every implementation. A
 * runtime that reports readiness differently, or names its skills differently,
 * or ships a course that references skills it does not define, is a place
 * where the engine above the boundary would have to know which language it is
 * talking to — and the moment that happens, the abstraction has stopped paying
 * for itself.
 *
 * None of these tests execute learner code. Ten of the fourteen need a
 * toolchain that will not be present in CI, and a suite that fails because Go
 * is not installed is a suite people learn to ignore. What is asserted here is
 * everything that must hold *regardless* of what is installed; the runtimes
 * that can actually run are exercised in their own packages.
 */
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = buildRegistry();
const languages = registry.languages();
const graph = buildSkillGraph();

describe('every registered language', () => {
  it('is registered exactly once, with a stable id', () => {
    const ids = languages.map((language) => language.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });

  it('describes itself completely', () => {
    for (const language of languages) {
      expect(language.displayName.length, language.id).toBeGreaterThan(0);
      expect(language.editorLanguage.length, language.id).toBeGreaterThan(0);
      // A leading dot, because every path join in the product assumes it.
      expect(language.fileExtension, language.id).toMatch(/^\./u);
      expect(language.commentPrefix.length, language.id).toBeGreaterThan(0);
    }
  });

  it('answers doctor without throwing, whatever is installed', async () => {
    // The load-bearing property of `doctor`: it is the thing a learner runs
    // when something is wrong, so it must never be the thing that breaks.
    for (const language of languages) {
      const runtime = registry.get(language.id);
      const diagnosis = await runtime.doctor();

      expect(diagnosis.language, language.id).toBe(language.id);
      expect(diagnosis.checks.length, language.id).toBeGreaterThan(0);
      // `ready` must agree with the checks rather than be asserted separately.
      expect(diagnosis.ready, language.id).toBe(
        diagnosis.checks.every((check) => check.status !== 'fail'),
      );
    }
  }, 240_000);

  it('tells you what to install when it cannot run', async () => {
    // The difference between a product and a demo. A failing check with no
    // remedy is a dead end on somebody else's machine.
    for (const language of languages) {
      const diagnosis = await registry.get(language.id).doctor();
      for (const check of diagnosis.checks) {
        if (check.status !== 'fail') continue;
        expect(check.remedy ?? '', `${language.id}/${check.id}`).not.toBe('');
      }
    }
  }, 240_000);

  it('implements every method the contract requires', () => {
    for (const language of languages) {
      const runtime = registry.get(language.id);
      expect(typeof runtime.execute, language.id).toBe('function');
      expect(typeof runtime.test, language.id).toBe('function');
      expect(typeof runtime.format, language.id).toBe('function');
      expect(typeof runtime.lint, language.id).toBe('function');
      expect(typeof runtime.diagnose, language.id).toBe('function');
    }
  });

  it('advertises tracing only if it can trace', () => {
    // An instrument that answers no question is worse than no instrument.
    for (const language of languages) {
      const runtime = registry.get(language.id);
      if (language.tracing === true) expect(typeof runtime.trace, language.id).toBe('function');
    }
  });
});

describe('every language course', () => {
  const roots = curriculumRoots();

  it('has a skill graph that is acyclic and complete', () => {
    // `buildSkillGraph` already threw if it were not, so this is a statement
    // that the union across fourteen languages is still one valid graph.
    expect(graph.size).toBeGreaterThan(300);
  });

  it('namespaces every skill under its own language', () => {
    for (const skill of graph.all()) {
      if (skill.language === null) continue;
      expect(skill.id, skill.id).toMatch(new RegExp(`^${skill.language}\\.`, 'u'));
    }
  });

  it('teaches only skills that exist, in a sane order', async () => {
    for (const [language, directory] of Object.entries(roots)) {
      const syllabus = await loadSyllabus(directory);
      const own = SkillGraph.from(graph.all().filter((skill) => skill.language === language));
      expect(validateSyllabus(syllabus, own), language).toEqual([]);
    }
  });

  it('numbers its lessons contiguously from one', async () => {
    for (const [language, directory] of Object.entries(roots)) {
      const syllabus = await loadSyllabus(directory);
      const ids = syllabus.stages.flatMap((stage) => stage.lessons).map((lesson) => lesson.id);
      const prefix = ids[0]?.split('.')[0];

      expect(prefix, language).toBeTruthy();
      ids.forEach((id, index) => {
        expect(id, language).toBe(`${prefix}.${String(index + 1).padStart(3, '0')}`);
      });
    }
  });

  it('ships activities that name skills the language actually declares', async () => {
    // The check that could not live in `activities.test.ts`, because only here
    // is the language's own skill graph importable.
    for (const language of Object.keys(roots)) {
      const activities = await loadActivitiesForLanguage(
        path.join(repository, 'languages', language),
      );
      if (activities.length === 0) continue;

      const declared = new Set(
        graph
          .all()
          .filter((skill) => skill.language === language)
          .map((skill) => skill.id),
      );
      const unknown = activities
        .flatMap((activity) => activity.skills)
        .filter((skill) => !declared.has(skill));

      expect([...new Set(unknown)], language).toEqual([]);
    }
  });
});
