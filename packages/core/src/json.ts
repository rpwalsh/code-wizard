/**
 * A precise type for data that crossed a trust boundary.
 *
 * `JSON.parse` is declared as returning `any`, which quietly disables type
 * checking for everything downstream. Parsing to `JsonValue` instead keeps the
 * checker switched on: the shape is genuinely unknown at that point, but it is
 * unknown *within a closed set of possibilities*, so every read has to narrow
 * and the compiler can tell when one does not.
 */
export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export interface JsonObject {
  readonly [key: string]: JsonValue | undefined;
}

export class JsonParseError extends Error {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = 'JsonParseError';
  }
}

/**
 * Parse JSON text into a narrowable value.
 *
 * The single assertion in the codebase that says "this really is JSON" — and
 * it is true by construction, because `JSON.parse` cannot produce anything
 * outside `JsonValue`.
 */
export function parseJson(text: string): JsonValue {
  try {
    return JSON.parse(text) as JsonValue;
  } catch (caught) {
    throw new JsonParseError(`Not valid JSON: ${toError(caught).message}`, {
      cause: toError(caught),
    });
  }
}

// -- narrowing ------------------------------------------------------------

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue | undefined): value is JsonValue[] {
  return Array.isArray(value);
}

/** The named field as a string, or null if it is absent or another type. */
export function readString(source: JsonObject, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' ? value : null;
}

export function readNumber(source: JsonObject, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readBoolean(source: JsonObject, key: string): boolean | null {
  const value = source[key];
  return typeof value === 'boolean' ? value : null;
}

export function readArray(source: JsonObject, key: string): JsonValue[] | null {
  const value = source[key];
  return Array.isArray(value) ? value : null;
}

export function readObject(source: JsonObject, key: string): JsonObject | null {
  const value = source[key];
  return isJsonObject(value) ? value : null;
}

/**
 * Narrow a caught value to an `Error`.
 *
 * A `catch` binding is `unknown` by language rule — TypeScript offers only
 * `unknown` or `any` there, and `any` is strictly worse. This is the one place
 * that shape is allowed to exist; everywhere else works with a real `Error`.
 */
// eslint-disable-next-line no-restricted-syntax -- see the doc comment above
export function toError(caught: unknown): Error {
  if (caught instanceof Error) return caught;
  if (typeof caught === 'string') return new Error(caught);
  return new Error(String(caught));
}
