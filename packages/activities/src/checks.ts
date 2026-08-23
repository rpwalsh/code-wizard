// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { Activity } from './model.ts';

/**
 * The rules a well-formed activity obeys beyond its shape.
 *
 * Every one of these describes a mistake that produces an activity which
 * loads, renders, and is silently ungradeable — an answer key pointing at an
 * option that does not exist, a gap the learner cannot fill, a matching
 * exercise with two identical right-hand sides so that one of the "wrong"
 * answers is also right. None of them would be caught by types, and all of
 * them are easy to make when writing thirty questions in one sitting.
 *
 * Returned as a list of sentences rather than thrown, so a content check can
 * report everything wrong with a file at once instead of one thing per run.
 */
export function checkActivity(activity: Activity): readonly string[] {
  const problems: string[] = [];
  const say = (message: string): void => {
    problems.push(`${activity.id}: ${message}`);
  };

  switch (activity.kind) {
    case 'multiple-choice': {
      for (const index of activity.correct) {
        if (index >= activity.options.length) {
          say(`correct names option ${index}, but there are only ${activity.options.length}`);
        }
      }
      if (new Set(activity.correct).size !== activity.correct.length) {
        say('correct lists the same option twice');
      }
      if (activity.correct.length >= activity.options.length) {
        say('every option is marked correct, so there is nothing to answer');
      }
      if (new Set(activity.options.map((option) => option.text)).size !== activity.options.length) {
        say('two options have the same text');
      }
      break;
    }

    case 'predict-output': {
      // A prediction that matches an accepted alternative exactly means the
      // author has written the same answer twice and probably meant something
      // else by one of them.
      for (const alternative of activity.alsoAccept ?? []) {
        if (alternative === activity.expected) say('alsoAccept repeats expected');
      }
      break;
    }

    case 'order-lines': {
      for (const group of activity.interchangeable ?? []) {
        for (const index of group) {
          if (index >= activity.lines.length) {
            say(`interchangeable names line ${index}, which does not exist`);
          }
        }
      }
      if (new Set(activity.lines).size !== activity.lines.length) {
        // Two identical lines make the ordering genuinely ambiguous, and the
        // grader would mark a correct arrangement wrong.
        say('two lines are identical, so more than one order is correct');
      }
      for (const distractor of activity.distractors ?? []) {
        if (activity.lines.includes(distractor)) {
          say(`'${distractor}' is both a distractor and part of the answer`);
        }
      }
      break;
    }

    case 'fill-blanks': {
      const indices = activity.blanks.map((blank) => blank.index);
      if (new Set(indices).size !== indices.length) say('two blanks share an index');
      for (const blank of activity.blanks) {
        if (!activity.template.includes(`{${blank.index}}`)) {
          say(`blank ${blank.index} is never referenced by the template`);
        }
        if (new Set(blank.accepts).size !== blank.accepts.length) {
          say(`blank ${blank.index} accepts the same answer twice`);
        }
      }
      for (const marker of activity.template.matchAll(/\{(\d+)\}/gu)) {
        const index = Number(marker[1]);
        if (!indices.includes(index)) say(`the template has a gap {${index}} with no blank for it`);
      }
      break;
    }

    case 'spot-the-bug': {
      const lines = activity.code.split('\n');
      if (activity.faultLine > lines.length) {
        say(`faultLine ${activity.faultLine} is past the end of ${lines.length} lines`);
      }
      const faulty = lines[activity.faultLine - 1];
      if (faulty !== undefined && faulty.trim() === '') {
        say(`faultLine ${activity.faultLine} is blank`);
      }
      if (faulty !== undefined && faulty.trim() === activity.correction.trim()) {
        say('the correction is identical to the line it corrects');
      }
      break;
    }

    case 'match-pairs': {
      if (new Set(activity.pairs.map((pair) => pair.right)).size !== activity.pairs.length) {
        say('two pairs share a right-hand side, so more than one matching is correct');
      }
      if (new Set(activity.pairs.map((pair) => pair.left)).size !== activity.pairs.length) {
        say('two pairs share a left-hand side');
      }
      break;
    }
  }

  return problems;
}

/** Every problem across a set, for a whole-file or whole-language report. */
export function checkActivities(activities: readonly Activity[]): readonly string[] {
  return activities.flatMap(checkActivity);
}
