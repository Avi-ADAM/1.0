/**
 * The promotions clock (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3.3–3.4, P3).
 *
 * Moves every live promotion along by `nextPromoStatus`: a scheduled one
 * starts, a running one ends at its time or its cap, and an emergency pause
 * that nobody answered with a counter runs again after 24 hours. Idempotent —
 * a row that moved is no longer in the state that moved it.
 *
 * The storefront webhooks (`promotion.started/ended`) are P4; this only writes.
 */
import type { Exec } from '$lib/server/archive/gql.js';
import { nextPromoStatus, type PromoTransition } from '$lib/shop/promoTerms';
import { fetchLivePromotions, updatePromotion } from './store';

export interface ClockReport {
  moved: { promotionId: string; projectId: string | null; from: string; to: PromoTransition }[];
  errors: { promotionId: string; error: string }[];
}

export async function runPromotionClock(exec: Exec, now = new Date()): Promise<ClockReport> {
  const report: ClockReport = { moved: [], errors: [] };
  for (const row of await fetchLivePromotions(exec)) {
    const next = nextPromoStatus({ ...row, counterOpen: !!row.decisionId && !row.decisionArchived }, now);
    if (!next) continue;
    try {
      await updatePromotion(exec, row.id, {
        status: next.status,
        ...(next.status === 'ended' ? { endedReason: next.endedReason } : {}),
        ...(row.status === 'paused' ? { pausedAt: null, pausedById: null } : {})
      });
      report.moved.push({ promotionId: row.id, projectId: row.projectId, from: row.status, to: next });
    } catch (e) {
      report.errors.push({ promotionId: row.id, error: (e as Error)?.message ?? String(e) });
    }
  }
  return report;
}
