import { describe, it, expect } from 'vitest';
import { comparePanui, summarizeComparisons } from './panuiCompare.js';

const NOW = new Date('2026-04-10T00:00:00Z');

function sp(attrs: Record<string, any> = {}, id: string | number = 3) {
  return {
    id,
    attributes: {
      name: 'רכב',
      kindOf: 'rent',
      panui: true,
      users_permissions_user: { data: { id: 7 } },
      ...attrs
    }
  };
}

function booking(attrs: Record<string, any> = {}) {
  return {
    id: '1',
    start: '2026-04-01T00:00:00.000Z',
    end: '2026-05-01T00:00:00.000Z',
    quantity: 1,
    status: 'confirmed',
    ...attrs
  };
}

describe('comparePanui', () => {
  it('agrees when a free resource is offered', () => {
    const row = comparePanui(sp(), [], { now: NOW });
    expect(row.verdict).toBe('agree');
    expect(row.derivedFree).toBe(true);
    expect(row.visibleToday).toBe(true);
  });

  it('flags the stale lock — panui:false on a resource the ledger frees', () => {
    // The booking ended in February; nothing ever set panui back to true.
    const row = comparePanui(sp({ panui: false }), [
      booking({ start: '2026-01-01T00:00:00.000Z', end: '2026-02-01T00:00:00.000Z', status: 'done' })
    ], { now: NOW });
    expect(row.verdict).toBe('staleLocked');
    expect(row.derivedFree).toBe(true);
    expect(row.holdingBookings).toBe(0);
  });

  it('flags the dangerous direction — offered today, taken in the ledger', () => {
    const row = comparePanui(sp({ panui: true, fdate: '2026-04-20T00:00:00.000Z' }), [
      booking({ start: '2026-04-01T00:00:00.000Z', end: null })
    ], { now: NOW });
    expect(row.verdict).toBe('overOffered');
    expect(row.derivedFree).toBe(false);
    expect(row.holdingBookings).toBe(1);
  });

  it('reads a null panui the way the live filters do — as offered', () => {
    const row = comparePanui(sp({ panui: null }), [], { now: NOW });
    expect(row.panui).toBeNull();
    expect(row.visibleToday).toBe(true);
    expect(row.verdict).toBe('agree');
  });

  it('never blames an unlimited resource', () => {
    const row = comparePanui(sp({ availability: 'unlimited', panui: false }), [
      booking({ end: null })
    ], { now: NOW });
    expect(row.model).toBe('unlimited');
    expect(row.derivedFree).toBe(true);
    expect(row.verdict).toBe('staleLocked');
  });

  it('derives the possession model from kindOf while the field is null', () => {
    expect(comparePanui(sp({ kindOf: 'perUnit', hm: 5 }), [], { now: NOW }).model).toBe('pooled');
    expect(comparePanui(sp({ kindOf: 'total' }), [], { now: NOW }).model).toBe('consumable');
  });

  it('keeps a pool available while it still has units', () => {
    const row = comparePanui(sp({ kindOf: 'perUnit', capacity: 3, panui: true }), [
      booking({ quantity: 1, end: null })
    ], { now: NOW });
    expect(row.derivedFree).toBe(true);
    expect(row.verdict).toBe('agree');
  });

  it('says when a taken resource frees up', () => {
    const row = comparePanui(sp({ panui: true }), [
      booking({ start: '2026-04-01T00:00:00.000Z', end: '2026-04-20T00:00:00.000Z' })
    ], { now: NOW });
    // Free after the booking ends, so it is not "taken" outright.
    expect(row.derivedFree).toBe(true);
    expect(row.nextFreeFrom).toBeNull();
  });

  it('leaves the reason empty while the ledger says free', () => {
    const row = comparePanui(sp(), [], { now: NOW });
    expect(row.reason).toBeNull();
  });

  it('names a real conflict `bookedOut`', () => {
    const row = comparePanui(sp({ panui: true, fdate: '2026-04-20T00:00:00.000Z' }), [
      booking({ start: '2026-04-01T00:00:00.000Z', end: null })
    ], { now: NOW });
    expect(row.reason).toBe('bookedOut');
    expect(row.offerEndsAt).toBe('2026-04-20T00:00:00.000Z');
  });

  it('names an expired offer for what it is, with no booking to blame', () => {
    // The seeded 2022 rows: fdate = sdate + two years, long past, panui still true.
    const row = comparePanui(
      sp({ kindOf: 'total', sdate: '2022-05-13T00:00:00.000Z', fdate: '2024-05-13T00:00:00.000Z' }),
      [],
      { now: NOW }
    );
    expect(row.verdict).toBe('overOffered');
    expect(row.reason).toBe('offerWindowEnded');
    expect(row.holdingBookings).toBe(0);
  });

  it('separates a backwards window from an expiry — an epoch fdate is a data bug', () => {
    const row = comparePanui(
      sp({ kindOf: 'monthly', sdate: '2026-08-03T00:00:00.000Z', fdate: '1970-01-01T00:00:00.000Z' }),
      [],
      { now: NOW }
    );
    expect(row.reason).toBe('invalidWindow');
  });

  it('names a window that opens beyond the horizon', () => {
    const row = comparePanui(sp({ sdate: '2030-01-01T00:00:00.000Z' }), [], { now: NOW });
    expect(row.reason).toBe('offerNotYetOpen');
  });
});

describe('summarizeComparisons', () => {
  const rows = [
    comparePanui(sp({}, 1), [], { now: NOW }),
    comparePanui(sp({ panui: false }, 2), [], { now: NOW }),
    comparePanui(sp({ panui: true, fdate: '2026-04-20T00:00:00.000Z' }, 3), [booking({ end: null })], {
      now: NOW
    })
  ];

  it('counts each verdict', () => {
    const summary = summarizeComparisons(rows);
    expect(summary).toMatchObject({ resources: 3, agree: 1, staleLocked: 1, overOffered: 1 });
  });

  it('blocks the flip only on the over-offered rows', () => {
    const summary = summarizeComparisons(rows);
    expect(summary.blockers).toHaveLength(1);
    expect(summary.blockers[0].spId).toBe('3');
  });

  it('groups the blockers by reason, over the whole tail and not just the listed ones', () => {
    const many = [
      ...rows,
      ...Array.from({ length: 60 }, (_, i) =>
        comparePanui(
          sp({ kindOf: 'total', sdate: '2022-05-13T00:00:00.000Z', fdate: '2024-05-13T00:00:00.000Z' }, 100 + i),
          [],
          { now: NOW }
        )
      )
    ];
    const summary = summarizeComparisons(many);
    expect(summary.blockers).toHaveLength(50);
    expect(summary.blockersByReason).toEqual({ bookedOut: 1, offerWindowEnded: 60 });
  });

  it('honours the blocker limit so a big run stays readable', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      comparePanui(sp({ panui: true, fdate: '2026-04-20T00:00:00.000Z' }, i), [booking({ end: null })], {
        now: NOW
      })
    );
    expect(summarizeComparisons(many, { blockerLimit: 4 }).blockers).toHaveLength(4);
    expect(summarizeComparisons(many, { blockerLimit: 4 }).overOffered).toBe(10);
  });
});
