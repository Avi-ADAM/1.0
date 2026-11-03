/**
 * The two kinds of relationship a wish deal can be
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §2).
 *
 * - `atCost` — she pays for what was done, up to a ceiling; every provider stands
 *   before her separately, and she signs whatever changes what she pays.
 * - `fixed` — she buys an outcome at one price; the rikma shares the risk and
 *   everything inside it (who, how many hours, the split) is decided there.
 *
 * Stored on `Ratson` (what she asked for), `RatsonProposal` (what was offered her)
 * and `Sheirut` (what was signed). **null = legacy = `atCost`**: that is exactly how
 * every deal behaved before the field existed, so no row needs migrating. "Help"
 * (a fixed price of 0 or a token sum) is not a value here — it is derived from the
 * gap between the plan's worth and the price (§5.1).
 *
 * Pure.
 */

export type PricingTrack = 'atCost' | 'fixed';

/** A stored value, or null when nobody chose (legacy, or "not sure — let them offer"). */
export function parsePricingTrack(v: unknown): PricingTrack | null {
  return v === 'atCost' || v === 'fixed' ? v : null;
}

/** How the deal behaves: null reads as `atCost`, the mode that was always there. */
export function effectivePricingTrack(v: unknown): PricingTrack {
  return parsePricingTrack(v) ?? 'atCost';
}

/**
 * The track a deal is signed under, from the wish and the proposals she accepted.
 *
 * A proposal's own track is what was offered her, so it wins over the wish's — a
 * provider may answer "not sure" or counter with the other track (P2). A proposal
 * with none offered on the wish's terms. If the accepted proposals disagree, the
 * deal is `atCost`: it is the mode in which she signs every change to what she pays,
 * so nobody's terms are taken from her without her signature.
 *
 * Returns null when nobody chose anything, so a legacy deal stays null.
 */
export function dealPricingTrack(wish: unknown, proposals: readonly unknown[] = []): PricingTrack | null {
  const wishTrack = parsePricingTrack(wish);
  const offered = new Set(proposals.map((p) => parsePricingTrack(p) ?? wishTrack).filter((t) => t != null));
  if (offered.size > 1) return 'atCost';
  return offered.values().next().value ?? wishTrack;
}
