// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Skill } from '@code-wizard/core';
import { parse } from 'yaml';
import { z } from 'zod';

/**
 * A curriculum that has been designed but cannot yet be run.
 *
 * A language needs three things: a skill graph, a course, and a runtime that
 * can execute an attempt and judge it. The first two are design work and are
 * finished when they are written. The third is an engineering project, and for
 * a compiled language it is a toolchain — which is a different order of
 * problem from a syllabus and should not be hidden behind one.
 *
 * So planned curricula live here rather than in `languages/`, entirely as
 * data, and the tooling reports them as what they are. The alternative is a
 * half-built package per language that looks like support and is not, and
 * a learner discovering the difference by clicking on it.
 */
const skillSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    prerequisites: z.array(z.string().min(1)).default([]),
    description: z.string().optional(),
  })
  .strict();

const manifestSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'expected a lowercase identifier'),
    title: z.string().min(1),
    /** One line on who this is for. Shown wherever the plan is listed. */
    summary: z.string().min(20),
    /**
     * What would have to exist for this to become runnable. Required, because
     * "not done yet" without a reason is indistinguishable from forgotten.
     */
    blockedBy: z.string().min(20),
    skills: z.array(skillSchema).min(1),
  })
  .strict();

export type PlannedManifest = z.infer<typeof manifestSchema>;

export interface PlannedCurriculum {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly blockedBy: string;
  readonly skills: readonly Skill[];
  readonly directory: string;
}

export class PlannedFormatError extends Error {
  constructor(file: string, detail: string) {
    super(`${file}: ${detail}`);
    this.name = 'PlannedFormatError';
  }
}

/** Every planned curriculum under a directory, in name order. */
export async function loadPlanned(root: string): Promise<readonly PlannedCurriculum[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }

  const found: PlannedCurriculum[] = [];

  for (const name of entries.sort()) {
    const directory = path.join(root, name);
    const manifestPath = path.join(directory, 'curriculum.yaml');

    let raw: string;
    try {
      raw = await fs.readFile(manifestPath, 'utf8');
    } catch {
      // A directory without a manifest is not a curriculum; skip it rather
      // than fail the whole listing over something that may be a stray file.
      continue;
    }

    const parsed = manifestSchema.safeParse(parse(raw));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new PlannedFormatError(
        `${name}/curriculum.yaml`,
        first ? `${first.path.join('.')}: ${first.message}` : 'invalid manifest',
      );
    }

    found.push({
      id: parsed.data.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      blockedBy: parsed.data.blockedBy,
      skills: parsed.data.skills.map((skill) => ({ ...skill, language: parsed.data.id })),
      directory,
    });
  }

  return found;
}
