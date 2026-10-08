/**
 * What a wish's terms are, for the signatures on them —
 * docs/inprogress/PLAN_DIRECT_OFFER.md §4.3 (decision 4).
 *
 * A provider signs hours and a price (`proposalRounds.ts`), but what those numbers
 * buy is the wish itself: what to make, where, and by when. When the wisher changes
 * any of that after a provider signed, she has put a new version on the table, and
 * it is the provider's move again, exactly as after a counter. That is a part of the
 * negotiation, not a side channel: a customer who can quietly move the deadline of
 * work someone already agreed to is not negotiating.
 *
 * The wish carries a digest of its terms (`Ratson.terms_digest`), and every
 * signature records the digest it was made under (`willingness_entry.termsDigest`).
 * This module decides what goes into the digest. It is pure so the page and the
 * server agree on it; the hash itself is `$lib/server/wish/termsDigest`.
 *
 * In the digest: the title, the description, the dates, online or not, and the
 * place. Not in it: the pictures, the pace, the parts list (each part is signed on
 * its own), and anything that only shapes how the wish is shown.
 */

export interface WishTerms {
  name?: string | null;
  /** The full description; `desc` is the fallback when there is none. */
  longDes?: string | null;
  desc?: string | null;
  startDate?: string | null;
  finnishDate?: string | null;
  isOnline?: boolean | null;
  /** The pin the composer writes (`WishForm` → `lat`/`lng`/`radius` on the wish itself). */
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
  location_hint?: string | null;
  /** The places component — written by other paths; both count. */
  location?: Array<{ lat?: number | null; lng?: number | null; radius?: number | null; location_hint?: string | null } | null> | null;
}

/** Collapse what a rich-text editor or a retyped line changes without changing the words. */
const text = (s: unknown): string =>
  String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** A day is the unit of a deadline: a time re-saved in another zone is the same day. */
const day = (s: unknown): string | null => {
  if (s == null || s === '') return null;
  const t = Date.parse(String(s));
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};

/** ~1 m: a pin dragged by a hair is the same place. */
const coord = (n: unknown): number | null => {
  const v = typeof n === 'number' ? n : n == null || n === '' ? NaN : Number(n);
  return Number.isFinite(v) ? Math.round(v * 1e5) / 1e5 : null;
};

/**
 * The canonical form of a wish's terms — the string that is hashed. Field order is
 * fixed and the places are sorted, so the same terms always give the same string.
 */
export function termsCanonical(w: WishTerms): string {
  const places = (w.location ?? [])
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => [coord(p.lat), coord(p.lng), p.radius ?? null, text(p.location_hint)] as const)
    .filter(([lat, lng, , hint]) => lat != null || lng != null || hint !== '')
    .map((p) => JSON.stringify(p))
    .sort();
  return JSON.stringify([
    1, // the version of this canonical form
    text(w.name),
    text(w.longDes) || text(w.desc),
    day(w.startDate),
    day(w.finnishDate),
    w.isOnline === true,
    text(w.location_hint),
    [coord(w.lat), coord(w.lng), w.radius ?? null],
    places
  ]);
}

/**
 * Whether a signature was made under other terms than the wish has now. A signature
 * with no digest predates the digests, and a wish with none was never digested: in
 * both cases there is nothing to compare, so the signature stands.
 */
export function signedUnderOtherTerms(signedDigest: string | null | undefined, wishDigest: string | null | undefined): boolean {
  return !!signedDigest && !!wishDigest && signedDigest !== wishDigest;
}
