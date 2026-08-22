import { z } from 'zod';

import { hintLevels } from './model.ts';

const identifier = z
  .string()
  .min(3)
  .regex(
    /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/,
    'must be lower-case dot/dash separated, e.g. python.collections.dict-lookup',
  );

const relativePath = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith('/') && !value.includes('..') && !/^[A-Za-z]:/.test(value), {
    message: 'must be a relative path that does not traverse upward',
  });

const testVisibility = z.enum(['visible', 'hidden', 'edge', 'performance', 'regression']);

const hintSchema = z.object({
  level: z.enum(hintLevels),
  text: z.string().min(1),
});

const testEntrySchema = z.object({
  path: relativePath,
  visibility: testVisibility,
  concept: z.string().min(1).optional(),
});

/**
 * The on-disk shape of `exercise.yaml`. Code lives in real files next to it,
 * so authors edit starter code and tests with normal tooling (spec §39).
 */
export const exerciseManifestSchema = z
  .object({
    id: identifier,
    version: z.number().int().positive(),
    language: z.string().min(1),
    title: z.string().min(1).max(120),
    kind: z.enum([
      'syntax-drill',
      'completion',
      'translation',
      'bug-fix',
      'micro-problem',
      'focused-problem',
      'stateful-problem',
      'progressive-stage',
      'project',
    ]),
    difficulty: z.number().int().min(1).max(5),
    estimatedSeconds: z
      .number()
      .int()
      .positive()
      .max(60 * 60 * 4),
    skills: z.array(z.string().min(1)).min(1),
    prerequisites: z.array(z.string().min(1)).default([]),
    learningObjectives: z.array(z.string().min(1)).min(1),
    prompt: z.string().min(1),
    entryPoint: relativePath.optional(),
    starterDir: relativePath.default('starter'),
    solutionDir: relativePath.default('solution'),
    tests: z.array(testEntrySchema).min(1),
    hints: z.array(hintSchema).default([]),
    explanation: z.string().optional(),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
    mutationExceptions: z
      .array(
        z
          .object({
            path: relativePath,
            operator: z.string().min(1),
            // Long enough that it has to be a sentence, not a shrug.
            why: z.string().min(20),
          })
          .strict(),
      )
      .optional(),
    continues: identifier.optional(),
  })
  .strict()
  .superRefine((manifest, context) => {
    const seenPaths = new Set<string>();
    for (const [index, test] of manifest.tests.entries()) {
      if (seenPaths.has(test.path)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tests', index, 'path'],
          message: `duplicate test path "${test.path}"`,
        });
      }
      seenPaths.add(test.path);
    }

    const seenLevels = new Set<string>();
    for (const [index, hint] of manifest.hints.entries()) {
      if (seenLevels.has(hint.level)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hints', index, 'level'],
          message: `duplicate hint level "${hint.level}"`,
        });
      }
      seenLevels.add(hint.level);
    }

    if (!manifest.id.startsWith(`${manifest.language}.`)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: `id must be namespaced under its language, e.g. "${manifest.language}.…"`,
      });
    }
  });

export type ExerciseManifest = z.infer<typeof exerciseManifestSchema>;
