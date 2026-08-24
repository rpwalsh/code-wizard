// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkActivities, loadActivitiesForLanguage } from '@code-wizard/activities';
import type { Activity } from '@code-wizard/activities';
import { loadPlanned } from '@code-wizard/exercises';
import { describe, expect, it } from 'vitest';
import { readdir } from 'node:fs/promises';

/**
 * The activity content, held to the same standard as everything else.
 *
 * Activities are the part of this system that a language can have without a
 * runtime, which makes them the part most likely to be written in bulk on a
 * quiet afternoon and never looked at again. A wrong answer key is invisible:
 * the activity loads, renders, and silently marks correct answers wrong, and
 * the only symptom is a learner who concludes they misunderstood something
 * they had right.
 *
 * So the content is checked structurally here, in CI, rather than trusted.
 */
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const curricula = await loadPlanned(path.join(repository, 'curricula'));

/**
 * Activities live in two places and both are checked.
 *
 * `languages/` holds courses with a runtime; `curricula/` holds those without.
 * An earlier version of this file walked only the second, and when twelve
 * courses moved from one to the other it went on passing while sixty-three
 * activities stopped being checked and stopped being shipped. Walking both is
 * the fix, and the count assertion below is what would have caught it.
 */
const languagesDir = path.join(repository, 'languages');
const languages = (await readdir(languagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ id: entry.name, directory: path.join(languagesDir, entry.name) }));

const loaded = await Promise.all(
  [
    ...curricula.map((curriculum) => ({
      id: curriculum.id,
      directory: curriculum.directory,
      skills: curriculum.skills,
      planned: true,
    })),
    ...languages.map((language) => ({
      id: language.id,
      directory: language.directory,
      skills: [] as readonly { id: string }[],
      planned: false,
    })),
  ].map(async (curriculum) => ({
    curriculum,
    activities: await loadActivitiesForLanguage(curriculum.directory),
  })),
);

const withActivities = loaded.filter((entry) => entry.activities.length > 0);
const everyActivity: readonly Activity[] = loaded.flatMap((entry) => entry.activities);

describe('activity content', () => {
  it('exists for every planned curriculum', () => {
    // The whole argument for activities is that a course does not need a
    // runtime to be taught. A planned curriculum with none is a subject nobody
    // can practice at all, which is the state this was built to end.
    const empty = loaded.filter(
      (entry) => entry.curriculum.planned && entry.activities.length === 0,
    );
    expect(empty.map((entry) => entry.curriculum.id)).toEqual([]);
  });

  it('covers every language that ships a course', () => {
    // Twelve languages moved out of `curricula/` when they gained runtimes. If
    // a move ever drops their activities on the floor again, this is the line
    // that says so — the previous version of this file silently went from
    // checking eighty-one to checking eighteen.
    const covered = loaded.filter(
      (entry) => !entry.curriculum.planned && entry.activities.length > 0,
    );
    expect(covered.length).toBeGreaterThanOrEqual(12);
  });

  it('checks every activity in the repository', () => {
    // A blunt total. Any drop means a whole course stopped being checked.
    expect(everyActivity.length).toBeGreaterThanOrEqual(81);
  });

  it('passes every cross-field rule', () => {
    for (const { curriculum, activities } of withActivities) {
      expect(checkActivities(activities), curriculum.id).toEqual([]);
    }
  });

  it('names only skills the curriculum actually declares', () => {
    // An activity attached to a skill that does not exist awards mastery to
    // nothing, and nothing anywhere reports it. Only checkable for planned
    // curricula here; the languages' own skill graphs are asserted against
    // their activities in `languages.test.ts`, where the graph is importable.
    for (const { curriculum, activities } of withActivities) {
      if (!curriculum.planned) continue;
      const declared = new Set(curriculum.skills.map((skill) => skill.id));
      const unknown = activities
        .flatMap((activity) => activity.skills)
        .filter((skill) => !declared.has(skill));
      expect([...new Set(unknown)], curriculum.id).toEqual([]);
    }
  });

  it('declares the language it is filed under', () => {
    for (const { curriculum, activities } of withActivities) {
      for (const activity of activities) {
        expect(activity.language, activity.id).toBe(curriculum.id);
      }
    }
  });

  it('gives every activity a unique id across the whole product', () => {
    const seen = new Map<string, number>();
    for (const activity of everyActivity) {
      seen.set(activity.id, (seen.get(activity.id) ?? 0) + 1);
    }
    expect([...seen.entries()].filter(([, count]) => count > 1)).toEqual([]);
  });

  it('explains itself rather than only marking', () => {
    // The moment after answering is the only moment the learner is certain to
    // be paying attention. An activity that spends it saying "incorrect" has
    // wasted the entire interaction.
    for (const activity of everyActivity) {
      expect(activity.explanation.length, activity.id).toBeGreaterThan(60);
    }
  });

  it('gives multiple-choice distractors a reason', () => {
    // The three wrong options are where the teaching is. A plausible wrong
    // answer with no explanation of why it is tempting is just a filter.
    for (const activity of everyActivity) {
      if (activity.kind !== 'multiple-choice') continue;
      const wrong = activity.options.filter((_, index) => !activity.correct.includes(index));
      const unexplained = wrong.filter((option) => option.why === undefined);
      expect(
        unexplained.map((option) => option.text),
        activity.id,
      ).toEqual([]);
    }
  });

  it('covers more than one kind per language', () => {
    // Six kinds exist because they measure different things. A language whose
    // content is thirty multiple-choice questions measures recognition and
    // reports it as progress.
    for (const { curriculum, activities } of withActivities) {
      const kinds = new Set(activities.map((activity) => activity.kind));
      expect(kinds.size, curriculum.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('is answerable by reading, with no runtime anywhere', () => {
    // The load-bearing property. If any activity kind needed to execute
    // something, the languages without a runtime could not use it, and the
    // reason this package exists would be gone.
    for (const activity of everyActivity) {
      expect(activity.kind, activity.id).not.toBe('run-code');
    }
  });
});
