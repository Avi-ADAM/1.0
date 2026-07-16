import { describe, expect, it } from 'vitest';
import { computeCoverage, type CoverageInput } from './computeCoverage';
import { buildDonationNote } from './parseDonationNote';

function base(overrides: Partial<CoverageInput> = {}): CoverageInput {
  return {
    finishedMissions: [],
    sales: [],
    halukas: [],
    openMissions: [],
    ...overrides
  };
}

describe('computeCoverage', () => {
  it('returns zeros on an empty project', () => {
    const r = computeCoverage(base());
    expect(r.doneValue).toBe(0);
    expect(r.incomeTotal).toBe(0);
    expect(r.coverageRatio).toBe(0);
    expect(r.missions).toEqual([]);
    expect(r.supporters).toEqual([]);
  });

  it('values done work by total, falling back to hours × rate', () => {
    const r = computeCoverage(
      base({
        finishedMissions: [
          { total: 500 },
          { total: null, noofhours: 10, perhour: 80 },
          { total: 0, noofhours: 2, perhour: 50 } // total=0 ⇒ fallback
        ]
      })
    );
    expect(r.doneValue).toBe(500 + 800 + 100);
  });

  it('splits income by source and only counts effective sales', () => {
    const r = computeCoverage(
      base({
        sales: [
          { in: 100, note: buildDonationNote({ via: 'page', from: 'רות' }) },
          { in: 250, hasProduct: true, holderStatus: 'self' },
          { in: 40, note: 'site-share · paid=40', holderStatus: 'confirmed' },
          { in: 999, note: buildDonationNote({ via: 'manual' }), holderStatus: 'open' },
          { in: 60 } // legacy, no note, no product ⇒ other income
        ]
      })
    );
    expect(r.donationIncome).toBe(100);
    expect(r.productIncome).toBe(250);
    expect(r.otherIncome).toBe(100); // 40 site-share + 60 legacy
    expect(r.incomeTotal).toBe(450);
    // The open (unconsented) donation is not on the wall either.
    expect(r.supporters).toHaveLength(1);
    expect(r.supporters[0].name).toBe('רות');
  });

  it('computes coverage ratio clamped to 1', () => {
    const covered = computeCoverage(
      base({
        finishedMissions: [{ total: 200 }],
        sales: [{ in: 500, note: buildDonationNote({ via: 'page' }) }]
      })
    );
    expect(covered.coverageRatio).toBe(1);

    const partial = computeCoverage(
      base({
        finishedMissions: [{ total: 1000 }],
        sales: [{ in: 250, note: buildDonationNote({ via: 'page' }) }]
      })
    );
    expect(partial.coverageRatio).toBe(0.25);
  });

  it('covers the backlog before funding future missions', () => {
    const r = computeCoverage(
      base({
        finishedMissions: [{ total: 300 }], // backlog 300 (nothing paid out)
        sales: [{ in: 500, note: buildDonationNote({ via: 'page' }) }],
        openMissions: [
          { id: 'a', name: 'A', noofhours: 2, perhour: 50 }, // 100 ⇒ funded
          { id: 'b', name: 'B', noofhours: 4, perhour: 50 } // 200 > remaining 100
        ]
      })
    );
    expect(r.backlog).toBe(300);
    expect(r.availableForFuture).toBe(200);
    expect(r.missions.map((m) => m.funded)).toEqual([true, false]);
  });

  it('paid-out halukas shrink both backlog and pool', () => {
    const r = computeCoverage(
      base({
        finishedMissions: [{ total: 300 }],
        sales: [{ in: 500, note: buildDonationNote({ via: 'page' }) }],
        halukas: [
          { amount: 300, confirmed: true },
          { amount: 999, confirmed: false } // unconfirmed ⇒ ignored
        ],
        openMissions: [{ id: 'a', noofhours: 4, perhour: 50 }] // 200
      })
    );
    expect(r.paidOut).toBe(300);
    expect(r.backlog).toBe(0);
    expect(r.pool).toBe(200);
    expect(r.availableForFuture).toBe(200);
    expect(r.missions[0].funded).toBe(true);
  });

  it('splits planned value by assignment and never funds zero-value missions', () => {
    const r = computeCoverage(
      base({
        sales: [{ in: 1000, note: buildDonationNote({ via: 'page' }) }],
        openMissions: [
          { id: 'a', noofhours: 3, perhour: 100, assigned: true },
          { id: 'b', noofhours: 5, perhour: 100 },
          { id: 'c' } // no hours/rate yet
        ]
      })
    );
    expect(r.plannedAssignedValue).toBe(300);
    expect(r.plannedOpenValue).toBe(500);
    expect(r.missions.map((m) => m.funded)).toEqual([true, true, false]);
  });

  it('orders supporters newest first, keeping anonymous entries', () => {
    const r = computeCoverage(
      base({
        sales: [
          {
            in: 50,
            date: '2026-01-01',
            note: buildDonationNote({ via: 'page', from: 'א' })
          },
          { in: 70, date: '2026-03-01', note: buildDonationNote({ via: 'manual' }) },
          {
            in: 90,
            date: '2026-02-01',
            note: buildDonationNote({ via: 'page', from: 'ב', msg: 'בהצלחה' })
          }
        ]
      })
    );
    expect(r.supporters.map((s) => s.amount)).toEqual([70, 90, 50]);
    expect(r.supporters[0].name).toBeNull();
    expect(r.supporters[1].msg).toBe('בהצלחה');
  });
});
