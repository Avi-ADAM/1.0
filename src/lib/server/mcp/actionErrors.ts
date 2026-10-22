/**
 * The sentence an agent sees when an action fails.
 *
 * `actionService.executeAction` reports a failure as `{ success:false, error }`
 * where `error` is an object — `{ code, message, details }` — not a string.
 * `String(error)` turned every failed shop write into "[object Object]", so an
 * agent could not tell a validation error from a membership refusal from a
 * Strapi rejection, and neither could the person reading its answer.
 *
 * The details carry the actual reason for the two codes that need one:
 * VALIDATION_FAILED (a list of strings) and STRAPI_ERROR (GraphQL errors).
 */

const MAX_LEN = 600;

function detailText(details: unknown): string | null {
  if (details == null) return null;
  if (typeof details === 'string') return details.trim() || null;
  if (Array.isArray(details)) {
    const parts = [
      ...new Set(
        details
          .map((d) => (typeof d === 'string' ? d : d?.message != null ? String(d.message) : null))
          .filter((s): s is string => !!s && !!s.trim())
      )
    ];
    return parts.length ? parts.join('; ') : null;
  }
  if (typeof details === 'object' && (details as any).message != null) return String((details as any).message);
  return null;
}

export function describeActionError(error: unknown, fallback = 'The action reported a failure.'): string {
  if (error == null) return fallback;
  if (typeof error === 'string') return error || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error !== 'object') return String(error);

  const e = error as { code?: unknown; message?: unknown; details?: unknown };
  const message = typeof e.message === 'string' && e.message.trim() ? e.message.trim() : null;
  const code = typeof e.code === 'string' && e.code.trim() ? e.code.trim() : null;
  const detail = detailText(e.details);

  let out = message ?? fallback;
  if (detail && detail !== message) out += `: ${detail}`;
  if (code) out += ` [${code}]`;
  return out.length > MAX_LEN ? `${out.slice(0, MAX_LEN - 1)}…` : out;
}
