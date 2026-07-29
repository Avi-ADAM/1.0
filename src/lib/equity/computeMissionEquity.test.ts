import { describe, expect, it } from 'vitest';
import {
  computeEquityScenarios,
  computeEquityHorizons,
  computeMonthlyIncome,
  summarize,
  formatSharePct,
  type ProjectValueSummary
} from './computeMissionEquity';

const emptySummary: ProjectValueSummary = {
  currentValue: 0,
  approvedInProgressValue: 0,
  openPipelineValue: 0,
  recurringMonthlyValue: 0,
  monthlyIncomeEstimate: null,
  monthlyIncomeSource: null
};

function byMonths(horizons: ReturnType<typeof computeEquityHorizons>) {
  return {
    y1: horizons.find((h) => h.months === 12)!,
    y2: horizons.find((h) => h.months === 24)!,
    y5: horizons.find((h) => h.months === 60)!
  };
}

function byBaseline(scenarios: ReturnType<typeof computeEquityScenarios>) {
  return {
    current: scenarios.find((s) => s.baseline === 'current')!,
    approved: scenarios.find((s) => s.baseline === 'approved')!,
    pipeline: scenarios.find((s) => s.baseline === 'pipeline')!
  };
}

describe('computeEquityScenarios', () => {
  it('empty rikma → mission is 100% of every baseline', () => {
    const s = byBaseline(computeEquityScenarios(emptySummary, 500));
    expect(s.current.sharePct).toBe(100);
    expect(s.approved.sharePct).toBe(100);
    expect(s.pipeline.sharePct).toBe(100);
  });

  it('current scenario dilutes against currentValue + V', () => {
    const summary = { ...emptySummary, currentValue: 1500 };
    // 500 / (1500 + 500) = 25%
    const s = byBaseline(computeEquityScenarios(summary, 500));
    expect(s.current.base).toBe(2000);
    expect(s.current.sharePct).toBeCloseTo(25, 5);
  });

  it('approved & pipeline baselines grow the denominator', () => {
    const summary: ProjectValueSummary = {
      currentValue: 1000,
      approvedInProgressValue: 1000,
      openPipelineValue: 2000,
      recurringMonthlyValue: 0,
      monthlyIncomeEstimate: null,
      monthlyIncomeSource: null
    };
    const s = byBaseline(computeEquityScenarios(summary, 1000)); // alreadyCountedIn 'none'
    // current : 1000/(1000+1000)=50
    // approved: 1000/(1000+1000+1000)=33.33
    // pipeline: 1000/(1000+1000+2000+1000)=20
    expect(s.current.sharePct).toBeCloseTo(50, 5);
    expect(s.approved.sharePct).toBeCloseTo(33.333, 2);
    expect(s.pipeline.sharePct).toBeCloseTo(20, 5);
  });

  it('missionValue 0 / negative / NaN → 0% share, no crash', () => {
    const summary = { ...emptySummary, currentValue: 1000 };
    expect(byBaseline(computeEquityScenarios(summary, 0)).current.sharePct).toBe(0);
    expect(byBaseline(computeEquityScenarios(summary, -50)).current.sharePct).toBe(0);
    expect(byBaseline(computeEquityScenarios(summary, NaN)).current.sharePct).toBe(0);
  });

  it("alreadyCountedIn:'pipeline' — lev card mission not double-counted in pipeline", () => {
    const summary: ProjectValueSummary = {
      currentValue: 0,
      approvedInProgressValue: 0,
      openPipelineValue: 1000, // the mission itself is one of these
      recurringMonthlyValue: 0,
      monthlyIncomeEstimate: null,
      monthlyIncomeSource: null
    };
    const s = byBaseline(computeEquityScenarios(summary, 1000, { alreadyCountedIn: 'pipeline' }));
    // pipeline base = 0 + 0 + 1000 (+0, already counted) → 1000/1000 = 100%
    expect(s.pipeline.base).toBe(1000);
    expect(s.pipeline.sharePct).toBe(100);
    // current still adds V (mission not in currentValue): 1000/(0+1000)=100
    expect(s.current.base).toBe(1000);
  });

  it("alreadyCountedIn:'approved' — in-progress mission not double-counted", () => {
    const summary: ProjectValueSummary = {
      currentValue: 1000,
      approvedInProgressValue: 1000, // includes the mission
      openPipelineValue: 0,
      recurringMonthlyValue: 0,
      monthlyIncomeEstimate: null,
      monthlyIncomeSource: null
    };
    const s = byBaseline(computeEquityScenarios(summary, 1000, { alreadyCountedIn: 'approved' }));
    // approved base = 1000 + 1000 (+0) = 2000 → 1000/2000 = 50%
    expect(s.approved.base).toBe(2000);
    expect(s.approved.sharePct).toBeCloseTo(50, 5);
    // current still adds V: 1000/(1000+1000)=50
    expect(s.current.base).toBe(2000);
  });

  it('monotonicity: current ≥ approved ≥ pipeline share', () => {
    const summary: ProjectValueSummary = {
      currentValue: 800,
      approvedInProgressValue: 600,
      openPipelineValue: 400,
      recurringMonthlyValue: 0,
      monthlyIncomeEstimate: null,
      monthlyIncomeSource: null
    };
    const s = byBaseline(computeEquityScenarios(summary, 300));
    expect(s.current.sharePct).toBeGreaterThanOrEqual(s.approved.sharePct);
    expect(s.approved.sharePct).toBeGreaterThanOrEqual(s.pipeline.sharePct);
  });

  it('monthlyEstimate = sharePct × monthlyIncomeEstimate when present', () => {
    const summary: ProjectValueSummary = { ...emptySummary, currentValue: 1000, monthlyIncomeEstimate: 4000 };
    const s = byBaseline(computeEquityScenarios(summary, 1000)); // current 50%
    expect(s.current.sharePct).toBeCloseTo(50, 5);
    expect(s.current.monthlyEstimate).toBeCloseTo(2000, 5);
  });

  it('monthlyEstimate is null when no income estimate', () => {
    const s = byBaseline(computeEquityScenarios({ ...emptySummary, currentValue: 1000 }, 1000));
    expect(s.current.monthlyEstimate).toBeNull();
  });
});

describe('computeEquityHorizons', () => {
  it('returns nothing for a non-recurring mission', () => {
    expect(computeEquityHorizons(emptySummary, 0)).toEqual([]);
    expect(computeEquityHorizons(emptySummary, -100)).toEqual([]);
    expect(computeEquityHorizons(emptySummary, NaN)).toEqual([]);
  });

  it('offers 1, 2 and 5 years', () => {
    expect(computeEquityHorizons(emptySummary, 1000).map((h) => h.months)).toEqual([12, 24, 60]);
  });

  it('accrues the mission month by month against a rikma that also grows', () => {
    // Rikma: 120,000 banked, 24,000/month of recurring work (the joiner's
    // 6,000 is not part of it yet), no one-off work in progress.
    const summary: ProjectValueSummary = {
      ...emptySummary,
      currentValue: 120_000,
      approvedInProgressValue: 24_000,
      recurringMonthlyValue: 24_000
    };
    const h = byMonths(computeEquityHorizons(summary, 6000)); // alreadyCountedIn 'none'
    // after 12: 72,000 / (120,000 + 30,000×12) = 72,000 / 480,000 = 15%
    expect(h.y1.cumulativeValue).toBe(72_000);
    expect(h.y1.base).toBe(480_000);
    expect(h.y1.sharePct).toBeCloseTo(15, 5);
    // after 60: 360,000 / (120,000 + 30,000×60) = 360,000 / 1,920,000 = 18.75%
    expect(h.y5.sharePct).toBeCloseTo(18.75, 5);
  });

  it('grows with the horizon but converges below the share of the monthly flow', () => {
    const summary: ProjectValueSummary = {
      ...emptySummary,
      currentValue: 120_000,
      approvedInProgressValue: 24_000,
      recurringMonthlyValue: 24_000
    };
    const h = byMonths(computeEquityHorizons(summary, 6000));
    expect(h.y1.sharePct).toBeLessThan(h.y2.sharePct);
    expect(h.y2.sharePct).toBeLessThan(h.y5.sharePct);
    // ceiling = 6,000 / 30,000 = 20% — never reached, only approached.
    expect(h.y5.sharePct).toBeLessThan(20);
  });

  it("does not double-count a mission that is already one of the rikma's recurring ones", () => {
    const summary: ProjectValueSummary = {
      ...emptySummary,
      currentValue: 120_000,
      approvedInProgressValue: 30_000,
      recurringMonthlyValue: 30_000
    };
    const mine = computeEquityHorizons(summary, 6000, { alreadyCountedIn: 'approved' });
    const asJoiner = computeEquityHorizons(
      { ...summary, approvedInProgressValue: 24_000, recurringMonthlyValue: 24_000 },
      6000
    );
    // Same rikma either way — 30,000/month of recurring work including mine.
    expect(byMonths(mine).y1.base).toBe(byMonths(asJoiner).y1.base);
  });

  it('adds one-off in-progress work once, not every month', () => {
    const summary: ProjectValueSummary = {
      ...emptySummary,
      currentValue: 100_000,
      approvedInProgressValue: 50_000, // 40,000 one-off + 10,000/month recurring
      recurringMonthlyValue: 10_000
    };
    const h = byMonths(computeEquityHorizons(summary, 5000));
    // base(12) = 100,000 + 40,000 + (10,000+5,000)×12 = 320,000
    expect(h.y1.base).toBe(320_000);
    // base(24) grows by exactly 12 more months of flow, not by the one-off again.
    expect(h.y2.base - h.y1.base).toBe(15_000 * 12);
  });

  it('a lone recurring mission in a fresh rikma owns all of it', () => {
    const h = byMonths(computeEquityHorizons(emptySummary, 5000));
    expect(h.y1.sharePct).toBe(100);
    expect(h.y5.sharePct).toBe(100);
  });

  it('scales the ₪/month estimate by the projected share', () => {
    const summary: ProjectValueSummary = {
      ...emptySummary,
      currentValue: 120_000,
      approvedInProgressValue: 24_000,
      recurringMonthlyValue: 24_000,
      monthlyIncomeEstimate: 10_000
    };
    const h = byMonths(computeEquityHorizons(summary, 6000));
    expect(h.y1.sharePct).toBeCloseTo(15, 5);
    expect(h.y1.monthlyEstimate).toBeCloseTo(1500, 5); // 15% of 10,000
    expect(h.y5.monthlyEstimate).toBeCloseTo(1875, 5); // 18.75% of 10,000
  });
});

describe('summarize', () => {
  it('folds a raw payload treating missing/null numbers as 0', () => {
    const raw = {
      finnished_missions: {
        data: [{ attributes: { total: 500 } }, { attributes: { total: null } }, null]
      },
      rikmashes: { data: [{ attributes: { total: 200 } }] },
      mesimabetahaliches: {
        data: [{ attributes: { hoursassinged: 10, perhour: 50 } }, { attributes: { hoursassinged: null, perhour: 50 } }]
      },
      open_missions: { data: [{ attributes: { noofhours: 4, perhour: 100 } }] }
    };
    const summary = summarize(raw);
    expect(summary.currentValue).toBe(700); // 500 + 200
    expect(summary.approvedInProgressValue).toBe(500); // 10*50 + 0
    expect(summary.openPipelineValue).toBe(400); // 4*100
    expect(summary.monthlyIncomeEstimate).toBeNull();
  });

  it('handles a null / empty payload', () => {
    const summary = summarize(null);
    expect(summary.currentValue).toBe(0);
    expect(summary.approvedInProgressValue).toBe(0);
    expect(summary.openPipelineValue).toBe(0);
    expect(summary.recurringMonthlyValue).toBe(0);
  });

  it('splits the recurring (iskvua) slice out of the in-progress bucket', () => {
    const summary = summarize({
      mesimabetahaliches: {
        data: [
          { attributes: { hoursassinged: 10, perhour: 100, iskvua: true } }, // 1,000/month
          { attributes: { hoursassinged: 20, perhour: 100, iskvua: false } }, // 2,000 one-off
          { attributes: { hoursassinged: 5, perhour: 100 } } // missing flag ⇒ one-off
        ]
      }
    });
    expect(summary.approvedInProgressValue).toBe(3500);
    expect(summary.recurringMonthlyValue).toBe(1000);
  });
});

describe('computeMonthlyIncome (phase 4)', () => {
  const now = new Date('2026-07-15T00:00:00Z');
  const salesColl = (rows: Array<{ in: number; date: string | null; holderStatus?: string | null }>) => ({
    data: rows.map((attributes) => ({ attributes }))
  });
  const matanotColl = (rows: Array<{ price: number; kindOf: string }>) => ({
    data: rows.map((attributes) => ({ attributes }))
  });

  it('trailing average of effective sales over the window', () => {
    const r = computeMonthlyIncome(
      salesColl([
        { in: 600, date: '2026-07-10', holderStatus: 'self' },
        { in: 600, date: '2026-06-10', holderStatus: 'confirmed' }
      ]),
      null,
      now
    );
    // first sale month Jun → divide by 2 (Jun, Jul): 1200/2 = 600
    expect(r.source).toBe('sales');
    expect(r.estimate).toBeCloseTo(600, 5);
  });

  it("excludes 'open' sales; null/self/confirmed count", () => {
    const openOnly = computeMonthlyIncome(
      salesColl([{ in: 1000, date: '2026-07-10', holderStatus: 'open' }]),
      null,
      now
    );
    expect(openOnly.estimate).toBeNull();

    const nullLegacy = computeMonthlyIncome(
      salesColl([{ in: 300, date: '2026-07-01', holderStatus: null }]),
      null,
      now
    );
    expect(nullLegacy.source).toBe('sales');
    expect(nullLegacy.estimate).toBeCloseTo(300, 5); // Jul only → /1
  });

  it('young rikma divides by months since first sale, not the full window', () => {
    const r = computeMonthlyIncome(
      salesColl([{ in: 900, date: '2026-06-15', holderStatus: 'self' }]),
      null,
      now
    );
    expect(r.estimate).toBeCloseTo(450, 5); // Jun+Jul = 2 months
  });

  it('falls back to monthly commitments when no recent income', () => {
    const r = computeMonthlyIncome(
      salesColl([{ in: 5000, date: '2025-01-01', holderStatus: 'self' }]), // before window
      matanotColl([{ price: 200, kindOf: 'monthly' }]),
      now
    );
    expect(r.source).toBe('commitments');
    expect(r.estimate).toBeCloseTo(200, 5);
  });

  it('commitments: monthly→price, yearly→price/12, others ignored', () => {
    const r = computeMonthlyIncome(
      null,
      matanotColl([
        { price: 100, kindOf: 'monthly' },
        { price: 1200, kindOf: 'yearly' },
        { price: 50, kindOf: 'total' }
      ]),
      now
    );
    expect(r.source).toBe('commitments');
    expect(r.estimate).toBeCloseTo(200, 5); // 100 + 1200/12
  });

  it('null when there is neither income nor commitments', () => {
    expect(computeMonthlyIncome(null, null, now)).toEqual({ estimate: null, source: null });
  });
});

describe('summarize (phase 4 income)', () => {
  it('populates monthlyIncomeEstimate and source with an injected now', () => {
    const summary = summarize(
      {
        finnished_missions: { data: [{ attributes: { total: 1000 } }] },
        sales: { data: [{ attributes: { in: 600, date: '2026-07-01', holderStatus: 'self' } }] }
      },
      new Date('2026-07-15T00:00:00Z')
    );
    expect(summary.currentValue).toBe(1000);
    expect(summary.monthlyIncomeEstimate).toBeCloseTo(600, 5);
    expect(summary.monthlyIncomeSource).toBe('sales');
  });
});

describe('formatSharePct', () => {
  it('floors tiny non-zero shares to <0.1%', () => {
    expect(formatSharePct(0.02)).toBe('<0.1%');
  });
  it('renders 0 and non-finite as 0%', () => {
    expect(formatSharePct(0)).toBe('0%');
    expect(formatSharePct(NaN)).toBe('0%');
  });
  it('shows one decimal otherwise', () => {
    expect(formatSharePct(25)).toBe('25.0%');
    expect(formatSharePct(33.333)).toBe('33.3%');
    expect(formatSharePct(100)).toBe('100.0%');
  });
});
