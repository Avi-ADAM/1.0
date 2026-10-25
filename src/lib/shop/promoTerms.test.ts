import { describe, expect, it } from 'vitest';
import {
  PAUSE_HOLD_MS,
  approvedStatus,
  effectiveWindow,
  envelopeBreaches,
  isNoDiscount,
  listPricesOf,
  maxEffectivePct,
  promoIneligible,
  promoNeedsRikma,
  shelfInScope,
  type ShelfProduct,
  nextPromoStatus,
  normalizePromoPolicy,
  normalizePromoTerms,
  promoDays,
  promoPolicyJson,
  type PromoTerms
} from './promoTerms';

const NOW = new Date('2026-11-01T10:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

function terms(over: Record<string, unknown> = {}): PromoTerms {
  const r = normalizePromoTerms(
    { kind: 'item', scope: { products: ['5'] }, rule: { pct: 15 }, startsAt: day(1), endsAt: day(8), ...over },
    NOW
  );
  if (!r.ok) throw new Error(r.error);
  return r.terms;
}

describe('normalizePromoTerms', () => {
  it('keeps a valid item promotion and drops keys its rule does not carry', () => {
    const t = terms({ rule: { pct: '15', qty: 3 }, name: '  סוף עונה ' });
    expect(t.rule).toEqual({ pct: 15 });
    expect(t.name).toBe('סוף עונה');
    expect(t.scope).toEqual({ products: ['5'] });
  });

  it('refuses a promotion without an end — that is a price change', () => {
    const r = normalizePromoTerms({ kind: 'item', scope: { products: ['5'] }, rule: { pct: 10 } }, NOW);
    expect(r.ok).toBe(false);
  });

  it('refuses an end in the past and an end before the start', () => {
    expect(normalizePromoTerms({ kind: 'item', scope: { all: true }, rule: { pct: 10 }, endsAt: day(-1) }, NOW).ok).toBe(false);
    expect(
      normalizePromoTerms({ kind: 'item', scope: { all: true }, rule: { pct: 10 }, startsAt: day(5), endsAt: day(3) }, NOW).ok
    ).toBe(false);
  });

  it('refuses a rule the engine could not price', () => {
    expect(normalizePromoTerms({ kind: 'item', scope: { all: true }, rule: { pct: 10, price: 5 }, endsAt: day(2) }, NOW).ok).toBe(false);
    expect(normalizePromoTerms({ kind: 'bundle', scope: { all: true }, rule: { qty: 0, price: 100 }, endsAt: day(2) }, NOW).ok).toBe(false);
  });

  it('a store or threshold promotion with no scope is about the whole shop', () => {
    const r = normalizePromoTerms({ kind: 'store', rule: { pct: 10 }, endsAt: day(2) }, NOW);
    expect(r.ok && r.terms.scope).toEqual({ all: true });
  });

  it('an item promotion needs something in scope', () => {
    expect(normalizePromoTerms({ kind: 'item', scope: {}, rule: { pct: 10 }, endsAt: day(2) }, NOW).ok).toBe(false);
  });

  it('caps are whole numbers above zero', () => {
    expect(normalizePromoTerms({ kind: 'store', rule: { pct: 10 }, endsAt: day(2), capUnits: -3 }, NOW).ok).toBe(false);
    const r = normalizePromoTerms({ kind: 'store', rule: { pct: 10 }, endsAt: day(2), capUnits: '40' }, NOW);
    expect(r.ok && r.terms.capUnits).toBe(40);
  });
});

describe('isNoDiscount', () => {
  it('a counter of 0% is "no promotion", not a veto', () => {
    expect(isNoDiscount(terms({ rule: { pct: 0 } }))).toBe(true);
    expect(isNoDiscount(terms())).toBe(false);
  });
});

describe('maxEffectivePct', () => {
  it('reads a percentage directly', () => {
    expect(maxEffectivePct(terms())).toBe(15);
  });
  it('a fixed price needs the list prices, and takes the deepest cut', () => {
    const t = terms({ rule: { price: 80 } });
    expect(maxEffectivePct(t)).toBeNull();
    expect(maxEffectivePct(t, [100, 90])).toBe(20);
  });
  it('a bundle counts over the dearest items in scope', () => {
    const t = terms({ kind: 'bundle', rule: { qty: 5, price: 100 } });
    expect(maxEffectivePct(t, [25, 30])).toBe(33.33);
  });
  it('"1+1" is 50%', () => {
    expect(maxEffectivePct(terms({ kind: 'bxgy', rule: { buy: 1, get: 1, getPct: 100 } }))).toBe(50);
  });
  it('a threshold ₪-off is measured against its minimum', () => {
    expect(maxEffectivePct(terms({ kind: 'threshold', scope: { all: true }, rule: { minSubtotal: 300, off: 30 } }))).toBe(10);
  });
});

describe('promoPolicy', () => {
  it('null is legacy — no envelope at all', () => {
    expect(normalizePromoPolicy(null)).toBeNull();
    expect(envelopeBreaches(terms(), null, { now: NOW })).toEqual([{ field: 'noPolicy' }]);
  });

  it('round-trips the stored shape', () => {
    const p = normalizePromoPolicy({ maxPct: 20, maxDays: 14, kinds: ['item', 'store', 'nope'], who: 'roles:4,9', arrangedDiscountPct: 10 })!;
    expect(p.kinds).toEqual(['item', 'store']);
    expect(p.who).toEqual({ roles: ['4', '9'] });
    expect(p.floor).toBe('cost');
    expect(promoPolicyJson(p)).toMatchObject({ who: 'roles:4,9', maxPct: 20 });
  });
});

describe('envelopeBreaches', () => {
  const policy = normalizePromoPolicy({ maxPct: 20, maxDays: 14, kinds: ['item', 'store'] })!;

  it('inside the envelope: nothing to vote on', () => {
    expect(envelopeBreaches(terms(), policy, { now: NOW })).toEqual([]);
  });

  it('names every field that goes beyond', () => {
    const t = terms({ kind: 'bxgy', rule: { buy: 1, get: 1, getPct: 100 }, endsAt: day(30) });
    const fields = envelopeBreaches(t, policy, { now: NOW }).map((b) => b.field);
    expect(fields).toEqual(['kind', 'pct', 'days']);
  });

  it('an unknown depth is never "inside"', () => {
    const b = envelopeBreaches(terms({ rule: { price: 80 } }), policy, { now: NOW });
    expect(b).toEqual([{ field: 'pct', limit: 20, value: null }]);
  });

  it('a role-limited envelope asks whether the proposer holds the role', () => {
    const roles = normalizePromoPolicy({ maxPct: 20, maxDays: 14, who: 'roles:4' })!;
    expect(envelopeBreaches(terms(), roles, { now: NOW, actorRoleIds: ['7'] })).toEqual([{ field: 'who' }]);
    expect(envelopeBreaches(terms(), roles, { now: NOW, actorRoleIds: ['4'] })).toEqual([]);
  });
});

describe('effectiveWindow (D2)', () => {
  it('a version approved before its start keeps both dates', () => {
    const w = effectiveWindow(terms(), NOW);
    expect(w.startsAt).toBe(day(1));
    expect(approvedStatus(w, NOW)).toBe('scheduled');
  });

  it('a version approved late starts at approval — and its end does not move', () => {
    const late = new Date(day(3));
    const w = effectiveWindow(terms(), late);
    expect(w.startsAt).toBe(late.toISOString());
    expect(w.endsAt).toBe(day(8));
    expect(approvedStatus(w, late)).toBe('active');
  });

  it('a version approved after its end never runs', () => {
    const w = effectiveWindow(terms(), new Date(day(9)));
    expect(w.expired).toBe(true);
    expect(approvedStatus(w, new Date(day(9)))).toBe('ended');
  });

  it('promoDays counts from when it would start', () => {
    expect(promoDays(terms(), NOW)).toBe(7);
    expect(promoDays(terms({ startsAt: null }), NOW)).toBe(8);
  });
});

describe('shelf', () => {
  const p = (id: string, over: Partial<ShelfProduct> = {}): ShelfProduct => ({
    id,
    name: `p${id}`,
    price: 100,
    pricingMode: 'fixed',
    origin: 'project',
    ownerId: null,
    archived: false,
    categoryIds: [],
    variants: [],
    ...over
  });

  it('pool, quote and wish products are out of reach (§2)', () => {
    expect(promoIneligible(p('1', { pricingMode: 'estimated' }))).toBe('pool');
    expect(promoIneligible(p('1', { pricingMode: 'quote' }))).toBe('quote');
    expect(promoIneligible(p('1', { origin: 'wish' }))).toBe('wish');
    expect(promoIneligible(p('1', { price: null }))).toBe('noPrice');
    expect(promoIneligible(p('1', { price: null, variants: [{ id: '9', price: 40 }] }))).toBeNull();
    expect(promoIneligible(p('1', { pricingMode: null }))).toBeNull();
  });

  it('a scope reaches by product, variant or category, minus exclusions', () => {
    const shelf = [p('1'), p('2', { categoryIds: ['7'] }), p('3', { variants: [{ id: '30', price: 50 }] })];
    expect(shelfInScope({ products: ['1'], categories: ['7'] }, shelf).map((x) => x.id)).toEqual(['1', '2']);
    expect(shelfInScope({ variants: ['30'] }, shelf).map((x) => x.id)).toEqual(['3']);
    expect(shelfInScope({ all: true, exclude: ['2'] }, shelf).map((x) => x.id)).toEqual(['1', '3']);
    expect(listPricesOf(shelf)).toEqual([100, 100, 50]);
  });

  it('only my own personal products, or a rikma of one, need nobody (§3.2)', () => {
    const mine = [p('1', { origin: 'personal', ownerId: '7' })];
    expect(promoNeedsRikma({ products: ['1'] }, mine, '7', ['7', '8'])).toBe(false);
    expect(promoNeedsRikma({ all: true }, mine, '7', ['7', '8'])).toBe(true);
    expect(promoNeedsRikma({ products: ['1'] }, [p('1')], '7', ['7', '8'])).toBe(true);
    expect(promoNeedsRikma({ all: true }, [p('1')], '7', ['7'])).toBe(false);
  });
});

describe('nextPromoStatus', () => {
  const row = {
    status: 'scheduled',
    startsAt: day(1),
    endsAt: day(8),
    pausedAt: null,
    capUnits: null,
    capOrders: null,
    usedUnits: 0,
    usedOrders: 0
  };

  it('scheduled → active at its start', () => {
    expect(nextPromoStatus(row, NOW)).toBeNull();
    expect(nextPromoStatus(row, new Date(day(1)))).toEqual({ status: 'active' });
  });

  it('active → ended at its end, or when the cap is used up', () => {
    expect(nextPromoStatus({ ...row, status: 'active' }, new Date(day(8)))).toEqual({ status: 'ended', endedReason: 'time' });
    expect(nextPromoStatus({ ...row, status: 'active', capUnits: 10, usedUnits: 10 }, new Date(day(2)))).toEqual({
      status: 'ended',
      endedReason: 'cap'
    });
  });

  it('the emergency pause holds 24 hours, then the promotion runs again (D3)', () => {
    const pausedAt = day(2);
    const paused = { ...row, status: 'paused', pausedAt };
    expect(nextPromoStatus(paused, new Date(Date.parse(pausedAt) + PAUSE_HOLD_MS - 1))).toBeNull();
    expect(nextPromoStatus(paused, new Date(Date.parse(pausedAt) + PAUSE_HOLD_MS))).toEqual({ status: 'active' });
  });

  it('a pause with a counter open waits for the counter, not the clock', () => {
    const paused = { ...row, status: 'paused', pausedAt: day(2), counterOpen: true };
    expect(nextPromoStatus(paused, new Date(day(4)))).toBeNull();
  });

  it('proposed and ended rows are not the clock’s', () => {
    expect(nextPromoStatus({ ...row, status: 'proposed' }, new Date(day(9)))).toBeNull();
    expect(nextPromoStatus({ ...row, status: 'ended' }, new Date(day(9)))).toBeNull();
  });
});
