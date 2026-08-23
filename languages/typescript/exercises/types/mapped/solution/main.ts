// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The utility types, rebuilt: mapped, conditional, and remapped keys.
 */

// A mapped type is a for-loop over keys; ? is the modifier being added.
export type Mine<T> = { [K in keyof T]?: T[K] };

export type Locked<T> = { readonly [K in keyof T]: T[K] };

// Map over K itself, not keyof T — that is the whole difference.
export type Chosen<T, K extends keyof T> = { [P in K]: T[P] };

// Conditional + infer: destructuring for types.
export type Unwrapped<T> = T extends Promise<infer Inner> ? Inner : T;

// Key remapping: a template literal run over every key name, at compile time.
export type Setters<T> = {
  [K in keyof T & string as `set${Capitalize<K>}`]: (value: T[K]) => void;
};

export function pickFields<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Chosen<T, K> {
  const chosen = {} as Chosen<T, K>;
  for (const key of keys) {
    chosen[key] = source[key];
  }
  return chosen;
}

export function makeSetters<T extends Record<string, string | number | boolean>>(
  target: T,
): Setters<T> {
  const setters = {} as Record<string, (value: T[keyof T]) => void>;
  for (const key of Object.keys(target)) {
    const name = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    setters[name] = (value) => {
      (target as Record<string, string | number | boolean>)[key] = value;
    };
  }
  return setters as Setters<T>;
}
