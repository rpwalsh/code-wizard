/**
 * A workspace is the set of files an exercise attempt operates on. It is
 * language-neutral: the learning engine describes files, and a language
 * runtime decides what to do with them.
 */
export interface WorkspaceFile {
  /** POSIX-style path relative to the workspace root. Never absolute, never `..`. */
  readonly path: string;
  readonly contents: string;
  /**
   * Files the learner may not edit (test harnesses, fixtures, generated
   * scaffolding). Enforced by the UI, not by the filesystem.
   */
  readonly readOnly?: boolean;
  /** Hidden files are materialised on disk but never shown to the learner. */
  readonly hidden?: boolean;
}

export interface Workspace {
  readonly files: readonly WorkspaceFile[];
  /** Entry point relative path, when the exercise has a single obvious one. */
  readonly entryPoint?: string;
}

export const emptyWorkspace: Workspace = Object.freeze({ files: Object.freeze([]) });
