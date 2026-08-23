// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Minimal terminal formatting. Deliberately dependency-free: the CLI is a
 * developer tool for validating curriculum, and it should stay installable
 * from a checkout with nothing but Node.
 */

const enabled =
  process.env.NO_COLOR === undefined &&
  process.env.FORCE_COLOR !== '0' &&
  (process.stdout.isTTY === true || process.env.FORCE_COLOR !== undefined);

function wrap(open: number, close: number): (text: string) => string {
  const ESC = '\u001b[';
  return (text) => (enabled ? `${ESC}${open}m${text}${ESC}${close}m` : text);
}

export const style = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

export const symbol = {
  pass: style.green('✓'),
  fail: style.red('✗'),
  warn: style.yellow('!'),
  skip: style.gray('-'),
  bullet: style.gray('•'),
};

export function heading(text: string): string {
  return `\n${style.bold(text)}\n${style.gray('─'.repeat(Math.max(text.length, 12)))}`;
}

/** Left-aligned two-column layout; the width is measured, not guessed. */
export function columns(rows: readonly (readonly [string, string])[], gap = 2): string {
  const width = rows.reduce((widest, [left]) => Math.max(widest, visibleLength(left)), 0);
  return rows
    .map(([left, right]) => `${left}${' '.repeat(width - visibleLength(left) + gap)}${right}`)
    .join('\n');
}

/** Length ignoring ANSI escapes, so styled text still lines up. */
export function visibleLength(text: string): number {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '').length;
}

export function indent(text: string, spaces = 2): string {
  const padding = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? padding + line : line))
    .join('\n');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds - minutes * 60)}s`;
}
