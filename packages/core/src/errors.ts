/**
 * Two independent taxonomies (spec §22). The mechanical one is derived from
 * runtime output; the skill one is authored on the exercise. They must not be
 * collapsed into a single enum — a `KeyError` does not by itself tell you
 * which skill is weak.
 */
export type MechanicalFailure =
  | 'SyntaxError'
  | 'NameError'
  | 'TypeError'
  | 'ValueError'
  | 'KeyError'
  | 'IndexError'
  | 'AttributeError'
  | 'ImportError'
  | 'AssertionFailure'
  | 'Timeout'
  | 'IncorrectOutput'
  | 'PerformanceFailure'
  | 'Unknown';

export interface FailureClassification {
  readonly mechanical: MechanicalFailure;
  /** Skill ids the failing tests were tagged with. */
  readonly skills: readonly string[];
  /** Verbatim first line of the underlying error, for display. */
  readonly detail?: string;
}

const EXCEPTION_PATTERN = /^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Warning))\b:?\s*(.*)$/;

const KNOWN: ReadonlySet<string> = new Set<MechanicalFailure>([
  'SyntaxError',
  'NameError',
  'TypeError',
  'ValueError',
  'KeyError',
  'IndexError',
  'AttributeError',
  'ImportError',
]);

/**
 * Best-effort, deterministic classification. Returns `Unknown` rather than
 * guessing: an incorrect classification is worse than an absent one.
 */
export function classifyFailure(text: string): { kind: MechanicalFailure; detail?: string } {
  const lines = text.split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim();
    if (!line) continue;
    const match = EXCEPTION_PATTERN.exec(line);
    if (!match) continue;
    const [, name, message] = match;
    if (name && KNOWN.has(name)) {
      return { kind: name as MechanicalFailure, ...(message ? { detail: message } : {}) };
    }
    if (name === 'AssertionError') {
      return { kind: 'AssertionFailure', ...(message ? { detail: message } : {}) };
    }
  }
  return { kind: 'Unknown' };
}
