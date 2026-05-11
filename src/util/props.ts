/**
 * Safe property access on `object` types.
 *
 * TypeScript's `object` type has no index signature, so accessing
 * a property by string key requires a cast to `Record<string, unknown>`.
 * This is the one genuinely unavoidable `as` pattern per the project
 * type-safety guidelines.
 *
 * All `as` casts are isolated here — consumers use only `in` narrowing.
 */

function propOf(obj: object, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

/**
 * Extract a string property from an unknown value by key.
 * Returns `undefined` if the value is not an object, the key is absent,
 * or the property is not a string.
 */
export function getString(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!(key in value)) return undefined;
  const prop = propOf(value, key);
  return typeof prop === "string" ? prop : undefined;
}

/**
 * Extract a number property from an unknown value by key.
 */
export function getNumber(value: unknown, key: string): number | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!(key in value)) return undefined;
  const prop = propOf(value, key);
  return typeof prop === "number" ? prop : undefined;
}

/**
 * Extract a boolean property from an unknown value by key.
 */
export function getBoolean(value: unknown, key: string): boolean | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!(key in value)) return undefined;
  const prop = propOf(value, key);
  return typeof prop === "boolean" ? prop : undefined;
}

/**
 * Get the length of an array property, or `undefined` if not an array.
 */
export function getArrayLength(
  value: unknown,
  key: string,
): number | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!(key in value)) return undefined;
  const prop = propOf(value, key);
  return Array.isArray(prop) ? prop.length : undefined;
}
