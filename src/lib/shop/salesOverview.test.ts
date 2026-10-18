import { describe, expect, it } from 'vitest';
import {
  chartSeries,
  filterByStage,
  holderState,
  newestFirst,
  productTotals,
  saleStage,
  salesYears,
  stageShares,
  stageSummary,
  type SaleLike
} from './salesOverview';

let n = 0;
const sale = (attrs: Partial<SaleLike['attributes']> & { in: number }): SaleLike & { name: string } => ({
  id: String(++n),
  name: 'p',
  attributes: { date: '2026-10-18T10:00:00', ...attrs }
});

describe('saleStage / holderState', () => {
  it('reads split before vote, vote before waiting', () => {
    expect(saleStage(sale({ in: 1, splited: true, pending: true }))).toBe('split');
    expect(saleStage(sale({ in: 1, pending: true }))).toBe('voting');
    expect(saleStage(sale({ in: 1 }))).toBe('waiting');
  });
  it('tells silence from an explicit yes, and null from everything', () => {
    expect(holderState(sale({ in: 1, holderStatus: 'self' }))).toBe('self');
    expect(holderState(sale({ in: 1, holderStatus: 'open' }))).toBe('open');
    expect(holderState(sale({ in: 1, holderStatus: 'confirmed', confirmedBy: 'timeout' }))).toBe('timeout');
    expect(holderState(sale({ in: 1, holderStatus: 'confirmed', confirmedBy: 'holder' }))).toBe('confirmed');
    expect(holderState(sale({ in: 1, holderStatus: null }))).toBe('legacy');
  });
});

describe('stageSummary / stageShares', () => {
  const sales = [
    sale({ in: 6540, splited: true }),
    sale({ in: 860, pending: true }),
    sale({ in: 3000 }),
    sale({ in: 960, holderStatus: 'open' })
  ];
  it('buckets every sale once; waiting + voting is everything not yet split', () => {
    const s = stageSummary(sales);
    expect(s.split).toEqual({ amount: 6540, count: 1 });
    expect(s.voting).toEqual({ amount: 860, count: 1 });
    expect(s.waiting).toEqual({ amount: 3960, count: 2 });
    expect(s.total).toEqual({ amount: 11360, count: 4 });
  });
  it('bar widths sum to 100', () => {
    const w = stageShares(stageSummary(sales));
    expect(w.split + w.voting + w.waiting).toBeCloseTo(100);
    expect(w.waiting).toBeCloseTo((3960 / 11360) * 100);
  });
  it('nothing sold draws nothing (no NaN widths)', () => {
    expect(stageShares(stageSummary([]))).toEqual({ split: 0, voting: 0, waiting: 0 });
  });
  it('a string amount from the API still adds up', () => {
    expect(stageSummary([sale({ in: '12.5' as unknown as number })]).waiting.amount).toBe(12.5);
  });
});

describe('filterByStage / newestFirst', () => {
  it('filters by stage and keeps all for "all"', () => {
    const xs = [sale({ in: 1, pending: true }), sale({ in: 2 })];
    expect(filterByStage(xs, 'voting')).toHaveLength(1);
    expect(filterByStage(xs, 'all')).toHaveLength(2);
  });
  it('sorts newest first and sends a dateless sale to the end', () => {
    const a = sale({ in: 1, date: '2026-01-01T00:00:00' });
    const b = sale({ in: 2, date: null });
    const c = sale({ in: 3, date: '2026-05-01T00:00:00' });
    expect(newestFirst([a, b, c]).map((s) => s.attributes.in)).toEqual([3, 1, 2]);
  });
});

describe('chartSeries', () => {
  const sales = [
    sale({ in: 100, date: '2026-10-18T09:00:00' }),
    sale({ in: 50, date: '2026-10-18T20:00:00' }),
    sale({ in: 20, date: '2026-10-15T12:00:00' }),
    sale({ in: 999, date: '2026-09-01T12:00:00' }),
    sale({ in: 7, date: '2024-03-03T12:00:00' }),
    sale({ in: 5, date: null })
  ];
  it('daily: the last N days with the empty ones', () => {
    const s = chartSeries(sales, 'daily', { today: '2026-10-18T23:00:00', days: 7 });
    expect(s.map((p) => p.key)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18'
    ]);
    expect(s.at(-1)?.total).toBe(150);
    expect(s[3].total).toBe(20);
  });
  it('monthly: twelve months of the chosen year', () => {
    const s = chartSeries(sales, 'monthly', { year: 2026 });
    expect(s).toHaveLength(12);
    expect(s[8]).toEqual({ key: '2026-09', total: 999 });
    expect(s[9]).toEqual({ key: '2026-10', total: 170 });
  });
  it('yearly: first year to last, gaps as zero', () => {
    expect(chartSeries(sales, 'yearly')).toEqual([
      { key: '2024', total: 7 },
      { key: '2025', total: 0 },
      { key: '2026', total: 1169 }
    ]);
  });
  it('yearly with no dated sale is empty', () => {
    expect(chartSeries([sale({ in: 5, date: null })], 'yearly')).toEqual([]);
  });
  it('salesYears lists the years newest first', () => {
    expect(salesYears(sales)).toEqual([2026, 2024]);
  });
});

describe('productTotals', () => {
  it('sums by name, largest first, with a share of the whole', () => {
    const xs = [
      { ...sale({ in: 300 }), name: 'stool' },
      { ...sale({ in: 100 }), name: 'board' },
      { ...sale({ in: 100 }), name: 'stool' }
    ];
    const r = productTotals(xs, (s) => s.name);
    expect(r).toEqual([
      { name: 'stool', amount: 400, share: 0.8 },
      { name: 'board', amount: 100, share: 0.2 }
    ]);
  });
});
