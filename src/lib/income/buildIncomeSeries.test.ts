import { describe, it, expect } from 'vitest';
import {
  AFTER_WORK_GRACE_DAYS,
  buildIncomeSeries,
  monthKey,
  monthRange,
  type RawPayout
} from './buildIncomeSeries.js';

let seq = 0;
const payout = (over: Partial<RawPayout> = {}): RawPayout => ({
  id: `h${seq++}`,
  amount: 100,
  confirmed: true,
  createdAt: '2025-01-15T10:00:00.000Z',
  projectId: '1',
  projectName: 'Rikma A',
  currency: '₪',
  ...over
});

describe('month helpers', () => {
  it('buckets by UTC month', () => {
    expect(monthKey(new Date('2025-03-01T00:30:00.000Z'))).toBe('2025-03');
    expect(monthKey(new Date('2025-12-31T23:59:00.000Z'))).toBe('2025-12');
  });

  it('spans years without holes', () => {
    expect(monthRange('2024-11', '2025-02')).toEqual([
      '2024-11',
      '2024-12',
      '2025-01',
      '2025-02'
    ]);
    expect(monthRange('2025-05', '2025-05')).toEqual(['2025-05']);
  });
});

describe('what counts', () => {
  it('excludes unconfirmed rows from the total and reports them as pending', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 300 }),
      payout({ amount: 200, confirmed: false })
    ]);
    expect(primary?.total).toBe(300);
    expect(primary?.pending).toEqual({ amount: 200, count: 1 });
  });

  it('excludes the site-share cut', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 300 }),
      payout({ amount: 50, isSiteShare: true })
    ]);
    expect(primary?.total).toBe(300);
  });

  it('skips rows with no amount, no date, or a non-positive amount', () => {
    const { empty } = buildIncomeSeries([
      payout({ amount: null }),
      payout({ amount: 0 }),
      payout({ amount: -20 }),
      payout({ createdAt: null }),
      payout({ createdAt: 'not a date' })
    ]);
    expect(empty).toBe(true);
  });

  it('never mixes currencies, and puts the biggest one first', () => {
    const { series, primary } = buildIncomeSeries([
      payout({ amount: 100, currency: '$' }),
      payout({ amount: 900, currency: '₪' }),
      payout({ amount: 50, currency: '$' })
    ]);
    expect(series.map((s) => s.currency)).toEqual(['₪', '$']);
    expect(primary?.total).toBe(900);
    expect(series[1].total).toBe(150);
  });
});

describe('the monthly series', () => {
  it('fills empty months so the axis is continuous, and accumulates', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 100, createdAt: '2025-01-10T00:00:00.000Z' }),
      payout({ amount: 300, createdAt: '2025-04-02T00:00:00.000Z' })
    ]);
    expect(primary?.months.map((m) => m.month)).toEqual([
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04'
    ]);
    expect(primary?.months.map((m) => m.total)).toEqual([100, 0, 0, 300]);
    expect(primary?.months.map((m) => m.cumulative)).toEqual([100, 100, 100, 400]);
    expect(primary?.monthsSpanned).toBe(4);
    expect(primary?.monthsPaid).toBe(2);
    expect(primary?.avgPerMonth).toBe(100);
  });

  it('splits a month across the rikmas that paid it', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 100, projectId: '1', projectName: 'A' }),
      payout({ amount: 250, projectId: '2', projectName: 'B' })
    ]);
    expect(primary?.months[0].byRikma).toEqual({ '1': 100, '2': 250 });
    expect(primary?.concurrentPeak).toBe(2);
    expect(primary?.bestMonth?.total).toBe(350);
  });

  it('ranks rikmas by what they paid, with shares that sum to one', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 100, projectId: '1', projectName: 'A' }),
      payout({ amount: 300, projectId: '2', projectName: 'B' })
    ]);
    expect(primary?.rikmas.map((r) => r.name)).toEqual(['B', 'A']);
    expect(primary?.rikmas.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 10);
    expect(primary?.rikmas[0].payouts).toBe(1);
  });

  it('buckets a payout with no rikma rather than dropping it', () => {
    const { primary } = buildIncomeSeries([
      payout({ amount: 100, projectId: null, projectName: null })
    ]);
    expect(primary?.total).toBe(100);
    expect(primary?.rikmas).toHaveLength(1);
  });
});

describe('fruit after the work', () => {
  const day = 86_400_000;
  const workedAt = '2025-01-31T00:00:00.000Z';
  const after = (days: number) =>
    new Date(new Date(workedAt).getTime() + days * day).toISOString();

  it('counts only what arrived well after the last logged work', () => {
    const { primary } = buildIncomeSeries(
      [
        payout({ amount: 100, createdAt: after(AFTER_WORK_GRACE_DAYS - 1) }),
        payout({ amount: 400, createdAt: after(AFTER_WORK_GRACE_DAYS + 60) })
      ],
      [{ projectId: '1', finish: workedAt }]
    );
    expect(primary?.afterWorkTotal).toBe(400);
    expect(primary?.afterWorkShare).toBeCloseTo(0.8, 10);
    expect(primary?.rikmas[0].lastWorkAt).toBe(workedAt);
  });

  it('claims nothing when no work was ever logged for the rikma', () => {
    const { primary } = buildIncomeSeries([payout({ amount: 500, createdAt: after(400) })], []);
    expect(primary?.afterWorkTotal).toBe(0);
    expect(primary?.rikmas[0].lastWorkAt).toBeNull();
  });

  it('uses the latest work log per rikma, not the first', () => {
    const { primary } = buildIncomeSeries(
      [payout({ amount: 100, createdAt: after(45) })],
      [
        { projectId: '1', finish: '2024-01-01T00:00:00.000Z' },
        { projectId: '1', finish: after(40) }
      ]
    );
    expect(primary?.afterWorkTotal).toBe(0);
  });

  it('keeps rikmas apart — work in one does not date a payout from another', () => {
    const { primary } = buildIncomeSeries(
      [payout({ amount: 100, projectId: '2', projectName: 'B', createdAt: after(400) })],
      [{ projectId: '1', finish: after(390) }]
    );
    expect(primary?.afterWorkTotal).toBe(0);
  });
});

describe('empty state', () => {
  it('reports empty for no rows at all', () => {
    const summary = buildIncomeSeries([]);
    expect(summary.empty).toBe(true);
    expect(summary.primary).toBeNull();
    expect(summary.series).toEqual([]);
  });

  it('is not empty when the only money is still pending', () => {
    const summary = buildIncomeSeries([payout({ amount: 90, confirmed: false })]);
    expect(summary.empty).toBe(false);
    expect(summary.primary?.total).toBe(0);
    expect(summary.primary?.pending.amount).toBe(90);
    expect(summary.primary?.months).toEqual([]);
  });
});
