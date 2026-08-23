// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Path arithmetic through the path module — slashes never typed by hand.
 */
import path from 'node:path';

export function safeJoin(root, requested) {
  const resolvedRoot = path.resolve(root);
  // Resolve FIRST, judge the RESULT: the resolver already speaks every
  // dialect of dots and doubled separators.
  const resolved = path.resolve(resolvedRoot, requested);

  // The + sep closes the /data-evil-passes-for-/data gap.
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    return null;
  }
  return resolved;
}

export function describePath(input) {
  const parsed = path.parse(input);
  return {
    dir: parsed.dir,
    base: parsed.base,
    ext: parsed.ext,
    absolute: path.isAbsolute(input),
  };
}

export function toPosix(input) {
  return input.split(path.sep).join('/').replaceAll('\\', '/');
}

export function classifySpecifier(specifier) {
  // The resolver's own dispatch order.
  if (specifier.startsWith('node:')) return 'builtin';
  if (specifier.startsWith('./') || specifier.startsWith('../')) return 'relative';
  if (path.isAbsolute(specifier)) return 'absolute';
  return 'bare';
}
