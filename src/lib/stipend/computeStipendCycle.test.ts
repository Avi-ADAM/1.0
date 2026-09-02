import { describe, it, expect } from 'vitest';
import { computeStipendCycle, cycleWindow, settlementFrom } from './computeStipendCycle.js';

const terms = { mode: 'equity' as const, costShare: 1, equityMultiplier: 1, stipendRate: 50 };
const cycleStart = '2026-03-01T00:00:00.000Z';
const cycleEnd = '2026-03-31T23:59:59.999Z';

describe('computeStipendCycle', () => {
  it('pays the approved hours in the window at the pledge rate', () => {
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved: [
        { hours: 30, approvedAt: '2026-03-04T10:00:00.000Z' },
        { hours: 12, approvedAt: '2026-03-28T10:00:00.000Z' }
      ]
    });
    expect(r.hours).toBe(42);
    expect(r.amount).toBe(2_100);
    expect(r.cappedBy).toBeNull();
  });

  it('ignores hours approved outside the cycle window', () => {
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved: [
        { hours: 40, approvedAt: '2026-02-20T10:00:00.000Z' },
        { hours: 10, approvedAt: '2026-03-10T10:00:00.000Z' },
        { hours: 25, approvedAt: '2026-04-02T10:00:00.000Z' }
      ]
    });
    expect(r.hours).toBe(10);
    expect(r.amount).toBe(500);
  });

  it('honours a singleMission scope', () => {
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      missionIds: ['7'],
      approved: [
        { hours: 10, approvedAt: '2026-03-10T10:00:00.000Z', mesimabetahalichId: '7' },
        { hours: 40, approvedAt: '2026-03-11T10:00:00.000Z', mesimabetahalichId: '9' }
      ]
    });
    expect(r.hours).toBe(10);
  });

  it('caps at the monthly ceiling and says so', () => {
    const r = computeStipendCycle({
      terms: { ...terms, monthlyCap: 1_500 },
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }]
    });
    expect(r.gross).toBe(2_100);
    expect(r.amount).toBe(1_500);
    expect(r.cappedBy).toBe('monthlyCap');
  });

  it('the total cap is the automatic ending — the last cycle exhausts it', () => {
    const r = computeStipendCycle({
      terms: { ...terms, totalCap: 10_000 },
      cycleStart,
      cycleEnd,
      paidTotal: 9_000,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }]
    });
    expect(r.amount).toBe(1_000);
    expect(r.cappedBy).toBe('totalCap');
    expect(r.remainingAfter).toBe(0);
    expect(r.exhausts).toBe(true);
  });

  it('the tightest of pledge and program budgets binds', () => {
    const r = computeStipendCycle({
      terms: { ...terms, totalCap: 10_000, monthlyCap: 2_000 },
      cycleStart,
      cycleEnd,
      paidTotal: 0,
      programRemaining: 800,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }]
    });
    expect(r.amount).toBe(800);
    expect(r.cappedBy).toBe('programCap');
    expect(r.exhausts).toBe(true);
  });

  it('is zero — not negative — when nothing was approved', () => {
    const r = computeStipendCycle({ terms, cycleStart, cycleEnd, approved: [] });
    expect(r.hours).toBe(0);
    expect(r.amount).toBe(0);
    expect(r.exhausts).toBe(false);
  });
});

describe('cycleWindow', () => {
  it('returns the calendar month containing the reference date', () => {
    const w = cycleWindow('2026-03-14T08:00:00.000Z');
    expect(w.cycleStart).toBe('2026-03-01T00:00:00.000Z');
    expect(w.cycleEnd.startsWith('2026-03-31T23:59:59')).toBe(true);
  });

  it('stretches back over a multi-month cycle', () => {
    const w = cycleWindow('2026-03-14T08:00:00.000Z', 3);
    expect(w.cycleStart).toBe('2026-01-01T00:00:00.000Z');
    expect(w.cycleEnd.startsWith('2026-03-31')).toBe(true);
  });
});

// ── Regressions from the live run of 2026-09-02 (docs/FIXES.md) ─────────────

describe('computeStipendCycle — hours another pledge already metered', () => {
  it('does not pay twice for hours a second pledge already covered', () => {
    const approved = [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }];
    const first = computeStipendCycle({ terms, cycleStart, cycleEnd, approved });
    expect(first.hours).toBe(42);

    const second = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved,
      hoursAlreadyMetered: first.hours
    });
    expect(second.hours).toBe(0);
    expect(second.amount).toBe(0);
  });

  it('pays only the remainder when a pledge covered part of the hours', () => {
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }],
      hoursAlreadyMetered: 30
    });
    expect(r.hours).toBe(12);
    expect(r.amount).toBe(600);
  });

  it('never goes negative when more was metered than approved', () => {
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved: [{ hours: 5, approvedAt: '2026-03-04T10:00:00.000Z' }],
      hoursAlreadyMetered: 99
    });
    expect(r.hours).toBe(0);
    expect(r.amount).toBe(0);
  });
});

describe('computeStipendCycle — the recipient’s equity floor', () => {
  it('caps the payment so the recipient’s own contribution cannot go negative', () => {
    // 42h approved ⇒ ₪2,100 gross, but only ₪500 of contribution is left to
    // give up, and α=1 means every shekel paid takes a shekel of equity.
    const r = computeStipendCycle({
      terms,
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }],
      equityHeadroom: 500
    });
    expect(r.amount).toBe(500);
    expect(r.cappedBy).toBe('equityFloor');
  });

  it('scales the ceiling by α — half the cost carried is twice the payment', () => {
    const r = computeStipendCycle({
      terms: { ...terms, costShare: 0.5 },
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }],
      equityHeadroom: 500
    });
    expect(r.amount).toBe(1_000);
  });

  it('does not bind when the rikma carries the whole cost (α = 0)', () => {
    const r = computeStipendCycle({
      terms: { ...terms, costShare: 0 },
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }],
      equityHeadroom: 0
    });
    expect(r.amount).toBe(2_100);
    expect(r.cappedBy).toBeNull();
  });

  it('does not bind on a gift — nothing touches the percentages', () => {
    const r = computeStipendCycle({
      terms: { ...terms, mode: 'gift' as const },
      cycleStart,
      cycleEnd,
      approved: [{ hours: 42, approvedAt: '2026-03-04T10:00:00.000Z' }],
      equityHeadroom: 0
    });
    expect(r.amount).toBe(2_100);
  });
});

describe('settlementFrom', () => {
  it('reads from the last settlement, not the start of the calendar month', () => {
    // The bug: `lastSettledAt` was the cycle *end*, so hours approved later in
    // the month fell after the watermark and before the next window.
    expect(
      settlementFrom({ lastSettledAt: '2026-03-15T09:00:00.000Z', start: null }, cycleStart)
    ).toBe('2026-03-15T09:00:00.000Z');
  });

  it('carries an unsettled earlier month forward instead of dropping it', () => {
    // Settled in February, now paying in March: February's unpaid approvals
    // are still owed, so the window opens at the watermark.
    expect(
      settlementFrom({ lastSettledAt: '2026-02-10T09:00:00.000Z', start: null }, cycleStart)
    ).toBe('2026-02-10T09:00:00.000Z');
  });

  it('never reaches back before the pledge itself began', () => {
    expect(
      settlementFrom({ lastSettledAt: null, start: '2026-03-20T00:00:00.000Z' }, cycleStart)
    ).toBe('2026-03-20T00:00:00.000Z');
  });

  it('falls back to the window when the pledge carries no dates', () => {
    expect(settlementFrom({ lastSettledAt: null, start: null }, cycleStart)).toBe(cycleStart);
  });
});
