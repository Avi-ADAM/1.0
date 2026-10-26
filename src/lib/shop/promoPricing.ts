/**
 * Promotions on the surfaces (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2–5.3, P4).
 *
 * The engine (`promotions.ts`) prices a cart against normalized promotions and
 * knows nothing of Strapi; the consent layer (`promoTerms.ts`) decides what a
 * rikma agreed to. This module is the adapter between the stored rows and the
 * engine, and it is pure so every surface — the catalog DTO, `GET /promotions`,
 * `POST /cart/quote`, a reported order — reads the same prices:
 *
 *   - `pricingPromotions` — the rows the engine may use right now: running and
 *     not capped out, with what a promotion cannot touch (§2) excluded;
 *   - `resolveCartLines` — a cart priced from the rikma's own list prices,
 *     never from what the caller sent;
 *   - `decorateProduct` — `salePrice` / `promotion` on a catalog product;
 *   - `pricePaidOrder` — §5.3: what was paid against what the engine says.
 */
import {
  priceCart,
  promoPriceOf,
  type ActivePromotion,
  type CartLine,
  type FloorOf,
  type PriceCartResult,
  type PromotionBadge,
  type PromotionKind,
  type PromotionScope,
  type PromotionStatus
} from './promotions';
import { promoIneligible, type PromoPolicy, type ShelfProduct } from './promoTerms';

/** A buyer who started paying before the end keeps the price this long after it (§5.3). */
export const PAYMENT_GRACE_MS = 15 * 60 * 1000;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The stored fields this module reads — a `PromotionRow` satisfies it. */
export interface PricingPromotionRow {
  id: string;
  status: PromotionStatus | string | null;
  endedReason?: string | null;
  kind: PromotionKind;
  name: string | null;
  scope: PromotionScope;
  rule: unknown;
  startsAt: string | null;
  endsAt: string | null;
  capUnits: number | null;
  capOrders: number | null;
  usedUnits: number | null;
  usedOrders: number | null;
  perOrderMax: number | null;
}

export function capReached(row: Pick<PricingPromotionRow, 'capUnits' | 'capOrders' | 'usedUnits' | 'usedOrders'>): boolean {
  return (
    (row.capUnits != null && (row.usedUnits ?? 0) >= row.capUnits) ||
    (row.capOrders != null && (row.usedOrders ?? 0) >= row.capOrders)
  );
}

/** Ids of the shelf's products no promotion may touch — a store-wide scope skips them. */
export function ineligibleIds(shelf: readonly ShelfProduct[]): string[] {
  return shelf.filter((p) => promoIneligible(p) !== null).map((p) => p.id);
}

/**
 * The rows the engine may price with at `now`.
 *
 * Only `active` and not capped out — a paused promotion is braked, a scheduled
 * one has not started. `honour` names promotions a storefront said the buyer
 * paid under: one that ended by its time or its cap within the grace before
 * `now` still prices that order (§5.3), and nothing else.
 */
export function pricingPromotions(
  rows: readonly PricingPromotionRow[],
  shelf: readonly ShelfProduct[],
  opts: { now: Date; honour?: ReadonlySet<string> | null }
): ActivePromotion[] {
  const now = opts.now.getTime();
  const excluded = ineligibleIds(shelf);
  const out: ActivePromotion[] = [];
  for (const row of rows) {
    let endsAt = row.endsAt;
    const live = row.status === 'active' && !capReached(row);
    if (!live) {
      const endMs = row.endsAt ? Date.parse(row.endsAt) : NaN;
      const lately =
        !!opts.honour?.has(row.id) &&
        (row.status === 'active' || (row.status === 'ended' && (row.endedReason === 'time' || row.endedReason === 'cap'))) &&
        Number.isFinite(endMs) &&
        endMs + PAYMENT_GRACE_MS >= now;
      if (!lately) continue;
      // The engine's end is exclusive; this order is priced as if it still ran.
      if (endMs <= now) endsAt = new Date(now + 1000).toISOString();
    }
    out.push({
      id: row.id,
      name: row.name,
      kind: row.kind,
      status: 'active',
      scope: { ...row.scope, exclude: [...(row.scope?.exclude ?? []).map(String), ...excluded] },
      rule: row.rule,
      startsAt: row.startsAt,
      endsAt
    } as ActivePromotion);
  }
  return out;
}

/**
 * BOM cost per unit as the floor (§4.3 rule 4, D5). Null policy = legacy =
 * `cost`: a promotion that loses money on every unit needs an explicit vote.
 */
export function floorOfShelf(shelf: readonly ShelfProduct[], policy: PromoPolicy | null): FloorOf {
  if (policy?.floor === 'none') return () => null;
  const costs = new Map(shelf.map((p) => [p.id, p.cost ?? null]));
  return (line) => costs.get(String(line.productId)) ?? null;
}

// ── a cart, priced from the shelf ─────────────────────────────────────────────

export interface QuoteLineInput {
  lineId?: string | null;
  productId: string;
  variantId: string | null;
  quantity: number;
}

export type CartRefusal = {
  ok: false;
  status: 404 | 409;
  code: 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'VARIANT_REQUIRED' | 'NOT_CHECKOUTABLE';
  message: string;
  line: number;
};

/**
 * The cart with every list price read from the rikma's shelf — the caller's
 * prices are never trusted. Refuses with the same codes `POST /orders` does.
 */
export function resolveCartLines(
  input: readonly QuoteLineInput[],
  shelf: readonly ShelfProduct[]
): { ok: true; lines: CartLine[] } | CartRefusal {
  const byId = new Map(shelf.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (const [i, l] of input.entries()) {
    const refuse = (status: 404 | 409, code: CartRefusal['code'], message: string): CartRefusal => ({
      ok: false,
      status,
      code,
      message: `lines[${i}]: ${message}`,
      line: i
    });
    const p = byId.get(String(l.productId));
    if (!p || p.archived || p.published === false) return refuse(404, 'PRODUCT_NOT_FOUND', `Product ${l.productId} is not sold by this rikma`);
    if ((p.pricingMode ?? 'fixed') !== 'fixed' || p.price == null) {
      return refuse(409, 'NOT_CHECKOUTABLE', `Product ${l.productId} has no fixed price — send the buyer to its buyUrl`);
    }
    let unitPrice = p.price;
    if (l.variantId) {
      const v = p.variants.find((x) => x.id === String(l.variantId));
      if (!v) return refuse(404, 'VARIANT_NOT_FOUND', `Variant ${l.variantId} is not a variant of product ${l.productId}`);
      unitPrice = v.price ?? p.price;
    } else if (p.variants.length) {
      return refuse(409, 'VARIANT_REQUIRED', `Product ${l.productId} is sold by variant — the line needs a variantId`);
    }
    lines.push({
      lineId: l.lineId ?? String(i),
      productId: p.id,
      variantId: l.variantId ? String(l.variantId) : null,
      categoryIds: p.categoryIds,
      quantity: l.quantity,
      unitPrice
    });
  }
  return { ok: true, lines };
}

// ── the catalog ───────────────────────────────────────────────────────────────

export interface DecoratableVariant {
  id: string;
  price: number | null;
  active: boolean;
}

export interface DecoratableProduct {
  id: string;
  price: number | null;
  categories: Array<{ id: string }>;
  priceRange: { min: number; max: number; currency: string | null } | null;
  variants: DecoratableVariant[];
}

export type WithSale<T> = T & { salePrice: number | null; promotion: PromotionBadge | null };

/**
 * `salePrice` and `promotion` beside the approved `price`, which never moves
 * (§5.2). Only item/store promotions have a price of their own; a bundle,
 * "1+1" or a threshold depends on the cart and shows up in `/cart/quote`.
 * `priceRange` is read off the discounted prices, so "from ₪…" is what a
 * buyer pays.
 */
export function decorateProduct<P extends DecoratableProduct>(
  product: P,
  promos: readonly ActivePromotion[],
  now: Date,
  floorOf?: FloorOf
): WithSale<Omit<P, 'variants'>> & { variants: WithSale<P['variants'][number]>[] } {
  const base = { id: product.id, price: product.price, categoryIds: product.categories.map((c) => c.id) };
  const own = promos.length && product.price != null ? promoPriceOf(base, null, promos, now, floorOf) : null;
  const variants = product.variants.map((v) => {
    const p = promos.length && v.price != null ? promoPriceOf(base, { id: v.id, price: v.price }, promos, now, floorOf) : null;
    return { ...v, salePrice: p?.price ?? null, promotion: p?.promotion ?? null };
  });

  let priceRange = product.priceRange;
  if (priceRange && promos.length) {
    const live = variants.filter((v) => v.active && v.price != null);
    const prices = live.length
      ? live.map((v) => v.salePrice ?? (v.price as number))
      : [priceRange.min, priceRange.max].map(
          (amount) => promoPriceOf({ ...base, price: amount }, null, promos, now, floorOf)?.price ?? amount
        );
    priceRange = { ...priceRange, min: Math.min(...prices), max: Math.max(...prices) };
  }
  const promotion = own?.promotion ?? variants.find((v) => v.promotion)?.promotion ?? null;
  return { ...product, priceRange, variants, salePrice: own?.price ?? null, promotion };
}

/**
 * Inside 1lev1 — reporting a sale, the gift page: the price each product sells
 * for today when an item / store promotion is running on it. Only products
 * whose price is today's sale price are listed; a manual report still records
 * what was actually received.
 */
export function shelfSalePrices(
  shelf: readonly ShelfProduct[],
  promos: readonly ActivePromotion[],
  now: Date,
  floorOf?: FloorOf
): Record<string, { price: number; listPrice: number; promotion: PromotionBadge }> {
  const out: Record<string, { price: number; listPrice: number; promotion: PromotionBadge }> = {};
  if (!promos.length) return out;
  for (const p of shelf) {
    if (p.price == null || promoIneligible(p)) continue;
    const sale = promoPriceOf({ id: p.id, price: p.price, categoryIds: p.categoryIds }, null, promos, now, floorOf);
    if (sale && sale.price < p.price) out[p.id] = sale;
  }
  return out;
}

// ── what a storefront may know of a promotion ─────────────────────────────────

export interface ApiPromotion {
  id: string;
  name: string | null;
  kind: PromotionKind;
  status: 'scheduled' | 'active';
  scope: { all: boolean; products: string[]; variants: string[]; categories: string[]; exclude: string[] };
  rule: unknown;
  startsAt: string | null;
  endsAt: string | null;
  /** What is left of a cap; null = no cap. "Until stock runs out" is the stock, not this. */
  remaining: { units: number | null; orders: number | null };
  perOrderMax: number | null;
}

/** The rikma's running and coming promotions, as `GET /promotions` and its banner read them. */
export function apiPromotionsOf(rows: readonly PricingPromotionRow[], shelf: readonly ShelfProduct[]): ApiPromotion[] {
  const excluded = ineligibleIds(shelf);
  const ids = (v?: readonly (string | number)[]) => (v ?? []).map(String);
  return rows
    .filter((r) => (r.status === 'active' && !capReached(r)) || r.status === 'scheduled')
    .map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      status: r.status as 'scheduled' | 'active',
      scope: {
        all: r.scope?.all === true,
        products: ids(r.scope?.products),
        variants: ids(r.scope?.variants),
        categories: ids(r.scope?.categories),
        exclude: [...new Set([...ids(r.scope?.exclude), ...excluded])]
      },
      rule: r.rule,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      remaining: {
        units: r.capUnits == null ? null : Math.max(0, r.capUnits - (r.usedUnits ?? 0)),
        orders: r.capOrders == null ? null : Math.max(0, r.capOrders - (r.usedOrders ?? 0))
      },
      perOrderMax: r.perOrderMax
    }))
    .sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? '') || a.id.localeCompare(b.id));
}

// ── an order that was paid (§5.3) ─────────────────────────────────────────────

export interface PaidLine {
  position: number;
  productId: string;
  variantId: string | null;
  quantity: number;
  /** What this line was paid — exact, never recomputed from a rounded unit price. */
  lineTotal: number;
  /** The promotion the storefront says this line was sold under. */
  promotionId?: string | null;
}

export interface PaidLinePromo {
  position: number;
  listPrice: number;
  /** `listPrice × quantity − lineTotal`, never below zero. */
  discount: number;
  promotionId: string | null;
}

export interface PaidOrderPricing {
  lines: PaidLinePromo[];
  /** What the lines would cost at the approved prices. */
  listTotal: number;
  /** What the engine says they cost now, promotions included. */
  catalogTotal: number;
  paidTotal: number;
  /** Paid below the engine's price (0 when not): a fact on the order, never a refusal. */
  gap: number;
  gapPct: number;
  /** The gap is more than the rikma lets a member arrange on their own (H8). */
  overArranged: boolean;
  /** promotionId → what this order used of it. */
  usage: Map<string, { units: number; orders: number }>;
}

/**
 * A paid order against the engine. A paid order is never refused (§5.3):
 * at or above the engine's price it is recorded as it is; below it, a
 * promotion the storefront names that ran within the grace before `now`
 * covers it; whatever is still below is the gap, and the order says so.
 *
 * Measured over the whole order, not per line: a bundle or a threshold is
 * shared between lines, and a storefront may share it differently than we do.
 * Returns null when a line is not on the shelf at a fixed price — the order
 * is then recorded exactly as before promotions existed.
 */
export function pricePaidOrder(args: {
  paid: readonly PaidLine[];
  shelf: readonly ShelfProduct[];
  rows: readonly PricingPromotionRow[];
  policy: PromoPolicy | null;
  now: Date;
}): PaidOrderPricing | null {
  const { paid, shelf, rows, policy, now } = args;
  const cart = resolveCartLines(
    paid.map((l) => ({ lineId: String(l.position), productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    shelf
  );
  if (cart.ok === false) return null;
  const floorOf = floorOfShelf(shelf, policy);
  const paidTotal = round2(paid.reduce((s, l) => s + l.lineTotal, 0));

  let quote: PriceCartResult = priceCart(cart.lines, pricingPromotions(rows, shelf, { now }), { now, floorOf });
  const claimed = new Set(paid.map((l) => l.promotionId).filter((id): id is string => !!id).map(String));
  if (claimed.size && paidTotal < quote.total) {
    const honoured = priceCart(cart.lines, pricingPromotions(rows, shelf, { now, honour: claimed }), { now, floorOf });
    if (honoured.total < quote.total) quote = honoured;
  }

  const byLine = new Map(quote.lines.map((l) => [l.lineId, l]));
  const usage = new Map<string, { units: number; orders: number }>();
  const lines = paid.map((l) => {
    const q = byLine.get(String(l.position));
    const listPrice = q?.listPrice ?? 0;
    const discount = Math.max(0, round2(listPrice * l.quantity - l.lineTotal));
    // A line linked to a promotion only when it was actually sold below list.
    const ids = discount > 0 && q ? q.promotionIds : [];
    for (const id of ids) {
      const u = usage.get(id) ?? { units: 0, orders: 1 };
      u.units += l.quantity;
      usage.set(id, u);
    }
    return { position: l.position, listPrice, discount, promotionId: ids[0] ?? null };
  });

  const listTotal = round2(quote.lines.reduce((s, l) => s + l.listPrice * l.quantity, 0));
  const gap = paidTotal < quote.total - 0.005 ? round2(quote.total - paidTotal) : 0;
  const gapPct = gap > 0 && quote.total > 0 ? round2((gap / quote.total) * 100) : 0;
  return {
    lines,
    listTotal,
    catalogTotal: quote.total,
    paidTotal,
    gap,
    gapPct,
    overArranged: gap > 0 && gapPct > (policy?.arrangedDiscountPct ?? 0),
    usage
  };
}

/** The counters after an order, and whether that order closed the promotion (§5.3: the order keeps its price). */
export function usageAfter(
  row: Pick<PricingPromotionRow, 'capUnits' | 'capOrders' | 'usedUnits' | 'usedOrders'>,
  add: { units: number; orders: number }
): { usedUnits: number; usedOrders: number; capped: boolean } {
  const next = {
    capUnits: row.capUnits,
    capOrders: row.capOrders,
    usedUnits: round2((row.usedUnits ?? 0) + add.units),
    usedOrders: (row.usedOrders ?? 0) + add.orders
  };
  return { usedUnits: next.usedUnits, usedOrders: next.usedOrders, capped: capReached(next) };
}
