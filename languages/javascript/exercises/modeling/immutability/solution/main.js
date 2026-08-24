// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Freezing, copying, and the depth at which both stop.
 */

export function deepFreeze(value) {
  // Object.freeze is shallow: it locks the outer object and leaves every
  // nested one writable, which is why the shallow version looks correct
  // right up until somebody edits a field one level down.
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;

  Object.freeze(value);
  for (const entry of Object.values(value)) deepFreeze(entry);
  return value;
}

export function getIn(source, keyPath) {
  let current = source;
  for (const key of keyPath) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

export function setIn(source, keyPath, value) {
  if (keyPath.length === 0) return value;

  const [key, ...rest] = keyPath;
  // Arrays have to stay arrays: spreading one into an object turns [1,2]
  // into {0:1,1:2}, which reads the same in a log and breaks every method.
  const copy = Array.isArray(source) ? [...source] : { ...source };
  const child = source === null || typeof source !== 'object' ? undefined : source[key];

  copy[key] = rest.length === 0 ? value : setIn(child ?? {}, rest, value);
  return copy;
}

export function updateIn(source, keyPath, change) {
  return setIn(source, keyPath, change(getIn(source, keyPath)));
}
