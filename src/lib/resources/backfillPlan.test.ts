import { describe, it, expect } from 'vitest';
import { bookingSignature, planBackfill, statusOfGrant, summarizePlan } from './backfillPlan.js';

const NOW = new Date('2026-04-10T00:00:00Z');

function grant(id: number, attrs: Record<string, any> = {}) {
  return {
    id,
    attributes: {
      hm: 1,
      sqadualed: '2026-04-01T00:00:00.000Z',
      sqadualef: '2026-05-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      sp: { data: { id: 3, attributes: { name: 'רכב' } } },
      project: { data: { id: 11 } },
      users_permissions_user: { data: { id: 7 } },
      ...attrs
    }
  };
}

function engine(id: number, attrs: Record<string, any> = {}) {
  return {
    data: {
      id,
      attributes: {
        start: '2026-04-01T00:00:00.000Z',
        end: '2026-05-01T00:00:00.000Z',
        status_mashab: 'active',
        finnished: false,
        quantityAssigned: 1,
        ...attrs
      }
    }
  };
}

describe('statusOfGrant', () => {
  it('takes the engine lifecycle over the dates', () => {
    const dates = { sqadualed: '2026-04-01T00:00:00.000Z', sqadualef: null };
    expect(statusOfGrant(dates, { status_mashab: 'closed' }, NOW)).toBe('done');
    expect(statusOfGrant(dates, { status_mashab: 'cancelled' }, NOW)).toBe('cancelled');
    expect(statusOfGrant(dates, { finnished: true }, NOW)).toBe('done');
  });

  it('reads the dates when there is no engine', () => {
    expect(
      statusOfGrant({ sqadualed: '2026-01-01T00:00:00.000Z', sqadualef: '2026-02-01T00:00:00.000Z' }, null, NOW)
    ).toBe('done');
    expect(
      statusOfGrant({ sqadualed: '2026-06-01T00:00:00.000Z', sqadualef: '2026-07-01T00:00:00.000Z' }, null, NOW)
    ).toBe('confirmed');
    expect(
      statusOfGrant({ sqadualed: '2026-04-01T00:00:00.000Z', sqadualef: null }, null, NOW)
    ).toBe('active');
  });

  it('never produces a hold — every backfilled grant already passed a vote', () => {
    const statuses = ['draft', 'active', 'paused', null].map((s) =>
      statusOfGrant({ sqadualed: '2026-04-01T00:00:00.000Z' }, { status_mashab: s }, NOW)
    );
    expect(statuses).not.toContain('hold');
  });
});

describe('planBackfill', () => {
  it('turns a grant archive into one booking row', () => {
    const plan = planBackfill([grant(1)], { now: NOW });
    expect(plan.create).toHaveLength(1);
    expect(plan.create[0]).toMatchObject({
      rikmashId: '1',
      spId: '3',
      projectId: '11',
      ownerId: '7',
      start: '2026-04-01T00:00:00.000Z',
      end: '2026-05-01T00:00:00.000Z',
      status: 'active',
      source: 'rikma',
      quantity: 1
    });
    expect(plan.create[0].note).toContain('rikmash=1');
    expect(plan.spIds).toEqual(['3']);
  });

  it('prefers the engine window and links it', () => {
    const plan = planBackfill(
      [grant(1, { mashabetahalich: engine(90, { end: '2026-09-01T00:00:00.000Z' }) })],
      { now: NOW }
    );
    expect(plan.create[0].end).toBe('2026-09-01T00:00:00.000Z');
    expect(plan.create[0].mashabetahalichId).toBe('90');
    expect(plan.create[0].note).toContain('mashabetahalich=90');
  });

  it('skips a grant with no resource — there is nothing to book', () => {
    const plan = planBackfill([grant(1, { sp: { data: null } })], { now: NOW });
    expect(plan.create).toHaveLength(0);
    expect(plan.skipped[0]).toMatchObject({ reason: 'no-sp' });
  });

  it('falls back to createdAt rather than dropping a real occupancy', () => {
    const plan = planBackfill([grant(1, { sqadualed: null, sqadualef: null })], { now: NOW });
    expect(plan.create[0].start).toBe('2026-01-01T00:00:00.000Z');
    expect(plan.create[0].end).toBeNull();
    // Open-ended and already started: taken until somebody closes it. That is
    // exactly what panui:false says today, so the comparison stays quiet.
    expect(plan.create[0].status).toBe('active');
  });

  it('is idempotent — a grant that already has a row is skipped', () => {
    const nodes = [grant(1)];
    const first = planBackfill(nodes, { now: NOW });
    const second = planBackfill(nodes, {
      now: NOW,
      existing: [{ rikmashId: '1', spId: '3', projectId: '11', start: null, end: null }]
    });
    expect(first.create).toHaveLength(1);
    expect(second.create).toHaveLength(0);
    expect(second.skipped[0].reason).toBe('exists-rikmash');
  });

  it('recognises a live row that never got the rikmash link, by signature', () => {
    const plan = planBackfill([grant(1)], {
      now: NOW,
      existing: [
        {
          spId: '3',
          projectId: '11',
          // Same day, different clock time — the live row started at "now".
          start: '2026-04-01T14:22:00.000Z',
          end: '2026-05-01T00:00:00.000Z'
        }
      ]
    });
    expect(plan.create).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('exists-signature');
  });

  it('does not write the same grant twice inside one run', () => {
    // Two archives of one grant: same resource, same rikma, same window.
    const plan = planBackfill([grant(1), grant(2)], { now: NOW });
    expect(plan.create).toHaveLength(1);
    expect(plan.skipped.map((s) => s.reason)).toEqual(['exists-signature']);
  });

  it('records a holder self-allocation as personal, not rikma', () => {
    const plan = planBackfill([grant(1, { project: { data: null } })], { now: NOW });
    expect(plan.create[0].source).toBe('personal');
    expect(plan.create[0].projectId).toBeNull();
  });

  it('carries the pooled quantity across', () => {
    const plan = planBackfill([grant(1, { hm: 12 })], { now: NOW });
    expect(plan.create[0].quantity).toBe(12);
    const assigned = planBackfill([grant(1, { hm: 12, mashabetahalich: engine(9, { quantityAssigned: 4 }) })], {
      now: NOW
    });
    expect(assigned.create[0].quantity).toBe(4);
  });

  it('summarizes a run by status and skip reason', () => {
    const plan = planBackfill([grant(1), grant(2, { sp: { data: null } })], { now: NOW });
    const summary = summarizePlan(plan);
    expect(summary).toMatchObject({
      create: 1,
      skipped: 1,
      resources: 1,
      status_active: 1,
      'skip_no-sp': 1
    });
  });
});

describe('bookingSignature', () => {
  it('ignores the time of day', () => {
    expect(bookingSignature({ spId: 3, projectId: 11, start: '2026-04-01T09:00:00Z', end: null })).toBe(
      bookingSignature({ spId: '3', projectId: '11', start: '2026-04-01T23:59:00Z', end: null })
    );
  });

  it('separates two grants of the same resource on different days', () => {
    expect(bookingSignature({ spId: 3, projectId: 11, start: '2026-04-01T09:00:00Z' })).not.toBe(
      bookingSignature({ spId: 3, projectId: 11, start: '2026-04-02T09:00:00Z' })
    );
  });
});
