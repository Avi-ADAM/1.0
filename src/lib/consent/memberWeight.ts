// Compute per-member voting weight from delivered work (D-13 / D-14).
//
// Weight(member) = Σ FinnishedMission.total for missions where member is the
//                  payee/contributor
//                + Σ Rikmash.total for resources where member contributed
//
// Stored in agorot (bigint, per D-12) — never floats.
//
// This is the pure projection used by the consent layer to feed
// `QuorumContext.memberWeights` for `weighted-*` rules. The values themselves
// come either from Strapi (read-only, during the transition) or from signed
// `mission.approve` / `rikmash.approve` events (post-Phase 1.5).
//
// Members of the rikma who committed to a mission but haven't completed any
// have weight 0 → cannot block consensus (the user's central rikma case:
// 2 contributing of 10 approved).

import { majorToMinor } from '$lib/crypto/money';

export type WorkItem = {
  contributor: string;             // userId of the person credited
  total: number | string;          // Strapi stores as Float/Decimal; we lift to bigint
};

export function computeMemberWeights(items: WorkItem[]): Map<string, bigint> {
  const map = new Map<string, bigint>();
  for (const item of items) {
    if (!item.contributor) continue;
    const minor = toMinor(item.total);
    map.set(item.contributor, (map.get(item.contributor) ?? 0n) + minor);
  }
  return map;
}

/**
 * Sum of all members' weights — useful for displaying "X% so far" or for
 * computing thresholds outside the verifier.
 */
export function totalWeight(weights: Map<string, bigint>): bigint {
  let sum = 0n;
  for (const w of weights.values()) sum += w;
  return sum;
}

/**
 * Returns members with positive weight (filters out the "committed but not
 * delivered" zero-weight members). Useful for UI ("who can effectively vote").
 */
export function positiveWeightMembers(weights: Map<string, bigint>): string[] {
  const out: string[] = [];
  for (const [member, w] of weights) if (w > 0n) out.push(member);
  return out;
}

/**
 * Returns the member's share as basis points (1bp = 0.01%).
 * 0–10000, where 10000 = 100%. Uses bigint to avoid float drift.
 */
export function shareBps(member: string, weights: Map<string, bigint>): number {
  const w = weights.get(member) ?? 0n;
  const t = totalWeight(weights);
  if (t === 0n) return 0;
  return Number((w * 10_000n) / t);
}

function toMinor(total: number | string): bigint {
  if (typeof total === 'bigint') return total;
  if (typeof total === 'number') {
    if (!Number.isFinite(total)) throw new Error('memberWeight: non-finite total');
    // Float number → round to 2 decimals via toFixed, then parse.
    return majorToMinor(total.toFixed(2));
  }
  return majorToMinor(total);
}
