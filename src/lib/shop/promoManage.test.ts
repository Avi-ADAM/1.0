import { describe, expect, it } from 'vitest';
import { dayToIso, draftProblems, draftReady, draftToTerms, emptyDraft, groupPromotions, hasOpenCounter, isoToDay, previewDraft } from './promoManage';
import type { ShelfProduct } from './promoTerms';

const now = new Date(2026, 9, 25, 12, 0, 0);
const shelfItem = (id: string, price: number, extra: Partial<ShelfProduct> = {}): ShelfProduct => ({
  id,
  name: `P${id}`,
  price,
  pricingMode: null,
  origin: null,
  ownerId: null,
  archived: false,
  categoryIds: [],
  variants: [],
  ...extra
});
const shelf = [shelfItem('1', 100), shelfItem('2', 50), shelfItem('3', 80, { pricingMode: 'estimated' })];
const policy = { maxPct: 20, maxDays: 14, maxDaysPerHalfYear: null, floor: 'cost' as const, kinds: ['item' as const, 'store' as const], who: { members: true as const }, arrangedDiscountPct: 10 };
const ctx = { shelf, policy, memberIds: ['7', '8'], me: '7', restimeMs: 5 * 24 * 3600_000, now };

const draft = (over: Partial<ReturnType<typeof emptyDraft>> = {}) => ({
  ...emptyDraft('item'),
  value: 15,
  products: ['1'],
  endsOn: '2026-11-01',
  ...over
});

describe('promotion wizard draft', () => {
  it('a local day is its first or last second', () => {
    expect(new Date(dayToIso('2026-11-01', 'start')!).getHours()).toBe(0);
    expect(new Date(dayToIso('2026-11-01', 'end')!).getHours()).toBe(23);
    expect(isoToDay(dayToIso('2026-11-01', 'end'))).toBe('2026-11-01');
    expect(dayToIso('soon', 'start')).toBeNull();
  });

  it('says per step what keeps it from moving on', () => {
    const p = draftProblems({ ...emptyDraft('item'), endsOn: '2026-10-01' }, now);
    expect(p.what).toEqual(['value']);
    expect(p.scope).toEqual(['noProducts']);
    expect(p.when).toEqual(['endPassed']);
    expect(draftProblems(draft({ value: 100 }), now).what).toEqual(['pctRange']);
    expect(draftProblems(draft({ itemMode: 'price', value: 120 }), now).what).toEqual([]);
    expect(draftProblems(draft({ startsOn: '2026-11-05' }), now).when).toEqual(['endBeforeStart']);
    expect(draftReady(draft(), now)).toBe(true);
  });

  it('a store-wide sale needs no products picked', () => {
    const d = { ...emptyDraft('store'), value: 10, endsOn: '2026-11-01' };
    expect(draftProblems(d, now).scope).toEqual([]);
    expect(draftToTerms(d).scope).toEqual({ all: true });
  });

  it('becomes the terms the action takes', () => {
    const t = draftToTerms(draft({ kind: 'bundle', qty: 5, price: 100, name: ' Sale ' }));
    expect(t).toMatchObject({ kind: 'bundle', name: 'Sale', rule: { qty: 5, price: 100, repeat: true }, scope: { products: ['1'] }, startsAt: null });
    expect(draftToTerms(draft({ kind: 'threshold', thresholdMode: 'off', value: 30, minSubtotal: 300 })).rule).toEqual({ minSubtotal: 300, off: 30 });
  });
});

describe('promotion preview — what the server will decide', () => {
  it('inside the envelope it goes out at once', () => {
    const p = previewDraft(draft(), ctx);
    expect(p.needsVote).toBe(false);
    expect(p.breaches).toEqual([]);
    expect(p.reaches.map((x) => x.id)).toEqual(['1']);
  });

  it('beyond it is a vote, and says what is beyond and when it can start', () => {
    const p = previewDraft(draft({ value: 30, startsOn: '2026-10-26', endsOn: '2026-11-03' }), ctx);
    expect(p.needsVote).toBe(true);
    expect(p.breaches).toEqual([{ field: 'pct', limit: 20, value: 30 }]);
    expect(p.earliest).toBe(new Date(now.getTime() + ctx.restimeMs).toISOString());
    expect(p.startsLate).toBe(true);
  });

  it('a rikma of one never votes', () => {
    expect(previewDraft(draft({ value: 60 }), { ...ctx, memberIds: ['7'] }).needsVote).toBe(false);
  });

  it('a composed product is out of reach and named as such', () => {
    const p = previewDraft(draft({ products: ['1', '3'] }), ctx);
    expect(p.blocked.map((x) => x.id)).toEqual(['3']);
    expect(p.reaches.map((x) => x.id)).toEqual(['1']);
  });
});

describe('the tab list', () => {
  it('groups by what a member does with it', () => {
    const rows = [
      { id: 'a', status: 'active' as const, decisionId: '9', decisionArchived: false, endsAt: '2026-11-10T00:00:00Z' },
      { id: 'b', status: 'paused' as const, decisionId: null, decisionArchived: false, endsAt: '2026-11-01T00:00:00Z' },
      { id: 'c', status: 'proposed' as const, decisionId: '4', decisionArchived: false, endsAt: null },
      { id: 'd', status: 'ended' as const, decisionId: null, decisionArchived: false, endsAt: null }
    ];
    const g = groupPromotions(rows);
    expect(g.live.map((r) => r.id)).toEqual(['b', 'a']);
    expect(g.proposals.map((r) => r.id)).toEqual(['c']);
    expect(g.ended.map((r) => r.id)).toEqual(['d']);
    expect(hasOpenCounter(rows[0])).toBe(true);
    expect(hasOpenCounter(rows[2])).toBe(false);
  });
});
