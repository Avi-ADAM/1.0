/**
 * Pure state-machine logic for maagad offers — PLAN_SHARED_PURCHASE §7,
 * PLAN_DISCOVERY_MAP M2/M3. No I/O here so the transitions are unit-testable
 * in isolation; the action handlers in `configs/maagad.ts` wire these decisions
 * to Strapi mutations.
 *
 * Offer lifecycle (§7.4):
 *   open ──quorum──▶ quorum_reached ──confirm──▶ activated
 *     │                    │
 *     └──deadline──▶ expired ◀──unsign-below-min──┘
 */

export type OfferStatus =
  | 'open'
  | 'quorum_reached'
  | 'activated'
  | 'expired'
  | 'withdrawn';

export interface OfferState {
  status: OfferStatus;
  signedCount: number;
  minParticipants: number;
  maxParticipants: number | null;
  /** ISO string or ms epoch; null ⇒ no deadline. */
  signDeadline: string | number | null;
}

function deadlineMs(deadline: string | number | null): number | null {
  if (deadline == null) return null;
  const ms = typeof deadline === 'number' ? deadline : new Date(deadline).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Is this offer currently accepting new signatures? */
export function canSign(offer: OfferState, nowMs: number = Date.now()): { ok: boolean; reason?: string } {
  if (offer.status !== 'open' && offer.status !== 'quorum_reached') {
    return { ok: false, reason: `offer is ${offer.status} — signing is closed` };
  }
  const dl = deadlineMs(offer.signDeadline);
  if (dl != null && dl <= nowMs) {
    return { ok: false, reason: 'sign_deadline has passed' };
  }
  if (offer.maxParticipants != null && offer.signedCount >= offer.maxParticipants) {
    return { ok: false, reason: 'offer is full' };
  }
  return { ok: true };
}

/** Result of adding one signature: the new count and the status it implies. */
export function applySignature(offer: OfferState): { signedCount: number; status: OfferStatus } {
  const signedCount = offer.signedCount + 1;
  const reachedQuorum = signedCount >= offer.minParticipants;
  // Never downgrade an already-reached quorum; activation is a separate step.
  const status: OfferStatus =
    offer.status === 'open' && reachedQuorum ? 'quorum_reached' : offer.status;
  return { signedCount, status };
}

/**
 * Result of withdrawing one signature before activation. If a
 * previously-reached quorum drops below `min`, the offer falls back to `open`
 * (§7.3 — the supplier's quorum window reopens).
 */
export function applyUnsign(offer: OfferState): { signedCount: number; status: OfferStatus } {
  const signedCount = Math.max(0, offer.signedCount - 1);
  const droppedBelowMin =
    offer.status === 'quorum_reached' && signedCount < offer.minParticipants;
  const status: OfferStatus = droppedBelowMin ? 'open' : offer.status;
  return { signedCount, status };
}

/**
 * Should this offer expire now? True when it is still collecting signatures
 * (open / quorum_reached) and its deadline has passed. A quorum_reached offer
 * whose supplier never confirmed also expires — the plan's §7.2 confirm window
 * is modelled by the deadline here (callers may pass a later effective
 * deadline for the confirm window).
 */
export function shouldExpire(offer: OfferState, nowMs: number = Date.now()): boolean {
  if (offer.status !== 'open' && offer.status !== 'quorum_reached') return false;
  const dl = deadlineMs(offer.signDeadline);
  return dl != null && dl <= nowMs;
}

/** Can the supplier confirm the quorum and move to activation? */
export function canConfirm(offer: OfferState, nowMs: number = Date.now()): { ok: boolean; reason?: string } {
  if (offer.status === 'activated') return { ok: false, reason: 'offer already activated' };
  // The supplier may activate even below min (§7.3 — their right), but there
  // must be at least one signer to activate anything.
  if (offer.signedCount < 1) return { ok: false, reason: 'no signatures to activate' };
  const dl = deadlineMs(offer.signDeadline);
  if (dl != null && dl <= nowMs && offer.status === 'open') {
    return { ok: false, reason: 'deadline passed without reaching quorum' };
  }
  return { ok: true };
}

/**
 * Which price tier applies given the final signed count. Tiers are
 * `[{min, price}]`; the highest `min` that is ≤ count wins (more joiners →
 * lower price for everyone, §4.3). Falls back to `unitPrice` when no tier
 * qualifies or none are defined.
 */
export function resolveTierPrice(
  unitPrice: number,
  priceTiers: Array<{ min: number; price: number }> | null | undefined,
  signedCount: number
): number {
  if (!priceTiers || priceTiers.length === 0) return unitPrice;
  let best = unitPrice;
  let bestMin = -1;
  for (const tier of priceTiers) {
    if (signedCount >= tier.min && tier.min > bestMin) {
      best = tier.price;
      bestMin = tier.min;
    }
  }
  return best;
}
