/**
 * GraphQL plumbing shared by the object-archival module
 * (PLAN_OBJECT_ARCHIVAL).
 *
 * The archival logic runs from three places with three different transports:
 *   1. the unified actions (`context.fetch` + the caller's JWT),
 *   2. the hourly timegrama cron (`SendToAdmin` + ADMINMONTHER),
 *   3. the single-member fast path inside the propose action.
 * They agree on one thing only: "give me a GraphQL string, get JSON back".
 * So the module speaks raw strings through an injected `Exec`, and each call
 * site supplies its own adapter — no duplicated maturation logic.
 */

/** Runs one GraphQL document and returns the parsed `{ data, errors }`. */
export type Exec = (query: string) => Promise<any>;

/** Quote a value as a GraphQL string literal (handles quotes/newlines). */
export function gqlStr(value: unknown): string {
  return JSON.stringify(String(value ?? ''));
}

/** `field: "value"` — or nothing at all when the value is null/undefined. */
export function strField(name: string, value: unknown): string | null {
  if (value == null || value === '') return null;
  return `${name}: ${gqlStr(value)}`;
}

/** `field: 12.5` — or nothing when the value is null or not a number. */
export function numField(name: string, value: unknown): string | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${name}: ${n}`;
}

/**
 * `field: enumValue` — enums are unquoted literals in GraphQL, and their
 * generated type names differ per collection, so they are inlined rather than
 * passed as variables.
 */
export function enumField(name: string, value: unknown, allowed: readonly string[]): string | null {
  if (value == null) return null;
  const v = String(value);
  if (!allowed.includes(v)) return null;
  return `${name}: ${v}`;
}

/** `field: "2026-01-01T00:00:00.000Z"` from anything date-shaped. */
export function dateField(name: string, value: unknown): string | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return `${name}: ${gqlStr(d.toISOString())}`;
}

/** Join the non-null fragments produced by the helpers above. */
export function fields(...parts: Array<string | null>): string {
  return parts.filter((p): p is string => p != null).join(', ');
}

/** Run a document and throw with the GraphQL error text when it fails. */
export async function run(exec: Exec, query: string, label: string): Promise<any> {
  const res = await exec(query);
  if (res?.errors?.length) {
    throw new Error(`[archive:${label}] ${JSON.stringify(res.errors)}`);
  }
  return res?.data ?? null;
}
