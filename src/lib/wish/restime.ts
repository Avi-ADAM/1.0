/**
 * The pace of a wish — how long the other side has to answer before silence answers
 * for them (QA_CONCIERGE_E2E C-9).
 *
 * "Silence is consent, at the rikma's pace": a rikma has a `restime`, and a standing
 * proposal matures when it runs out. A wish has no rikma yet, so it carries its own:
 * the same four values a rikma offers, **48 hours by default**, and an advanced
 * setting lets the wisher choose another for this wish alone. A counter restarts the
 * clock, like everywhere else.
 *
 * Stored in the wish's own `restime` field (null on every wish that predates it =
 * the default). Pure on purpose: the server (the clock, the maturation) and the
 * cards (the deadline they show) read the same numbers from here.
 */

export const WISH_RESTIME_VALUES = ['feh', 'sth', 'nsh', 'sevend'] as const;
export type WishRestime = (typeof WISH_RESTIME_VALUES)[number];

/** 48 hours — what a wish uses unless its owner chose otherwise. */
export const WISH_RESTIME_DEFAULT: WishRestime = 'feh';

const HOURS: Record<WishRestime, number> = { feh: 48, sth: 72, nsh: 96, sevend: 168 };

/** Whatever Strapi (or an old row, or a typo) gave us, as a value we know. */
export function normalizeRestime(v: unknown): WishRestime {
  return (WISH_RESTIME_VALUES as readonly string[]).includes(v as string) ? (v as WishRestime) : WISH_RESTIME_DEFAULT;
}

export const restimeHours = (v: unknown): number => HOURS[normalizeRestime(v)];
export const restimeMs = (v: unknown): number => restimeHours(v) * 3600_000;

/**
 * The moment the version on the table was last signed: the last entry of the
 * signature log, or — before anyone has signed anything on top of it — the moment
 * the proposal was opened. This is when the other side's clock starts.
 */
export function lastSignedAt(
  entries: { submittedAt?: string | null }[] | null | undefined,
  createdAt?: string | null
): string | null {
  const times = (entries ?? [])
    .map((e) => (e.submittedAt ? Date.parse(e.submittedAt) : NaN))
    .filter((t) => Number.isFinite(t));
  if (times.length > 0) return new Date(Math.max(...times)).toISOString();
  return createdAt && Number.isFinite(Date.parse(createdAt)) ? new Date(createdAt).toISOString() : null;
}

/** When silence matures the version on the table (ISO), or null when we cannot tell. */
export function proposalDeadline(signedAt: string | null | undefined, restime: unknown): string | null {
  if (!signedAt) return null;
  const t = Date.parse(signedAt);
  return Number.isFinite(t) ? new Date(t + restimeMs(restime)).toISOString() : null;
}
