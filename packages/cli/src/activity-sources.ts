// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Activity } from '@code-retrainer/activities';
import { loadActivitiesForLanguage } from '@code-retrainer/activities';
import type { Skill } from '@code-retrainer/core';
import { loadPlanned } from '@code-retrainer/exercises';

import { buildSkillGraph, curriculumRoots, plannedRoot, repositoryRoot } from './context.ts';

/**
 * Every set of activities in the product, wherever it lives.
 *
 * There are two homes and the split is meaningful. A course under
 * `languages/` has a runtime behind it and can be practiced both ways —
 * activities *and* exercises. A course under `curricula/` has no runtime, so
 * activities are the only way to practice it at all.
 *
 * Both are collected here so that nothing downstream has to know the
 * difference. The bundle ships both, the checker checks both, and the practice
 * screen offers both — which is the point: a learner should not have to
 * understand the repository layout to find something to do.
 *
 * The alternative — walking one root and forgetting the other — is exactly the
 * bug this file was written to fix, and it cost sixty-three activities.
 */
export interface ActivitySet {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  /** True when this course also has runnable exercises behind it. */
  readonly runnable: boolean;
  readonly skills: readonly {
    readonly id: string;
    readonly name: string;
    readonly category: string;
  }[];
  readonly activities: readonly Activity[];
}

interface LanguageManifest {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

export async function collectActivitySets(): Promise<readonly ActivitySet[]> {
  const graph = buildSkillGraph();
  const sets: ActivitySet[] = [];

  // Languages: a runtime exists, so activities sit alongside exercises.
  for (const language of Object.keys(curriculumRoots())) {
    const root = path.join(repositoryRoot, 'languages', language);
    const activities = await loadActivitiesForLanguage(root);
    if (activities.length === 0) continue;

    const manifest = await readManifest(root, language);
    sets.push({
      id: language,
      title: manifest.title,
      summary: manifest.summary,
      runnable: true,
      skills: graph
        .all()
        .filter((skill: Skill) => skill.language === language)
        .map((skill: Skill) => ({ id: skill.id, name: skill.name, category: skill.category })),
      activities,
    });
  }

  // Planned curricula: no runtime, so activities are the whole offering.
  for (const curriculum of await loadPlanned(plannedRoot)) {
    const activities = await loadActivitiesForLanguage(curriculum.directory);
    if (activities.length === 0) continue;

    sets.push({
      id: curriculum.id,
      title: curriculum.title,
      summary: curriculum.summary,
      runnable: false,
      skills: curriculum.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
      })),
      activities,
    });
  }

  return sets.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * A language's own name for itself.
 *
 * Written by the migration and maintained by hand since. Falls back to a
 * capitalized directory name rather than throwing: a language whose manifest
 * is missing should still be usable for practice. The fallback must be a
 * *valid* course card, though — the web app validates the bundle, and an
 * empty summary once took the whole Practice view down, which is a far
 * bigger problem than a generic sentence.
 */
async function readManifest(root: string, language: string): Promise<LanguageManifest> {
  const fallbackTitle = language.charAt(0).toUpperCase() + language.slice(1);
  const fallbackSummary = `Practice for the ${fallbackTitle} course.`;
  try {
    const raw = await fs.readFile(path.join(root, 'language.json'), 'utf8');
    const parsed = JSON.parse(raw) as Partial<LanguageManifest>;
    return {
      id: parsed.id ?? language,
      title: parsed.title ?? fallbackTitle,
      summary: parsed.summary && parsed.summary.trim() !== '' ? parsed.summary : fallbackSummary,
    };
  } catch {
    return { id: language, title: fallbackTitle, summary: fallbackSummary };
  }
}
