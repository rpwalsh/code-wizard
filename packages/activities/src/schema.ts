// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import type { JsonValue } from '@code-retrainer/core';
import { z } from 'zod';

import type { Activity } from './model.ts';

/**
 * The on-disk shape of an activity.
 *
 * Validated rather than trusted. Content is the part of this system most
 * likely to be wrong — it is written in bulk, by hand, in YAML — and a
 * malformed answer key does not announce itself, it just marks correct
 * answers wrong until somebody complains.
 *
 * This file checks shape only: the right fields, of the right types, within
 * the right bounds. The rules that relate one field to another — a `correct`
 * index naming an option that does not exist, a blank the template never
 * mentions — live in `checks.ts`, because a discriminated union cannot be
 * built from refined members and because those rules are worth reading as a
 * list rather than as decorations on a schema.
 */
const identifier = z
  .string()
  .min(3)
  .regex(
    /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/u,
    'must be lower-case dot/dash separated, e.g. rust.ownership.borrow.mc-1',
  );

const common = {
  id: identifier,
  language: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  /**
   * How long this is expected to take.
   *
   * A budget for planning a session, never a countdown shown to the learner.
   * Nothing in an activity is timed. Many of the people this is for are
   * between jobs and practicing under quite enough pressure already; a clock
   * running down on a multiple-choice question adds anxiety and measures
   * typing speed. Where timing genuinely belongs — a code exercise attempted
   * against the clock, deliberately, because pace under pressure is the thing
   * being trained — it is opt-in and scaled to the exercise, and it lives with
   * the exercise rather than here.
   */
  estimatedSeconds: z.number().int().min(5).max(600),
  skills: z.array(identifier).min(1),
  prompt: z.string().min(1),
  explanation: z.string().min(20, 'an explanation must explain; say why, not just what'),
};

const optionSchema = z.object({
  text: z.string().min(1),
  why: z.string().min(1).optional(),
});

const multipleChoiceSchema = z.object({
  ...common,
  kind: z.literal('multiple-choice'),
  code: z.string().min(1).optional(),
  options: z.array(optionSchema).min(2).max(6),
  correct: z.array(z.number().int().min(0)).min(1),
});

const predictOutputSchema = z.object({
  ...common,
  kind: z.literal('predict-output'),
  code: z.string().min(1),
  // An empty string is a legitimate prediction — a program that prints
  // nothing is a fine question — so this one is not `.min(1)`.
  expected: z.string(),
  alsoAccept: z.array(z.string()).optional(),
});

const orderLinesSchema = z.object({
  ...common,
  kind: z.literal('order-lines'),
  lines: z.array(z.string().min(1)).min(3).max(14),
  interchangeable: z.array(z.array(z.number().int().min(0)).min(2)).optional(),
  distractors: z.array(z.string().min(1)).optional(),
});

const blankSchema = z.object({
  index: z.number().int().min(1),
  accepts: z.array(z.string().min(1)).min(1),
  hint: z.string().min(1).optional(),
});

const fillBlanksSchema = z.object({
  ...common,
  kind: z.literal('fill-blanks'),
  template: z.string().min(1),
  blanks: z.array(blankSchema).min(1).max(8),
});

const spotTheBugSchema = z.object({
  ...common,
  kind: z.literal('spot-the-bug'),
  code: z.string().min(1),
  faultLine: z.number().int().min(1),
  correction: z.string().min(1),
});

const matchPairsSchema = z.object({
  ...common,
  kind: z.literal('match-pairs'),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(3)
    .max(8),
});

export const activitySchema = z.discriminatedUnion('kind', [
  multipleChoiceSchema,
  predictOutputSchema,
  orderLinesSchema,
  fillBlanksSchema,
  spotTheBugSchema,
  matchPairsSchema,
]);

export const activityFileSchema = z.object({
  activities: z.array(activitySchema).min(1),
});

/**
 * Parse one activity, throwing a readable error naming the field at fault.
 *
 * Takes `JsonValue` rather than an opaque type: YAML produces the same closed
 * set of shapes JSON does, so what arrives here is narrowable, and saying so
 * keeps the boundary honest instead of deferring the question to a cast.
 *
 * Shape only. Run `checkActivity` afterwards for the cross-field rules.
 */
export function parseActivity(value: JsonValue): Activity {
  return activitySchema.parse(value);
}
