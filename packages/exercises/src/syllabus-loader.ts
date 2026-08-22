import fs from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';
import { z } from 'zod';

/**
 * Reading the planned course off disk.
 *
 * Lives beside the exercise loader rather than in the curriculum engine for
 * the same reason that one does: the engine stays a pure function of data it
 * is handed, so it can run in a browser that has no filesystem.
 */
const lessonSchema = z
  .object({
    id: z.string().regex(/^[a-z]{1,4}\.\d{3}$/, 'expected an id like py.001'),
    title: z.string().min(1),
    focus: z.string().min(1),
    skills: z.array(z.string().min(1)).min(1),
    difficulty: z.number().int().min(1).max(5),
  })
  .strict();

const stageSchema = z
  .object({
    stage: z.string().min(1),
    title: z.string().min(1),
    lessons: z.array(lessonSchema).min(1),
  })
  .strict();

export class SyllabusFormatError extends Error {
  constructor(file: string, detail: string) {
    super(`${file}: ${detail}`);
    this.name = 'SyllabusFormatError';
  }
}

export interface LoadedStage {
  readonly stage: string;
  readonly title: string;
  readonly lessons: readonly z.infer<typeof lessonSchema>[];
}

/**
 * Every stage file in a directory, in filename order.
 *
 * Filename order is course order, which is why the files are numbered. Sorting
 * by anything read from inside the files would let a stage silently move.
 */
export async function loadSyllabus(directory: string): Promise<{ stages: readonly LoadedStage[] }> {
  let entries: string[];
  try {
    entries = await fs.readdir(directory);
  } catch {
    return { stages: [] };
  }

  // Numbered files only. The number is the course order, and it also keeps
  // anything else in the directory — a manifest, a note — from being read as
  // a stage and failing the whole load.
  const files = entries.filter((name) => /^\d{2}-.+\.yaml$/.test(name)).sort();
  const stages: LoadedStage[] = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(directory, file), 'utf8');
    const parsed = stageSchema.safeParse(parse(raw));

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new SyllabusFormatError(
        file,
        first ? `${first.path.join('.')}: ${first.message}` : 'invalid stage file',
      );
    }

    stages.push(parsed.data);
  }

  return { stages };
}
