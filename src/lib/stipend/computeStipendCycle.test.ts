import { describe, it, expect } from 'vitest';
import { computeStipendCycle, cycleWindow } from './computeStipendCycle.js';

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
