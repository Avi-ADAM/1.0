/**
 * Which of a pool's threshold offers *is* the pool, when one line has to
 * stand for it — in a share card, a link preview, a description tag.
 *
 * Pure and client-safe: the public page uses it for its head, the server for
 * the card image, so both say the same thing about the same pool.
 */

const RANK: Record<string, number> = { activated: 3, quorum_reached: 2, open: 1 };

/**
 * The live offer that is furthest along: activated beats threshold-reached
 * beats open; among equals, the one with the most signatures. Expired and
 * withdrawn offers never lead. `null` when the pool has no live offer.
 */
export function pickOffer<T extends { status: string; signedCount: number }>(offers: readonly T[]): T | null {
  let best: T | null = null;
  for (const o of offers) {
    if (!(o.status in RANK)) continue;
    if (
      !best ||
      RANK[o.status] > RANK[best.status] ||
      (RANK[o.status] === RANK[best.status] && o.signedCount > best.signedCount)
    ) {
      best = o;
    }
  }
  return best;
}

/** Whole days from now until `iso`, floored at 0; null when there is no usable date. */
export function daysLeft(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - now) / 86_400_000));
}
