/**
 * Promotions where money is quoted and taken (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2–5.3, P4).
 *
 * Reads run with the service token: the catalog, `GET /promotions` and
 * `/cart/quote` have no member behind them, and a reported order's counters
 * must move whoever's key reported it. The pure decisions live in
 * `$lib/shop/promoPricing`; this file only reads and writes.
 *
 * Nothing here may fail a sale. A promotion that cannot be read prices like
 * no promotion; a counter that cannot be written is a warning in the log.
 */
import { env } from '$env/dynamic/private';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { execFromAdmin } from '$lib/server/archive/exec.js';
import { fields, gqlStr, numField, run, strField, type Exec } from '$lib/server/archive/gql.js';
import {
  PAYMENT_GRACE_MS,
  floorOfShelf,
  pricePaidOrder,
  pricingPromotions,
  shelfSalePrices,
  usageAfter,
  type PaidLine,
  type PaidOrderPricing
} from '$lib/shop/promoPricing';
import type { PromoPolicy, ShelfProduct } from '$lib/shop/promoTerms';
import { announcePromotion } from '$lib/server/webhooks/promotionEvents';
import { fetchProjectPromotions, fetchPromoProject, fetchPromotion, fetchShelf, updatePromotion, type PromotionRow } from './store';

export type SalePrices = ReturnType<typeof shelfSalePrices>;

export function promoAdminExec(): Exec {
  return execFromAdmin(SendToAdmin, env.ADMINMONTHER ?? '');
}

export interface PromoPricing {
  policy: PromoPolicy | null;
  currencyCode: string | null;
  shelf: ShelfProduct[];
  rows: PromotionRow[];
}

/**
 * The rikma's shelf and its promotions. With no promotion that can price
 * anything the shelf is not read at all — the common case costs one query.
 */
export async function loadPromoPricing(
  exec: Exec,
  projectId: string,
  opts: { endedSince?: Date; shelf?: 'always' | 'whenPromoted' } = {}
): Promise<PromoPricing> {
  const rows = await fetchProjectPromotions(exec, projectId, opts.endedSince);
  const needShelf = opts.shelf === 'always' || rows.length > 0;
  const [project, shelf] = await Promise.all([
    rows.length ? fetchPromoProject(exec, projectId) : Promise.resolve(null),
    needShelf ? fetchShelf(exec, projectId) : Promise.resolve([] as ShelfProduct[])
  ]);
  return { policy: project?.policy ?? null, currencyCode: project?.currencyCode ?? null, shelf, rows };
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { value: PromoPricing; expiresAt: number }>();

/**
 * For the catalog and `GET /promotions` — read on every storefront page view,
 * so a minute of staleness is the price of not asking Strapi twice per view.
 * A quote and a paid order always read fresh.
 */
export async function cachedPromoPricing(projectId: string): Promise<PromoPricing | null> {
  const hit = cache.get(projectId);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  try {
    const value = await loadPromoPricing(promoAdminExec(), projectId);
    cache.set(projectId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (e) {
    // Before 1.0b carries the promotion collection the query fails: no promotions.
    console.warn('[promotions] pricing read failed for project', projectId, (e as Error)?.message ?? e);
    return null;
  }
}

/** Test seam. */
export function clearPromoPricingCache(): void {
  cache.clear();
}

/** Today's sale price of each product on promotion — `{}` when there is none or it cannot be read. */
export async function salePricesFor(projectId: string, now = new Date()): Promise<SalePrices> {
  const pricing = await cachedPromoPricing(projectId);
  if (!pricing) return {};
  const promos = pricingPromotions(pricing.rows, pricing.shelf, { now });
  return shelfSalePrices(pricing.shelf, promos, now, floorOfShelf(pricing.shelf, pricing.policy));
}

/** §5.3 for an order being recorded — null when promotions cannot be read or the order is off-shelf. */
export async function pricePaidOrderFor(projectId: string, paid: PaidLine[], now = new Date()): Promise<PaidOrderPricing | null> {
  try {
    const pricing = await loadPromoPricing(promoAdminExec(), projectId, {
      endedSince: new Date(now.getTime() - PAYMENT_GRACE_MS),
      shelf: 'always'
    });
    return pricePaidOrder({ paid, shelf: pricing.shelf, rows: pricing.rows, policy: pricing.policy, now });
  } catch (e) {
    console.warn('[promotions] paid order not priced against promotions', projectId, (e as Error)?.message ?? e);
    return null;
  }
}

/**
 * What an order used of each promotion. Read fresh, then written: Strapi has
 * no increment over GraphQL, so two orders in the same second may count one —
 * a cap is a promise the rikma made, and overshooting it by an order is the
 * `oversold` of promotions (§5.3), not a refused payment. An order that
 * reaches the cap ends the promotion; the order keeps its price.
 */
export async function recordPromoUsage(
  projectId: string,
  usage: ReadonlyMap<string, { units: number; orders: number }>
): Promise<void> {
  if (!usage.size) return;
  const exec = promoAdminExec();
  for (const [promotionId, add] of usage) {
    try {
      const row = await fetchPromotion(exec, promotionId);
      if (!row || row.projectId !== projectId) continue;
      const next = usageAfter(row, add);
      const closes = next.capped && row.status === 'active';
      await updatePromotion(exec, promotionId, {
        usedUnits: next.usedUnits,
        usedOrders: next.usedOrders,
        ...(closes ? { status: 'ended' as const, endedReason: 'cap' as const } : {})
      });
      if (closes) announcePromotion({ projectId, promotionId, status: 'ended', endedReason: 'cap' });
    } catch (e) {
      console.warn('[promotions] usage not recorded', promotionId, (e as Error)?.message ?? e);
    }
  }
}

/**
 * `order-line.promotion`. Written with the service token after the line, not
 * in the member's create: an order must never fail on a permission to a
 * collection the till does not otherwise touch.
 */
export async function tagPromoOrderLines(lines: Array<{ lineId: string | null | undefined; promotionId: string | null }>): Promise<void> {
  const todo = lines.filter((l) => l.lineId && l.promotionId);
  if (!todo.length) return;
  const exec = promoAdminExec();
  for (const l of todo) {
    try {
      await run(
        exec,
        `mutation { updateOrderLine(id: ${gqlStr(String(l.lineId))}, data: { ${strField('promotion', l.promotionId)} }) { data { id } } }`,
        'promo:tag-line'
      );
    } catch (e) {
      console.warn('[promotions] order line not tagged', l.lineId, (e as Error)?.message ?? e);
    }
  }
}

/** position → the promotion its line was sold under, for an arranged order whose money arrived. */
export async function fetchOrderLinePromotions(orderId: string): Promise<Map<number, string>> {
  try {
    const data = await run(
      promoAdminExec(),
      `{ orderLines(filters: { order: { id: { eq: ${gqlStr(orderId)} } } }, pagination: { limit: 100 }) { data { attributes { position promotion { data { id } } } } } }`,
      'promo:line-promotions'
    );
    const out = new Map<number, string>();
    for (const n of data?.orderLines?.data ?? []) {
      const id = n?.attributes?.promotion?.data?.id;
      if (id != null) out.set(Number(n.attributes.position ?? 0), String(id));
    }
    return out;
  } catch (e) {
    console.warn('[promotions] order line promotions not read', orderId, (e as Error)?.message ?? e);
    return new Map();
  }
}

/** `Sale.listPrice` / `Sale.promotion` — reports and site-share read them without parsing notes (§4.4). */
export async function tagPromoSales(
  sales: Array<{ saleId: string | null | undefined; listPrice: number | null; promotionId: string | null }>
): Promise<void> {
  const todo = sales.filter((s) => s.saleId && (s.listPrice != null || s.promotionId));
  if (!todo.length) return;
  const exec = promoAdminExec();
  for (const s of todo) {
    try {
      await run(
        exec,
        `mutation { updateSale(id: ${gqlStr(String(s.saleId))}, data: { ${fields(
          numField('listPrice', s.listPrice),
          s.promotionId ? strField('promotion', s.promotionId) : null
        )} }) { data { id } } }`,
        'promo:tag-sale'
      );
    } catch (e) {
      console.warn('[promotions] sale not tagged', s.saleId, (e as Error)?.message ?? e);
    }
  }
}
