// src/lib/server/webhooks/promotionEvents.ts
//
// What a storefront hears about the rikma's promotions
// (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2, P4):
//
//   promotion.started  — it prices from now on (it started, or a pause lifted)
//   promotion.paused   — the emergency brake (§3.4): prices are the approved ones meanwhile
//   promotion.ended    — its time, its cap, an early end, or a "0%" that matured
//
// The body is small on purpose — `{ id, status, endedReason }`. A storefront
// that caches prices refetches `GET /promotions` and its product pages; this
// is the nudge, not a second copy of the catalog.
//
// Same delivery as the order webhooks (dispatch.ts: signed, retried, bounded),
// and the same rule: nothing here may fail or slow the write that caused it.
// A promotion event goes to a key that reads the catalog (`products:read`) or
// the orders — those are the keys a storefront's cache and till run on.

// dispatch.ts / targets.ts are loaded on first delivery: the promotion
// modules that announce sit under the action configs, and dispatch.ts reaches
// back to the action service — a static import would close that cycle.

export const PROMOTION_WEBHOOK_EVENTS = ['promotion.started', 'promotion.paused', 'promotion.ended'] as const;
export type PromotionWebhookEvent = (typeof PROMOTION_WEBHOOK_EVENTS)[number];

export interface PromotionChange {
  projectId: string | null;
  promotionId: string;
  status: string | null;
  endedReason?: string | null;
}

/** The event a status write means, if any — proposed / scheduled are nobody's business yet. */
export function promotionEventOf(status: string | null | undefined): PromotionWebhookEvent | null {
  if (status === 'active') return 'promotion.started';
  if (status === 'paused') return 'promotion.paused';
  if (status === 'ended') return 'promotion.ended';
  return null;
}

export function mayReceivePromotion(scopes: unknown): boolean {
  const s = Array.isArray(scopes) ? scopes.map(String) : [];
  return s.includes('products:read') || s.includes('orders:read') || s.includes('orders:create');
}

export function promotionWebhookBody(
  event: PromotionWebhookEvent,
  change: PromotionChange,
  at = new Date().toISOString()
): string {
  return JSON.stringify({
    event,
    at,
    projectId: change.projectId,
    data: { id: change.promotionId, status: change.status, endedReason: change.endedReason ?? null }
  });
}

type Strapi = { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };

export async function deliverPromotionChange(
  change: PromotionChange,
  deps: { strapi: Strapi; fetch: typeof globalThis.fetch }
): Promise<void> {
  const event = promotionEventOf(change.status);
  if (!event || !change.projectId) return;
  const [{ deliver }, { getWebhookTargets, wants }] = await Promise.all([import('./dispatch.js'), import('./targets.js')]);
  const targets = (await getWebhookTargets(change.projectId, deps.strapi, deps.fetch)).filter(
    (t) => wants(t, event) && mayReceivePromotion(t.scopes)
  );
  if (!targets.length) return;
  const body = promotionWebhookBody(event, change);
  const deliveryId = `promotion-${change.promotionId}-${event}-${Date.now()}`;
  await Promise.all(targets.map((t) => deliver(t, body, event, deliveryId, deps.fetch)));
}

/**
 * Fire and forget, from wherever a promotion's status was written — the
 * actions, the decision appliers, the clock, a cap reached by an order.
 */
export function announcePromotion(change: PromotionChange): void {
  if (!promotionEventOf(change.status) || !change.projectId) return;
  import('$lib/server/actions/index.js')
    .then(({ strapiClient }) => deliverPromotionChange(change, { strapi: strapiClient as any, fetch: globalThis.fetch }))
    .catch((e) => console.warn('[webhooks] promotion event failed', change.promotionId, e?.message ?? e));
}
