/**
 * A new supplier meets the open wishes (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.6.5,
 * M9). A wish runs its own matching when it is published; a product created
 * after that was, until now, found only when the wisher pressed "refresh". Here
 * the other direction: the products a rikma import just created are scored
 * against every open wish — with the very same `scoreCandidate` a wish's own
 * run uses — and the best become ordinary suggested proposals on her page.
 *
 * Pure. Bounded on purpose: a supplier with thirty products must not flood one
 * wisher, nor fan out to a hundred wishes at once.
 */

import { scoreCandidate, type CandidateMatanot, type ScoredCandidate, type WishFacts } from '../actions/configs/matchRatson.js';

export interface OpenWish {
  id: string;
  ownerIds: string[];
  facts: WishFacts;
}

export interface WishOffer {
  ratsonId: string;
  ownerIds: string[];
  cand: CandidateMatanot & ScoredCandidate;
}

export const PER_WISH = 2;
export const TOTAL = 40;

export function pickWishOffers(
  products: readonly CandidateMatanot[],
  wishes: readonly OpenWish[],
  options: { supplierId: string; threshold: number; perWish?: number; total?: number }
): WishOffer[] {
  const perWish = options.perWish ?? PER_WISH;
  const total = options.total ?? TOTAL;
  const all: WishOffer[] = [];

  for (const wish of wishes) {
    // Your own wish is not a customer.
    if (wish.ownerIds.includes(String(options.supplierId))) continue;
    if (!wish.facts.needs.length) continue;
    const hits = products
      .filter((p) => p.projectId)
      .map((p) => {
        const s = scoreCandidate(p, wish.facts);
        return s && s.score >= options.threshold ? { ...p, ...s } : null;
      })
      .filter((c): c is CandidateMatanot & ScoredCandidate => !!c)
      .sort((a, b) => b.score - a.score)
      .slice(0, perWish);
    for (const cand of hits) all.push({ ratsonId: wish.id, ownerIds: wish.ownerIds, cand });
  }

  // The strongest matches first when the cap cuts.
  return all.sort((a, b) => b.cand.score - a.cand.score).slice(0, total);
}
