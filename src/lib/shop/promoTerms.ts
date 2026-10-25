/**
 * The consent half of a shop promotion (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3–4).
 *
 * `$lib/shop/promotions` decides what a buyer pays; this module decides what
 * the rikma is being asked to agree to, and whether it has already agreed:
 *
 *   normalizePromoTerms  — one version of a promotion (a `negopromo` round):
 *                          kind, scope, rule, dates, caps. A version the engine
 *                          cannot price is refused here, before anyone signs it.
 *   normalizePromoPolicy — the rikma's envelope (`Project.promoPolicy`). null =
 *                          legacy = no envelope: every promotion is a proposal.
 *   envelopeBreaches     — what in a version goes beyond the envelope. Empty =
 *                          it goes out at once, with a notice; anything else is
 *                          a vote, and the card says exactly what is beyond.
 *   effectiveWindow      — a version that matured after its start begins at
 *                          maturation; its end does not move (D2).
 *   nextPromoStatus      — the clock: scheduled → active → ended, and the
 *                          24-hour emergency pause that resumes on its own (D3).
 *
 * Pure. The writes live in `$lib/server/promotions/`.
 */
import { isValidPromotionRule, type PromotionKind, type PromotionScope, type PromotionStatus } from './promotions';

export const PROMO_KINDS: readonly PromotionKind[] = ['item', 'bundle', 'bxgy', 'store', 'threshold'];

/** The emergency brake holds this long, then the promotion runs again unless a counter is open (D3). */
export const PAUSE_HOLD_MS = 24 * 3600_000;

const MAX_NAME = 80;
const MAX_IDS = 200;
const DAY_MS = 24 * 3600_000;

export interface PromoTerms {
  kind: PromotionKind;
  name: string | null;
  scope: PromotionScope;
  rule: Record<string, number | boolean>;
  /** null = as soon as it is approved. */
  startsAt: string | null;
  /** Always set — a promotion with no end is a price change, and belongs to `editObject`. */
  endsAt: string;
  capUnits: number | null;
  capOrders: number | null;
  perOrderMax: number | null;
}

export interface PromoPolicy {
  maxPct: number;
  maxDays: number;
  maxDaysPerHalfYear: number | null;
  floor: 'cost' | 'none';
  kinds: PromotionKind[];
  /** "members", or the roles allowed to launch inside the envelope. */
  who: { members: true } | { roles: string[] };
  /** H8 — a deal arranged in a conversation may go this far below catalog before the rikma is asked. */
  arrangedDiscountPct: number;
}

/** Not a discriminated union: the project typechecks without strictNullChecks, which would not narrow one. */
export interface PromoTermsResult {
  ok: boolean;
  terms: PromoTerms | null;
  error: string | null;
}

const refuse = (error: string): PromoTermsResult => ({ ok: false, terms: null, error });

const ids = (v: unknown): string[] =>
  Array.isArray(v)
    ? [...new Set(v.map((x) => String(x ?? '').trim()).filter((x) => /^\d{1,12}$/.test(x)))].slice(0, MAX_IDS)
    : [];

const posInt = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : NaN;
};

const iso = (v: unknown): string | null | undefined => {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Only the keys a rule of this kind carries — anything else is dropped, never stored. */
function ruleOf(kind: PromotionKind, raw: unknown): Record<string, number | boolean> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const keys: Record<PromotionKind, string[]> = {
    item: ['pct', 'price', 'off'],
    store: ['pct'],
    bundle: ['qty', 'price', 'repeat'],
    bxgy: ['buy', 'get', 'getPct', 'cheapestFree'],
    threshold: ['minSubtotal', 'off', 'pct']
  };
  const out: Record<string, number | boolean> = {};
  for (const k of keys[kind]) {
    const v = r[k];
    if (v == null || v === '') continue;
    if (k === 'repeat' || k === 'cheapestFree') out[k] = v === true || v === 'true';
    else out[k] = Number(v);
  }
  return isValidPromotionRule(kind, out) ? out : null;
}

function scopeOf(kind: PromotionKind, raw: unknown): PromotionScope | null {
  const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const scope: PromotionScope = {};
  if (s.all === true) scope.all = true;
  const products = ids(s.products);
  const variants = ids(s.variants);
  const categories = ids(s.categories);
  const exclude = ids(s.exclude);
  if (products.length) scope.products = products;
  if (variants.length) scope.variants = variants;
  if (categories.length) scope.categories = categories;
  if (exclude.length) scope.exclude = exclude;
  // A store-wide or a cart-wide promotion with no narrower scope is about everything.
  if ((kind === 'store' || kind === 'threshold') && !scope.all && !products.length && !variants.length && !categories.length) {
    scope.all = true;
  }
  if (!scope.all && !products.length && !variants.length && !categories.length) return null;
  return scope;
}

/**
 * One version of a promotion. `now` is when it is proposed: an end that has
 * already passed is not a version anyone can agree to.
 */
export function normalizePromoTerms(raw: unknown, now: Date): PromoTermsResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return refuse('terms must be an object');
  const t = raw as Record<string, unknown>;
  const kind = t.kind as PromotionKind;
  if (!PROMO_KINDS.includes(kind)) return refuse('kind must be item, bundle, bxgy, store or threshold');

  const name = typeof t.name === 'string' && t.name.trim() ? t.name.trim() : null;
  if (name && name.length > MAX_NAME) return refuse(`name is up to ${MAX_NAME} characters`);

  const scope = scopeOf(kind, t.scope);
  if (!scope) return refuse('scope names no product, variant or category');
  const rule = ruleOf(kind, t.rule);
  if (!rule) return refuse(`rule is not a valid ${kind} rule`);

  const startsAt = iso(t.startsAt);
  const endsAt = iso(t.endsAt);
  if (startsAt === undefined) return refuse('startsAt is not a date');
  if (!endsAt) return refuse('endsAt is required — a promotion without an end is a price change');
  if (Date.parse(endsAt) <= now.getTime()) return refuse('endsAt has already passed');
  if (startsAt && Date.parse(endsAt) <= Date.parse(startsAt)) return refuse('endsAt must be after startsAt');

  const capUnits = posInt(t.capUnits);
  const capOrders = posInt(t.capOrders);
  const perOrderMax = posInt(t.perOrderMax);
  if ([capUnits, capOrders, perOrderMax].some((n) => Number.isNaN(n))) {
    return refuse('caps are whole numbers above zero');
  }

  return { ok: true, error: null, terms: { kind, name, scope, rule, startsAt, endsAt, capUnits, capOrders, perOrderMax } };
}

/** "No promotion at all" is a counter of discount 0 — never a veto (§3.3). */
export function isNoDiscount(terms: Pick<PromoTerms, 'kind' | 'rule'>): boolean {
  const r = terms.rule;
  if (terms.kind === 'item') return r.pct === 0 || r.off === 0;
  if (terms.kind === 'store') return r.pct === 0;
  if (terms.kind === 'bxgy') return r.getPct === 0;
  if (terms.kind === 'threshold') return r.pct === 0 || r.off === 0;
  return false;
}

export function normalizePromoPolicy(raw: unknown): PromoPolicy | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  const pct = (v: unknown, dflt: number) => {
    const n = Number(v);
    return v == null || v === '' || !Number.isFinite(n) ? dflt : Math.min(100, Math.max(0, n));
  };
  const days = (v: unknown) => {
    const n = Number(v);
    return v == null || v === '' || !Number.isFinite(n) ? null : Math.max(1, Math.floor(n));
  };
  const kinds = Array.isArray(p.kinds) ? (p.kinds.filter((k) => PROMO_KINDS.includes(k as PromotionKind)) as PromotionKind[]) : [...PROMO_KINDS];
  const whoRaw = typeof p.who === 'string' ? p.who.trim() : 'members';
  const roles = whoRaw.startsWith('roles:') ? ids(whoRaw.slice(6).split(',')) : [];
  return {
    maxPct: pct(p.maxPct, 0),
    maxDays: days(p.maxDays) ?? 1,
    maxDaysPerHalfYear: days(p.maxDaysPerHalfYear),
    floor: p.floor === 'none' ? 'none' : 'cost',
    kinds: [...new Set(kinds)],
    who: roles.length ? { roles } : { members: true },
    arrangedDiscountPct: pct(p.arrangedDiscountPct, 0)
  };
}

/** The stored shape — the `who` string the plan documents. */
export function promoPolicyJson(p: PromoPolicy): Record<string, unknown> {
  return {
    maxPct: p.maxPct,
    maxDays: p.maxDays,
    ...(p.maxDaysPerHalfYear != null ? { maxDaysPerHalfYear: p.maxDaysPerHalfYear } : {}),
    floor: p.floor,
    kinds: p.kinds,
    who: 'roles' in p.who ? `roles:${p.who.roles.join(',')}` : 'members',
    arrangedDiscountPct: p.arrangedDiscountPct
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The deepest effective discount a version can give one line, in percent.
 * `listPrices` are the catalog prices of what is in scope; a fixed price or a
 * ₪-off rule needs them, and without them the answer is null (unknown — which
 * an envelope never treats as "inside").
 *
 * Bundles and "buy X get Y" count over their group, as a buyer reads them:
 * "1+1" is 50%, and "5 for ₪100" over five of the dearest items in scope.
 */
export function maxEffectivePct(terms: Pick<PromoTerms, 'kind' | 'rule'>, listPrices: readonly number[] = []): number | null {
  const r = terms.rule as Record<string, number>;
  const lists = listPrices.filter((p) => Number.isFinite(p) && p > 0);
  const hi = lists.length ? Math.max(...lists) : null;
  switch (terms.kind) {
    case 'store':
      return round2(r.pct);
    case 'item':
      if (r.pct != null) return round2(r.pct);
      if (!lists.length) return null;
      if (r.price != null) return round2(Math.max(0, ...lists.map((l) => (1 - r.price / l) * 100)));
      return round2(Math.min(100, Math.max(...lists.map((l) => (r.off / l) * 100))));
    case 'bundle':
      if (hi == null) return null;
      return round2(Math.max(0, (1 - r.price / (r.qty * hi)) * 100));
    case 'bxgy':
      return round2((r.getPct * r.get) / (r.buy + r.get));
    case 'threshold':
      if (r.pct != null) return round2(r.pct);
      return r.minSubtotal > 0 ? round2(Math.min(100, (r.off / r.minSubtotal) * 100)) : null;
  }
}

/** Whole days a version runs, from when it would start. */
export function promoDays(terms: Pick<PromoTerms, 'startsAt' | 'endsAt'>, from: Date): number {
  const start = Math.max(from.getTime(), terms.startsAt ? Date.parse(terms.startsAt) : from.getTime());
  return Math.max(1, Math.ceil((Date.parse(terms.endsAt) - start) / DAY_MS));
}

export type Breach =
  | { field: 'noPolicy' }
  | { field: 'kind'; value: PromotionKind }
  | { field: 'pct'; limit: number; value: number | null }
  | { field: 'days'; limit: number; value: number }
  | { field: 'who' };

/**
 * What in this version goes beyond what the rikma agreed to once (§3.4).
 * Empty = inside: it goes out at once and the rikma is told. A role list in
 * `who` asks whether the proposer holds one of those roles (`actorRoleIds`).
 */
export function envelopeBreaches(
  terms: PromoTerms,
  policy: PromoPolicy | null,
  ctx: { now: Date; listPrices?: readonly number[]; actorRoleIds?: readonly string[] }
): Breach[] {
  if (!policy) return [{ field: 'noPolicy' }];
  const out: Breach[] = [];
  if (!policy.kinds.includes(terms.kind)) out.push({ field: 'kind', value: terms.kind });
  const pct = maxEffectivePct(terms, ctx.listPrices);
  if (pct == null || pct > policy.maxPct) out.push({ field: 'pct', limit: policy.maxPct, value: pct });
  const days = promoDays(terms, ctx.now);
  if (days > policy.maxDays) out.push({ field: 'days', limit: policy.maxDays, value: days });
  if ('roles' in policy.who) {
    const mine = new Set(ctx.actorRoleIds ?? []);
    if (!policy.who.roles.some((r) => mine.has(r))) out.push({ field: 'who' });
  }
  return out;
}

/**
 * When a version actually runs once it is approved at `approvedAt` (D2): never
 * before the approval, and its end stays where the rikma agreed to put it — a
 * slow vote does not stretch a holiday sale past the holiday.
 */
export function effectiveWindow(
  terms: Pick<PromoTerms, 'startsAt' | 'endsAt'>,
  approvedAt: Date
): { startsAt: string; endsAt: string; expired: boolean } {
  const start = Math.max(approvedAt.getTime(), terms.startsAt ? Date.parse(terms.startsAt) : 0);
  const end = Date.parse(terms.endsAt);
  return { startsAt: new Date(start).toISOString(), endsAt: terms.endsAt, expired: end <= start };
}

/** The status an approved version starts in. */
export function approvedStatus(window: { startsAt: string; expired: boolean }, now: Date): PromotionStatus {
  if (window.expired) return 'ended';
  return Date.parse(window.startsAt) > now.getTime() ? 'scheduled' : 'active';
}

/** The earliest a version proposed now can start, if it needs a vote: after the rikma's clock. */
export function earliestStart(now: Date, restimeMs: number): string {
  return new Date(now.getTime() + restimeMs).toISOString();
}

/** One product of the rikma's shelf, as the consent layer needs it. */
export interface ShelfProduct {
  id: string;
  name: string;
  price: number | null;
  pricingMode: string | null;
  origin: string | null;
  ownerId: string | null;
  archived: boolean;
  categoryIds: string[];
  variants: { id: string; price: number | null }[];
}

export type Ineligible = 'pool' | 'quote' | 'wish' | 'archived' | 'noPrice';

/**
 * Can a promotion touch this product (§2)? A composed (pool / estimated)
 * product already passes its savings to the participants, a quote has no
 * catalog price to cut, and a wish deal's price is the customer's signature.
 */
export function promoIneligible(p: ShelfProduct): Ineligible | null {
  if (p.archived) return 'archived';
  if (p.origin === 'wish') return 'wish';
  if (p.pricingMode === 'estimated') return 'pool';
  if (p.pricingMode === 'quote') return 'quote';
  if (p.price == null && !p.variants.some((v) => v.price != null)) return 'noPrice';
  return null;
}

/** The products of the shelf a scope reaches (exclusions honoured), eligible or not. */
export function shelfInScope(scope: PromotionScope, shelf: readonly ShelfProduct[]): ShelfProduct[] {
  const set = (v?: readonly (string | number)[]) => new Set((v ?? []).map(String));
  const products = set(scope.products);
  const variants = set(scope.variants);
  const categories = set(scope.categories);
  const exclude = set(scope.exclude);
  return shelf.filter(
    (p) =>
      !exclude.has(p.id) &&
      (scope.all === true ||
        products.has(p.id) ||
        p.variants.some((v) => variants.has(v.id)) ||
        p.categoryIds.some((c) => categories.has(c)))
  );
}

/** Catalog prices in scope — what a fixed-price or a ₪-off rule is measured against. */
export function listPricesOf(products: readonly ShelfProduct[]): number[] {
  return products.flatMap((p) => {
    const vs = p.variants.map((v) => v.price).filter((x): x is number => x != null);
    return vs.length ? vs : p.price != null ? [p.price] : [];
  });
}

/**
 * Who signs (§3.2) — derived, never chosen. A promotion only on the proposer's
 * own personal products, or in a rikma of one, touches nobody else's income.
 */
export function promoNeedsRikma(
  scope: PromotionScope,
  inScope: readonly ShelfProduct[],
  actorId: string,
  memberIds: readonly string[]
): boolean {
  if (memberIds.filter((m) => m !== actorId).length === 0) return false;
  const named = !scope.all && !scope.categories?.length;
  return !(named && inScope.length > 0 && inScope.every((p) => p.origin === 'personal' && p.ownerId === actorId));
}

export interface PromoClockRow {
  status: PromotionStatus | string | null;
  startsAt: string | null;
  endsAt: string | null;
  pausedAt: string | null;
  capUnits: number | null;
  capOrders: number | null;
  usedUnits: number | null;
  usedOrders: number | null;
  /** A counter-proposal is open on it — a paused promotion then waits for that, not for the clock. */
  counterOpen?: boolean;
}

export type PromoTransition = { status: 'active' } | { status: 'ended'; endedReason: 'time' | 'cap' };

/** What the clock moves a promotion to now, or null when nothing changes. */
export function nextPromoStatus(row: PromoClockRow, now: Date): PromoTransition | null {
  const t = now.getTime();
  const ended = row.endsAt != null && Date.parse(row.endsAt) <= t;
  const capped =
    (row.capUnits != null && (row.usedUnits ?? 0) >= row.capUnits) ||
    (row.capOrders != null && (row.usedOrders ?? 0) >= row.capOrders);
  switch (row.status) {
    case 'scheduled':
      if (ended) return { status: 'ended', endedReason: 'time' };
      if (!row.startsAt || Date.parse(row.startsAt) <= t) return { status: 'active' };
      return null;
    case 'active':
      if (ended) return { status: 'ended', endedReason: 'time' };
      if (capped) return { status: 'ended', endedReason: 'cap' };
      return null;
    case 'paused': {
      if (ended) return { status: 'ended', endedReason: 'time' };
      if (row.counterOpen) return null;
      const since = row.pausedAt ? Date.parse(row.pausedAt) : NaN;
      return Number.isFinite(since) && since + PAUSE_HOLD_MS <= t ? { status: 'active' } : null;
    }
    default:
      return null;
  }
}
