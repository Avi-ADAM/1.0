/**
 * Pure shop-promotion pricing (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §4–5).
 *
 * This module knows no Strapi schema and has no side effects. Callers adapt
 * catalog/DB rows to these small inputs, pass the same `now` and BOM floor
 * they use elsewhere, and use `lineTotal` as the cent-exact amount due for a
 * row. `unitPrice` is the row's average final price; use `promoPriceOf` for a
 * standalone shelf price, since it intentionally excludes cart-dependent
 * bundle/BXGY/threshold offers. Cart-wide discounts are also exposed separately
 * and their line allocations are included in `discount` / `lineTotal`.
 *
 * Money is rounded to the nearest minor unit (currently 1/100 of the currency
 * unit) at the pricing boundary. All subsequent arithmetic is integer cents.
 */

export type PromotionId = string | number;
export type PromotionDate = string | number | Date;
export type PromotionKind = 'item' | 'bundle' | 'bxgy' | 'store' | 'threshold';
export type PromotionStatus =
  | 'proposed'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'ended';

/**
 * Scope is an OR across `all`, products, variants, and categories, followed by
 * the exclusion list. An empty scope matches nothing; use `{ all: true }` for a
 * store-wide promotion.
 */
export interface PromotionScope {
  all?: boolean;
  products?: readonly PromotionId[];
  variants?: readonly PromotionId[];
  categories?: readonly PromotionId[];
  /** Product or variant IDs to omit from an otherwise-matching scope. */
  exclude?: readonly PromotionId[];
}

export type ItemPromotionRule =
  | { pct: number }
  | { price: number }
  | { off: number };
export interface BundlePromotionRule {
  qty: number;
  price: number;
  /** True means every complete group repeats; otherwise at most one group. */
  repeat?: boolean;
}
export interface BxgyPromotionRule {
  buy: number;
  get: number;
  /** Percent off the reward units; 100 is free, 50 is half price. */
  getPct: number;
  /** When true, reward the cheapest eligible get-units in the complete groups. */
  cheapestFree?: boolean;
}
export type StorePromotionRule = { pct: number };
export type ThresholdPromotionRule =
  | { minSubtotal: number; off: number }
  | { minSubtotal: number; pct: number };

interface PromotionBase<K extends PromotionKind, R> {
  id: PromotionId;
  name?: string | null;
  kind: K;
  status?: PromotionStatus | string | null;
  scope: PromotionScope;
  rule: R;
  startsAt?: PromotionDate | null;
  endsAt?: PromotionDate | null;
}

/** Normalized promotion input accepted by the price engine. */
export type ActivePromotion =
  | PromotionBase<'item', ItemPromotionRule>
  | PromotionBase<'bundle', BundlePromotionRule>
  | PromotionBase<'bxgy', BxgyPromotionRule>
  | PromotionBase<'store', StorePromotionRule>
  | PromotionBase<'threshold', ThresholdPromotionRule>;

/** A catalog line before any promotion is applied. `unitPrice` is the approved/list price. */
export interface CartLine {
  /** Optional stable cart-row identifier, preserved in the quote. */
  lineId?: PromotionId;
  productId: PromotionId;
  variantId?: PromotionId | null;
  categoryIds?: readonly PromotionId[];
  quantity: number;
  unitPrice: number;
}

export interface FloorLine extends CartLine {
  variantId: PromotionId | null;
  categoryIds: readonly string[];
  productId: string;
  unitPrice: number;
}

export type FloorOf = (line: FloorLine) => number | null | undefined;

export interface PricingContext {
  /** Date at which the quote is being made. Start is inclusive; end is exclusive. */
  now: PromotionDate;
  /** BOM cost per unit. `null` means no floor is known; it never raises list price. */
  floorOf: FloorOf;
}

export interface PromotionBadge {
  id: string;
  name: string | null;
  kind: PromotionKind;
  endsAt: string | null;
}

export interface PromoPrice {
  /** Effective per-item shelf price for item/store promotions. */
  price: number;
  listPrice: number;
  promotion: PromotionBadge;
}

export interface PricedLine {
  lineId?: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Approved, undiscounted per-unit price. */
  listPrice: number;
  /** Average per-unit price after row promotions and any allocated cart discounts. */
  unitPrice: number;
  /** Exact cent-rounded extended amount paid for this row. */
  lineTotal: number;
  /** Extended discount from listPrice × quantity, including threshold allocation. */
  discount: number;
  /** The single winning item/bundle/BXGY/store promotion on this row, if any. */
  promotionId: string | null;
  /** A threshold promotion may additionally share a discount across this row. */
  thresholdPromotionId: string | null;
  /** Both IDs when a row promotion and a threshold promotion apply. */
  promotionIds: string[];
}

export interface AppliedPromotion {
  promotionId: string;
  name: string | null;
  kind: PromotionKind;
  /** Actual discount applied after line competition and floor limits. */
  discount: number;
}

export type PricingHint =
  | {
      kind: 'bundle';
      promotionId: string;
      /** Units needed to complete the next bundle. */
      missingQuantity: number;
      bundleQuantity: number;
      bundlePrice: number;
    }
  | {
      kind: 'threshold';
      promotionId: string;
      amountRemaining: number;
      minSubtotal: number;
    };

export interface PriceCartResult {
  lines: PricedLine[];
  /** Sum after the winning row promotions, before a threshold promotion. */
  subtotal: number;
  thresholdDiscount: number;
  total: number;
  applied: AppliedPromotion[];
  /** Structured hints; UI copy belongs in translations, not this pure module. */
  hints: PricingHint[];
}

const CENTS_PER_UNIT = 100;
const PERCENT_SCALE = 1_000_000;
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

interface NormalizedLine {
  lineId?: string;
  productId: string;
  variantId: string | null;
  categoryIds: string[];
  quantity: number;
  listCents: number;
  floorCents: number;
  listTotalCents: number;
  sortKey: string;
}

interface NormalizedScope {
  all: boolean;
  products: Set<string>;
  variants: Set<string>;
  categories: Set<string>;
  exclude: Set<string>;
}

type NormalizedRule =
  | { kind: 'item'; mode: 'pct'; pct: number }
  | { kind: 'item'; mode: 'price'; priceCents: number }
  | { kind: 'item'; mode: 'off'; offCents: number }
  | { kind: 'store'; pct: number }
  | { kind: 'bundle'; qty: number; priceCents: number; repeat: boolean }
  | {
      kind: 'bxgy';
      buy: number;
      get: number;
      getPct: number;
      cheapestFree: boolean;
    }
  | {
      kind: 'threshold';
      mode: 'off';
      minSubtotalCents: number;
      offCents: number;
    }
  | { kind: 'threshold'; mode: 'pct'; minSubtotalCents: number; pct: number };

interface NormalizedPromotion {
  id: string;
  name: string | null;
  kind: PromotionKind;
  scope: NormalizedScope;
  rule: NormalizedRule;
  startsAtMs: number | null;
  endsAtMs: number | null;
  endsAt: string | null;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function idOf(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const id = String(value).trim();
  return id ? id : null;
}

function numberOf(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Return cents for a valid non-negative money value, otherwise null. */
function parseCents(value: unknown): number | null {
  const n = numberOf(value);
  if (n === null || n < 0 || n > MAX_SAFE / CENTS_PER_UNIT) return null;
  const cents = Math.round((n + Number.EPSILON) * CENTS_PER_UNIT);
  return Number.isSafeInteger(cents) ? cents : null;
}

function requiredCents(value: unknown, label: string): number {
  const cents = parseCents(value);
  if (cents === null)
    throw new RangeError(
      `${label} must be a finite, non-negative money amount`
    );
  return cents;
}

function money(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

function addSafe(a: number, b: number, label = 'cart total'): number {
  const sum = a + b;
  if (!Number.isSafeInteger(sum))
    throw new RangeError(`${label} exceeds the safe money range`);
  return sum;
}

function multiplySafe(a: number, b: number, label = 'cart total'): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0) {
    throw new RangeError(
      `${label} must use non-negative whole cents and quantities`
    );
  }
  const product = BigInt(a) * BigInt(b);
  if (product > BigInt(MAX_SAFE))
    throw new RangeError(`${label} exceeds the safe money range`);
  return Number(product);
}

function percentOfCents(cents: number, pct: number): number {
  const scaledPct = BigInt(Math.round(pct * PERCENT_SCALE));
  const numerator = BigInt(cents) * scaledPct;
  const denominator = BigInt(100 * PERCENT_SCALE);
  // Half-up rounding to the nearest cent.
  return Number((numerator + denominator / 2n) / denominator);
}

function dateMs(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  const ms =
    value instanceof Date
      ? value.getTime()
      : new Date(value as string | number).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function isoOf(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

function scopeOf(raw: unknown): NormalizedScope | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const scope = raw as Record<string, unknown>;
  const ids = (key: string): Set<string> =>
    new Set(
      Array.isArray(scope[key])
        ? (scope[key] as unknown[])
            .map(idOf)
            .filter((id): id is string => id !== null)
        : []
    );
  return {
    all: scope.all === true,
    products: ids('products'),
    variants: ids('variants'),
    categories: ids('categories'),
    exclude: ids('exclude')
  };
}

function percentOf(raw: unknown): number | null {
  const pct = numberOf(raw);
  if (pct === null || pct < 0 || pct > 100) return null;
  return Math.round(pct * PERCENT_SCALE) / PERCENT_SCALE;
}

function normalizeRule(
  kind: PromotionKind,
  raw: unknown
): NormalizedRule | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rule = raw as Record<string, unknown>;

  if (kind === 'item') {
    const modes = (['pct', 'price', 'off'] as const).filter(
      (key) => rule[key] !== undefined && rule[key] !== null
    );
    if (modes.length !== 1) return null;
    const mode = modes[0];
    if (mode === 'pct') {
      const pct = percentOf(rule.pct);
      return pct === null ? null : { kind, mode, pct };
    }
    const amount = parseCents(rule[mode]);
    if (amount === null) return null;
    return mode === 'price'
      ? { kind, mode, priceCents: amount }
      : { kind, mode, offCents: amount };
  }

  if (kind === 'store') {
    const pct = percentOf(rule.pct);
    return pct === null ? null : { kind, pct };
  }

  if (kind === 'bundle') {
    const qty = numberOf(rule.qty);
    const priceCents = parseCents(rule.price);
    if (
      qty === null ||
      !Number.isSafeInteger(qty) ||
      qty < 1 ||
      priceCents === null
    )
      return null;
    return { kind, qty, priceCents, repeat: rule.repeat === true };
  }

  if (kind === 'bxgy') {
    const buy = numberOf(rule.buy);
    const get = numberOf(rule.get);
    const getPct = percentOf(rule.getPct);
    if (
      buy === null ||
      get === null ||
      !Number.isSafeInteger(buy) ||
      !Number.isSafeInteger(get) ||
      buy < 1 ||
      get < 1 ||
      getPct === null ||
      !Number.isSafeInteger(buy + get)
    )
      return null;
    return {
      kind,
      buy,
      get,
      getPct,
      cheapestFree: rule.cheapestFree !== false
    };
  }

  const minSubtotalCents = parseCents(rule.minSubtotal);
  if (minSubtotalCents === null) return null;
  const hasOff = rule.off !== undefined && rule.off !== null;
  const hasPct = rule.pct !== undefined && rule.pct !== null;
  if (hasOff === hasPct) return null;
  if (hasOff) {
    const offCents = parseCents(rule.off);
    return offCents === null
      ? null
      : { kind, mode: 'off', minSubtotalCents, offCents };
  }
  const pct = percentOf(rule.pct);
  return pct === null ? null : { kind, mode: 'pct', minSubtotalCents, pct };
}

function normalizePromotion(
  raw: unknown,
  nowMs: number,
  duplicateIds: Set<string>
): NormalizedPromotion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const promo = raw as Record<string, unknown>;
  const id = idOf(promo.id);
  const kind = promo.kind;
  if (!id || duplicateIds.has(id)) return null;
  if (
    kind !== 'item' &&
    kind !== 'bundle' &&
    kind !== 'bxgy' &&
    kind !== 'store' &&
    kind !== 'threshold'
  )
    return null;
  if (promo.status != null && promo.status !== 'active') return null;

  const startsAtMs = dateMs(promo.startsAt);
  const endsAtMs = dateMs(promo.endsAt);
  if (startsAtMs === undefined || endsAtMs === undefined) return null;
  if (startsAtMs !== null && startsAtMs > nowMs) return null;
  if (endsAtMs !== null && endsAtMs <= nowMs) return null;
  if (startsAtMs !== null && endsAtMs !== null && endsAtMs <= startsAtMs)
    return null;

  const scope = scopeOf(promo.scope);
  const rule = normalizeRule(kind, promo.rule);
  if (!scope || !rule) return null;

  const name =
    typeof promo.name === 'string' && promo.name.trim()
      ? promo.name.trim()
      : null;
  return {
    id,
    name,
    kind,
    scope,
    rule,
    startsAtMs,
    endsAtMs,
    endsAt: isoOf(endsAtMs)
  };
}

function normalizedPromotions(
  promos: readonly ActivePromotion[],
  now: PromotionDate
): NormalizedPromotion[] {
  const nowMs = dateMs(now);
  if (nowMs === null || nowMs === undefined)
    throw new RangeError('now must be a valid date');
  const list = Array.isArray(promos) ? promos : [];
  const counts = new Map<string, number>();
  for (const raw of list) {
    const id =
      raw && typeof raw === 'object'
        ? idOf((raw as { id?: unknown }).id)
        : null;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const duplicates = new Set(
    [...counts].filter(([, count]) => count > 1).map(([id]) => id)
  );
  return list
    .map((promo) => normalizePromotion(promo, nowMs, duplicates))
    .filter((promo): promo is NormalizedPromotion => promo !== null)
    .sort((a, b) => compareText(a.id, b.id));
}

function normalizeLine(
  raw: CartLine,
  floorOf: FloorOf | undefined,
  index: number
): NormalizedLine {
  if (!raw || typeof raw !== 'object')
    throw new TypeError(`lines[${index}] must be an object`);
  const productId = idOf(raw.productId);
  if (!productId) throw new TypeError(`lines[${index}].productId is required`);
  const variantId =
    raw.variantId == null || raw.variantId === '' ? null : idOf(raw.variantId);
  if (raw.variantId != null && raw.variantId !== '' && variantId === null) {
    throw new TypeError(`lines[${index}].variantId must be a string or number`);
  }
  const lineId =
    raw.lineId == null || raw.lineId === ''
      ? undefined
      : (idOf(raw.lineId) ?? undefined);
  const quantity = numberOf(raw.quantity);
  if (quantity === null || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError(
      `lines[${index}].quantity must be a positive whole number`
    );
  }
  const listCents = requiredCents(raw.unitPrice, `lines[${index}].unitPrice`);
  const listTotalCents = multiplySafe(
    listCents,
    quantity,
    `lines[${index}] total`
  );
  const categoryIds = Array.isArray(raw.categoryIds)
    ? [
        ...new Set(
          raw.categoryIds.map(idOf).filter((id): id is string => id !== null)
        )
      ].sort(compareText)
    : [];
  const cleanLine: FloorLine = {
    ...(lineId ? { lineId } : {}),
    productId,
    variantId,
    categoryIds,
    quantity,
    unitPrice: money(listCents)
  };
  const rawFloor = floorOf?.(cleanLine);
  const floorCents =
    rawFloor == null
      ? 0
      : Math.min(
          requiredCents(rawFloor, `floor for product ${productId}`),
          listCents
        );
  const sortKey = JSON.stringify([
    productId,
    variantId,
    lineId ?? '',
    listCents,
    quantity,
    categoryIds
  ]);
  return {
    lineId,
    productId,
    variantId,
    categoryIds,
    quantity,
    listCents,
    floorCents,
    listTotalCents,
    sortKey
  };
}

function compareLines(a: NormalizedLine, b: NormalizedLine): number {
  return compareText(a.sortKey, b.sortKey);
}

function matchesScope(scope: NormalizedScope, line: NormalizedLine): boolean {
  if (
    scope.exclude.has(line.productId) ||
    (line.variantId !== null && scope.exclude.has(line.variantId))
  )
    return false;
  return (
    scope.all ||
    scope.products.has(line.productId) ||
    (line.variantId !== null && scope.variants.has(line.variantId)) ||
    line.categoryIds.some((id) => scope.categories.has(id))
  );
}

function maxDiscountCents(line: NormalizedLine): number {
  return multiplySafe(
    line.listCents - line.floorCents,
    line.quantity,
    'line discount'
  );
}

function clampedItemDiscount(
  line: NormalizedLine,
  promo: NormalizedPromotion
): number {
  const rule = promo.rule;
  if (rule.kind !== 'item' && rule.kind !== 'store') return 0;

  // Percentage reductions are rounded once on the extended row subtotal;
  // fixed price/off rules are defined per unit and then extended by quantity.
  if (rule.kind === 'store' || rule.mode === 'pct') {
    const pct = rule.pct;
    return Math.min(
      percentOfCents(line.listTotalCents, pct),
      maxDiscountCents(line)
    );
  }

  const target =
    rule.mode === 'price'
      ? rule.priceCents
      : Math.max(0, line.listCents - rule.offCents);
  const effective = Math.min(line.listCents, Math.max(line.floorCents, target));
  return multiplySafe(
    line.listCents - effective,
    line.quantity,
    'line discount'
  );
}

interface WeightedCapacity {
  index: number;
  weight: number;
  capacity: number;
}

/**
 * Split an integer discount proportionally, respecting each row's remaining
 * floor capacity. Largest remainders receive leftover cents; the line index is
 * the stable tie-breaker (lines are sorted before the engine reaches here).
 */
function allocateProportionally(
  requested: number,
  entries: WeightedCapacity[]
): Map<number, number> {
  const out = new Map<number, number>();
  let remaining = Math.min(
    requested,
    entries.reduce((sum, e) => addSafe(sum, e.capacity), 0)
  );
  let active = entries
    .filter((e) => e.capacity > 0 && e.weight > 0)
    .map((e) => ({ ...e, remainingCapacity: e.capacity }));

  while (remaining > 0 && active.length) {
    const weightTotal = active.reduce((sum, e) => addSafe(sum, e.weight), 0);
    if (weightTotal <= 0) break;
    const remainingBig = BigInt(remaining);
    const weightTotalBig = BigInt(weightTotal);
    const saturated = active.filter(
      (e) =>
        remainingBig * BigInt(e.weight) >=
        BigInt(e.remainingCapacity) * weightTotalBig
    );
    if (saturated.length) {
      const saturatedIds = new Set(saturated.map((e) => e.index));
      for (const e of saturated) {
        out.set(e.index, addSafe(out.get(e.index) ?? 0, e.remainingCapacity));
        remaining -= e.remainingCapacity;
      }
      active = active.filter((e) => !saturatedIds.has(e.index));
      continue;
    }

    const shares = active.map((e) => {
      const numerator = remainingBig * BigInt(e.weight);
      const floor = Number(numerator / weightTotalBig);
      return { entry: e, floor, remainder: numerator % weightTotalBig };
    });
    let allocated = 0;
    for (const share of shares) {
      if (share.floor > 0) {
        out.set(
          share.entry.index,
          addSafe(out.get(share.entry.index) ?? 0, share.floor)
        );
        share.entry.remainingCapacity -= share.floor;
        allocated = addSafe(allocated, share.floor);
      }
    }
    remaining -= allocated;
    const byRemainder = [...shares].sort((a, b) => {
      if (a.remainder !== b.remainder)
        return a.remainder > b.remainder ? -1 : 1;
      return a.entry.index - b.entry.index;
    });
    for (const share of byRemainder) {
      if (remaining === 0) break;
      if (share.entry.remainingCapacity <= 0) continue;
      out.set(share.entry.index, addSafe(out.get(share.entry.index) ?? 0, 1));
      share.entry.remainingCapacity -= 1;
      remaining -= 1;
    }
    break;
  }
  return out;
}

function addAllocatedDiscount(
  target: Map<number, number>,
  discountCents: number,
  entries: WeightedCapacity[]
): void {
  if (discountCents <= 0 || entries.length === 0) return;
  const merged = new Map<number, WeightedCapacity>();
  for (const entry of entries) {
    const previous = merged.get(entry.index);
    if (previous) {
      previous.weight = addSafe(
        previous.weight,
        entry.weight,
        'promotion weight'
      );
      previous.capacity = addSafe(
        previous.capacity,
        entry.capacity,
        'promotion floor capacity'
      );
    } else {
      merged.set(entry.index, { ...entry });
    }
  }
  const allocated = allocateProportionally(discountCents, [...merged.values()]);
  for (const [index, cents] of allocated) {
    target.set(
      index,
      addSafe(target.get(index) ?? 0, cents, 'promotion discount')
    );
  }
}

interface UnitSegment {
  index: number;
  quantity: number;
}
interface GroupPiece extends UnitSegment {}

/**
 * Visit complete groups without expanding quantities into one JS object per
 * item. Homogeneous runs are folded into one callback, so a large order with
 * many repeated bundles stays bounded by the number of cart rows.
 */
function forEachPackedGroup(
  segments: UnitSegment[],
  groupSize: number,
  selectedUnits: number,
  visit: (pieces: GroupPiece[], repetitions: number) => void
): void {
  let remaining = selectedUnits;
  let current: GroupPiece[] = [];
  let currentSize = 0;

  const addPiece = (index: number, quantity: number) => {
    const last = current[current.length - 1];
    if (last?.index === index) last.quantity += quantity;
    else current.push({ index, quantity });
    currentSize += quantity;
  };

  for (const segment of segments) {
    let available = Math.min(segment.quantity, remaining);
    while (available > 0) {
      if (currentSize === 0 && available >= groupSize) {
        const repetitions = Math.floor(available / groupSize);
        const consumed = multiplySafe(
          groupSize,
          repetitions,
          'promotion quantity'
        );
        visit([{ index: segment.index, quantity: groupSize }], repetitions);
        available -= consumed;
        remaining -= consumed;
        continue;
      }
      const take = Math.min(available, groupSize - currentSize);
      addPiece(segment.index, take);
      available -= take;
      remaining -= take;
      if (currentSize === groupSize) {
        visit(current, 1);
        current = [];
        currentSize = 0;
      }
    }
    if (remaining === 0) break;
  }
}

function selectedSegments(
  lines: NormalizedLine[],
  promo: NormalizedPromotion,
  order: 'price-desc' | 'canonical'
): { segments: UnitSegment[]; totalQuantity: number } {
  const eligible = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => matchesScope(promo.scope, line));
  eligible.sort((a, b) => {
    if (order === 'price-desc' && a.line.listCents !== b.line.listCents)
      return b.line.listCents - a.line.listCents;
    return compareLines(a.line, b.line);
  });
  return {
    segments: eligible.map(({ line, index }) => ({
      index,
      quantity: line.quantity
    })),
    totalQuantity: eligible.reduce(
      (sum, { line }) => addSafe(sum, line.quantity, 'eligible quantity'),
      0
    )
  };
}

function bundleDiscounts(
  promo: NormalizedPromotion,
  lines: NormalizedLine[]
): Map<number, number> {
  const rule = promo.rule;
  if (rule.kind !== 'bundle') return new Map();
  const { segments, totalQuantity } = selectedSegments(
    lines,
    promo,
    'price-desc'
  );
  const groups = rule.repeat
    ? Math.floor(totalQuantity / rule.qty)
    : totalQuantity >= rule.qty
      ? 1
      : 0;
  if (groups === 0) return new Map();

  const selectedUnits = multiplySafe(groups, rule.qty, 'bundle quantity');
  const discounts = new Map<number, number>();
  forEachPackedGroup(
    segments,
    rule.qty,
    selectedUnits,
    (pieces, repetitions) => {
      const entries: WeightedCapacity[] = [];
      let baseTotal = 0;
      let floorTotal = 0;
      for (const piece of pieces) {
        const line = lines[piece.index];
        const count = multiplySafe(
          piece.quantity,
          repetitions,
          'bundle quantity'
        );
        const base = multiplySafe(line.listCents, count, 'bundle price');
        const floor = multiplySafe(line.floorCents, count, 'bundle floor');
        baseTotal = addSafe(baseTotal, base, 'bundle total');
        floorTotal = addSafe(floorTotal, floor, 'bundle floor');
        entries.push({
          index: piece.index,
          weight: base,
          capacity: base - floor
        });
      }
      const targetPrice = multiplySafe(
        rule.priceCents,
        repetitions,
        'bundle price'
      );
      const charged = Math.min(baseTotal, Math.max(floorTotal, targetPrice));
      addAllocatedDiscount(discounts, baseTotal - charged, entries);
    }
  );
  return discounts;
}

function bxgyDiscounts(
  promo: NormalizedPromotion,
  lines: NormalizedLine[]
): Map<number, number> {
  const rule = promo.rule;
  if (rule.kind !== 'bxgy') return new Map();
  const groupSize = rule.buy + rule.get;
  const order = rule.cheapestFree ? 'price-desc' : 'canonical';
  const { segments, totalQuantity } = selectedSegments(lines, promo, order);
  const groups = Math.floor(totalQuantity / groupSize);
  if (groups === 0 || rule.getPct === 0) return new Map();

  const selectedUnits = multiplySafe(groups, groupSize, 'BXGY quantity');
  const buyUnits = multiplySafe(groups, rule.buy, 'BXGY quantity');
  const rewardUnits = multiplySafe(groups, rule.get, 'BXGY quantity');
  const addCount = (map: Map<number, number>, index: number, count: number) => {
    map.set(index, addSafe(map.get(index) ?? 0, count, 'BXGY quantity'));
  };
  const countsInRange = (
    start: number,
    length: number
  ): Map<number, number> => {
    const counts = new Map<number, number>();
    let skipped = 0;
    let remaining = length;
    for (const segment of segments) {
      const end = skipped + segment.quantity;
      const overlapStart = Math.max(start, skipped);
      const overlapEnd = Math.min(start + length, end);
      if (overlapEnd > overlapStart) {
        addCount(
          counts,
          segment.index,
          Math.min(remaining, overlapEnd - overlapStart)
        );
        remaining -= Math.min(remaining, overlapEnd - overlapStart);
      }
      skipped = end;
      if (remaining === 0) break;
    }
    return counts;
  };

  // The cheapest reward units are selected from the eligible set, not merely
  // from the highest-priced prefix. On an incomplete final group, the middle
  // remainder is left at list price; complete groups still buy from the most
  // expensive end and reward from the cheapest end.
  const buyCounts = countsInRange(0, buyUnits);
  const rewardStart = rule.cheapestFree
    ? totalQuantity - rewardUnits
    : buyUnits;
  const getCounts = countsInRange(rewardStart, rewardUnits);
  const participantCounts = new Map<number, number>();
  for (const [index, count] of buyCounts)
    addCount(participantCounts, index, count);
  for (const [index, count] of getCounts)
    addCount(participantCounts, index, count);
  if (buyUnits + rewardUnits !== selectedUnits) {
    throw new Error('BXGY unit allocation does not match its complete groups');
  }

  let participantBase = 0;
  let rewardBase = 0;
  let capacity = 0;
  const entries: WeightedCapacity[] = [];
  for (const [index, count] of participantCounts) {
    const line = lines[index];
    const base = multiplySafe(line.listCents, count, 'BXGY price');
    const floor = multiplySafe(line.floorCents, count, 'BXGY floor');
    participantBase = addSafe(participantBase, base, 'BXGY total');
    capacity = addSafe(capacity, base - floor, 'BXGY floor capacity');
    entries.push({ index, weight: base, capacity: base - floor });
  }
  for (const [index, count] of getCounts) {
    rewardBase = addSafe(
      rewardBase,
      multiplySafe(lines[index].listCents, count, 'BXGY reward'),
      'BXGY reward'
    );
  }
  const requested = percentOfCents(rewardBase, rule.getPct);
  const actual = Math.min(requested, capacity, participantBase);
  const discounts = new Map<number, number>();
  addAllocatedDiscount(discounts, actual, entries);
  return discounts;
}

function linePromotionCandidates(
  promos: NormalizedPromotion[],
  lines: NormalizedLine[]
): Array<{ promo: NormalizedPromotion; discounts: Map<number, number> }> {
  const candidates: Array<{
    promo: NormalizedPromotion;
    discounts: Map<number, number>;
  }> = [];
  for (const promo of promos) {
    let discounts: Map<number, number> | null = null;
    if (promo.kind === 'item' || promo.kind === 'store') {
      discounts = new Map();
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!matchesScope(promo.scope, line)) continue;
        const discount = clampedItemDiscount(line, promo);
        if (discount > 0) discounts.set(index, discount);
      }
    } else if (promo.kind === 'bundle') {
      discounts = bundleDiscounts(promo, lines);
    } else if (promo.kind === 'bxgy') {
      discounts = bxgyDiscounts(promo, lines);
    }
    if (discounts && discounts.size) candidates.push({ promo, discounts });
  }
  return candidates;
}

interface ThresholdCandidate {
  promo: NormalizedPromotion;
  discount: number;
  discounts: Map<number, number>;
}

function thresholdCandidate(
  promo: NormalizedPromotion,
  lines: NormalizedLine[],
  rowTotals: number[]
): ThresholdCandidate | null {
  if (promo.rule.kind !== 'threshold') return null;
  const indices = lines
    .map((line, index) => (matchesScope(promo.scope, line) ? index : -1))
    .filter((index) => index >= 0);
  const subtotal = indices.reduce(
    (sum, index) => addSafe(sum, rowTotals[index], 'threshold subtotal'),
    0
  );
  if (subtotal < promo.rule.minSubtotalCents) return null;

  const requested =
    promo.rule.mode === 'off'
      ? Math.min(subtotal, promo.rule.offCents)
      : percentOfCents(subtotal, promo.rule.pct);
  const entries = indices.map((index) => {
    const line = lines[index];
    const floorTotal = multiplySafe(
      line.floorCents,
      line.quantity,
      'threshold floor'
    );
    return {
      index,
      weight: rowTotals[index],
      capacity: Math.max(0, rowTotals[index] - floorTotal)
    };
  });
  const capacity = entries.reduce(
    (sum, entry) => addSafe(sum, entry.capacity),
    0
  );
  const requestedAfterFloor = Math.min(requested, capacity);
  const discounts = allocateProportionally(requestedAfterFloor, entries);
  const discount = [...discounts.values()].reduce(
    (sum, amount) => addSafe(sum, amount),
    0
  );
  return { promo, discount, discounts };
}

function hasAnyScope(scope: NormalizedScope): boolean {
  return (
    scope.all ||
    scope.products.size > 0 ||
    scope.variants.size > 0 ||
    scope.categories.size > 0
  );
}

function bundleHint(
  promo: NormalizedPromotion,
  lines: NormalizedLine[]
): PricingHint | null {
  if (promo.rule.kind !== 'bundle') return null;
  const { totalQuantity } = selectedSegments(lines, promo, 'price-desc');
  if (!hasAnyScope(promo.scope) || totalQuantity === 0) return null;
  if (!promo.rule.repeat && totalQuantity >= promo.rule.qty) return null;
  const remainder = totalQuantity % promo.rule.qty;
  if (promo.rule.repeat && remainder === 0 && totalQuantity >= promo.rule.qty)
    return null;
  const missingQuantity =
    totalQuantity === 0
      ? promo.rule.qty
      : remainder === 0
        ? promo.rule.qty
        : promo.rule.qty - remainder;
  return {
    kind: 'bundle',
    promotionId: promo.id,
    missingQuantity,
    bundleQuantity: promo.rule.qty,
    bundlePrice: money(promo.rule.priceCents)
  };
}

function thresholdHint(
  promo: NormalizedPromotion,
  lines: NormalizedLine[],
  rowTotals: number[]
): PricingHint | null {
  if (promo.rule.kind !== 'threshold' || !hasAnyScope(promo.scope)) return null;
  const indices = lines
    .map((line, index) => (matchesScope(promo.scope, line) ? index : -1))
    .filter((index) => index >= 0);
  // A store-wide threshold may show its progress even for an empty cart. A
  // product/category threshold cannot be reached until a matching item exists.
  if (indices.length === 0 && !promo.scope.all) return null;
  const subtotal = indices.reduce(
    (sum, index) => addSafe(sum, rowTotals[index], 'threshold subtotal'),
    0
  );
  if (subtotal >= promo.rule.minSubtotalCents) return null;
  return {
    kind: 'threshold',
    promotionId: promo.id,
    amountRemaining: money(promo.rule.minSubtotalCents - subtotal),
    minSubtotal: money(promo.rule.minSubtotalCents)
  };
}

function displayBadge(promo: NormalizedPromotion): PromotionBadge {
  return {
    id: promo.id,
    name: promo.name,
    kind: promo.kind,
    endsAt: promo.endsAt
  };
}

function recordApplied(
  applied: Map<string, { promo: NormalizedPromotion; discount: number }>,
  promo: NormalizedPromotion,
  discount: number
): void {
  if (discount <= 0) return;
  const previous = applied.get(promo.id);
  if (previous)
    previous.discount = addSafe(
      previous.discount,
      discount,
      'applied promotion discount'
    );
  else applied.set(promo.id, { promo, discount });
}

/**
 * Price a cart. Row promotions compete: each row gets only the single candidate
 * that saves it the most. One order threshold may then combine with those row
 * promotions; among multiple qualifying thresholds, the largest safe saving
 * wins (ties use the promotion ID).
 */
export function priceCart(
  inputLines: readonly CartLine[],
  promos: readonly ActivePromotion[],
  ctx: PricingContext
): PriceCartResult {
  if (!Array.isArray(inputLines)) throw new TypeError('lines must be an array');
  const normalizedLines = inputLines
    .map((line, index) => normalizeLine(line, ctx?.floorOf, index))
    .sort(compareLines);
  const activePromos = normalizedPromotions(promos, ctx?.now);
  const candidates = linePromotionCandidates(activePromos, normalizedLines);
  const rowDiscounts = normalizedLines.map(() => 0);
  const rowPromotionIds = normalizedLines.map((): string | null => null);
  const rowPromotionMap = new Map<string, NormalizedPromotion>();

  for (let index = 0; index < normalizedLines.length; index++) {
    let bestDiscount = 0;
    let bestPromo: NormalizedPromotion | null = null;
    for (const candidate of candidates) {
      const discount = candidate.discounts.get(index) ?? 0;
      if (
        discount > bestDiscount ||
        (discount === bestDiscount &&
          discount > 0 &&
          bestPromo !== null &&
          compareText(candidate.promo.id, bestPromo.id) < 0)
      ) {
        bestDiscount = discount;
        bestPromo = candidate.promo;
      }
    }
    rowDiscounts[index] = bestDiscount;
    rowPromotionIds[index] = bestPromo?.id ?? null;
    if (bestPromo && bestDiscount > 0)
      rowPromotionMap.set(bestPromo.id, bestPromo);
  }

  const rowTotals = normalizedLines.map(
    (line, index) => line.listTotalCents - rowDiscounts[index]
  );
  const thresholdCandidates = activePromos
    .filter((promo) => promo.kind === 'threshold')
    .map((promo) => thresholdCandidate(promo, normalizedLines, rowTotals))
    .filter((candidate): candidate is ThresholdCandidate => candidate !== null)
    .sort(
      (a, b) => b.discount - a.discount || compareText(a.promo.id, b.promo.id)
    );
  const winningThreshold =
    thresholdCandidates.find((candidate) => candidate.discount > 0) ?? null;
  const thresholdDiscounts = normalizedLines.map(() => 0);
  if (winningThreshold) {
    for (const [index, discount] of winningThreshold.discounts)
      thresholdDiscounts[index] = discount;
  }

  const appliedMap = new Map<
    string,
    { promo: NormalizedPromotion; discount: number }
  >();
  for (let index = 0; index < normalizedLines.length; index++) {
    const id = rowPromotionIds[index];
    if (id) {
      const promo = rowPromotionMap.get(id);
      if (promo) recordApplied(appliedMap, promo, rowDiscounts[index]);
    }
  }
  if (winningThreshold)
    recordApplied(
      appliedMap,
      winningThreshold.promo,
      winningThreshold.discount
    );

  const finalLineTotalsCents = rowTotals.map(
    (rowTotal, index) => rowTotal - thresholdDiscounts[index]
  );
  const lines: PricedLine[] = normalizedLines.map((line, index) => {
    const lineTotalCents = finalLineTotalsCents[index];
    const rowPromotionId = rowPromotionIds[index];
    const thresholdPromotionId =
      thresholdDiscounts[index] > 0
        ? (winningThreshold?.promo.id ?? null)
        : null;
    const promotionIds = [rowPromotionId, thresholdPromotionId].filter(
      (id): id is string => id !== null
    );
    return {
      ...(line.lineId ? { lineId: line.lineId } : {}),
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      listPrice: money(line.listCents),
      unitPrice: lineTotalCents / CENTS_PER_UNIT / line.quantity,
      lineTotal: money(lineTotalCents),
      discount: money(line.listTotalCents - lineTotalCents),
      promotionId: rowPromotionId,
      thresholdPromotionId,
      promotionIds
    };
  });

  const subtotalCents = rowTotals.reduce(
    (sum, amount) => addSafe(sum, amount, 'subtotal'),
    0
  );
  const thresholdDiscountCents = thresholdDiscounts.reduce(
    (sum, amount) => addSafe(sum, amount, 'threshold discount'),
    0
  );
  const totalCents = finalLineTotalsCents.reduce(
    (sum, amount) => addSafe(sum, amount, 'total'),
    0
  );
  const listSubtotalCents = normalizedLines.reduce(
    (sum, line) => addSafe(sum, line.listTotalCents, 'list subtotal'),
    0
  );
  const applied = [...appliedMap.values()]
    .sort((a, b) => compareText(a.promo.id, b.promo.id))
    .map(({ promo, discount }) => ({
      promotionId: promo.id,
      name: promo.name,
      kind: promo.kind,
      discount: money(discount)
    }));
  const hints = activePromos
    .map(
      (promo) =>
        bundleHint(promo, normalizedLines) ??
        thresholdHint(promo, normalizedLines, rowTotals)
    )
    .filter((hint): hint is PricingHint => hint !== null)
    .sort((a, b) => compareText(a.promotionId, b.promotionId));

  // Keep this assertion as a runtime invariant too: order lines are the source
  // used by the sales ledger, so a cent may never appear or disappear here.
  if (
    lines.reduce(
      (sum, line) => addSafe(sum, requiredCents(line.lineTotal, 'lineTotal')),
      0
    ) !== totalCents
  ) {
    throw new Error('priced line totals do not add up to cart total');
  }
  if (
    totalCents !==
    listSubtotalCents -
      rowDiscounts.reduce((sum, d) => addSafe(sum, d), 0) -
      thresholdDiscountCents
  ) {
    throw new Error('promotion discounts do not reconcile to cart total');
  }

  return {
    lines,
    subtotal: money(subtotalCents),
    thresholdDiscount: money(thresholdDiscountCents),
    total: money(totalCents),
    applied,
    hints
  };
}

export interface PromotionProduct {
  id: PromotionId;
  price: number | null;
  categoryIds?: readonly PromotionId[];
}

export interface PromotionVariant {
  id: PromotionId;
  /** null/undefined falls back to the product price. Zero is a valid price. */
  price?: number | null;
}

/**
 * Product-card/product-page price. Cart-dependent bundle, BXGY, and threshold
 * offers are deliberately omitted; only item and store promotions have a
 * stable standalone price. Pass a floor resolver when the product's BOM floor
 * is available to the caller.
 */
export function promoPriceOf(
  product: PromotionProduct,
  variant: PromotionVariant | null | undefined,
  promos: readonly ActivePromotion[],
  now: PromotionDate,
  floorOf?: FloorOf
): PromoPrice | null {
  if (!product || typeof product !== 'object')
    throw new TypeError('product is required');
  const productId = idOf(product.id);
  if (!productId) throw new TypeError('product.id is required');
  const variantId = variant == null ? null : idOf(variant.id);
  if (variant != null && variantId === null)
    throw new TypeError('variant.id must be a string or number');
  const rawPrice = variant?.price == null ? product.price : variant.price;
  if (rawPrice == null) return null;
  const listCents = requiredCents(rawPrice, 'product price');
  const categories = Array.isArray(product.categoryIds)
    ? product.categoryIds
    : [];
  const lineInput: CartLine = {
    productId,
    variantId,
    categoryIds: categories,
    quantity: 1,
    unitPrice: money(listCents)
  };
  const line = normalizeLine(lineInput, floorOf, 0);
  const eligible = normalizedPromotions(promos, now).filter(
    (promo) =>
      (promo.kind === 'item' || promo.kind === 'store') &&
      matchesScope(promo.scope, line)
  );
  let best: { promo: NormalizedPromotion; priceCents: number } | null = null;
  for (const promo of eligible) {
    const discount = clampedItemDiscount(line, promo);
    if (discount <= 0) continue;
    const priceCents = listCents - Math.round(discount / line.quantity);
    if (
      best === null ||
      priceCents < best.priceCents ||
      (priceCents === best.priceCents &&
        compareText(promo.id, best.promo.id) < 0)
    )
      best = { promo, priceCents };
  }
  if (!best) return null;
  return {
    price: money(best.priceCents),
    listPrice: money(listCents),
    promotion: displayBadge(best.promo)
  };
}

/**
 * Would the engine accept this rule for this kind? The consent layer
 * (`$lib/shop/promoTerms`) asks before a proposal is written, so a version the
 * rikma signs is always one the engine can price.
 */
export function isValidPromotionRule(kind: PromotionKind, rule: unknown): boolean {
  return normalizeRule(kind, rule) !== null;
}

/** Public cent converter for adapters and tests; rejects invalid money values. */
export function moneyToMinorUnits(value: number): number {
  return requiredCents(value, 'money');
}
