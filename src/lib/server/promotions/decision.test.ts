import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/actions/configs/actionUtils.js', () => ({ calcDeadlineMs: () => 48 * 3600_000 }));

import { applyStandingPromoDecision, signPromoDecision, standingOrder, standingRound, type PromoDecision } from './decision';
import { runPromotionClock } from './clock';

const NOW = new Date('2026-11-01T10:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

/** A fake Strapi: answers reads from `reads`, records every mutation. */
function fakeExec(reads: Record<string, unknown> = {}) {
  const writes: string[] = [];
  const exec = vi.fn(async (q: string) => {
    if (q.trim().startsWith('mutation')) {
      writes.push(q);
      if (q.includes('createTimegrama')) return { data: { createTimegrama: { data: { id: '900' } } } };
      return { data: {} };
    }
    for (const [key, data] of Object.entries(reads)) if (q.includes(key)) return { data };
    return { data: {} };
  });
  return { exec, writes };
}

function decision(over: Partial<PromoDecision> = {}): PromoDecision {
  return {
    id: '50',
    kind: 'promotion',
    archived: false,
    decisionName: 'מבצע: סוף עונה',
    projectId: '7',
    projectRestime: 'feh',
    memberIds: ['1', '2'],
    rounds: [
      {
        ordern: 1,
        mode: 'propose',
        why: null,
        proposedById: '1',
        zman: day(-1),
        kind: 'item',
        name: 'סוף עונה',
        scope: { products: ['5'] },
        rule: { pct: 25 },
        startsAt: day(1),
        endsAt: day(8),
        capUnits: null,
        capOrders: null,
        perOrderMax: null
      }
    ],
    policy: null,
    promotionId: '30',
    promotionStatus: 'proposed',
    vots: [{ userId: '1', order: 1, what: true }],
    timegramaId: '800',
    timegramaDate: day(1),
    ...over
  };
}

describe('standing round', () => {
  it('is the highest ordern, and an end round is history, not a version', () => {
    const d = decision();
    d.rounds.push({ ...d.rounds[0], ordern: 2, rule: { pct: 10 } }, { ...d.rounds[0], ordern: 3, mode: 'end' });
    expect(standingRound(d)?.rule).toEqual({ pct: 10 });
    expect(standingOrder(d)).toBe(3);
  });

  it('an envelope counts its rounds in vots', () => {
    expect(standingOrder(decision({ kind: 'promoPolicy', rounds: [], vots: [{ userId: '1', order: 2, what: true }] }))).toBe(2);
  });
});

describe('applyStandingPromoDecision', () => {
  it('a version approved before its start is scheduled with its own dates', async () => {
    const { exec, writes } = fakeExec();
    const out = await applyStandingPromoDecision(exec, decision(), NOW);
    expect(out.status).toBe('scheduled');
    const upd = writes.find((w) => w.includes('updatePromotion'))!;
    expect(upd).toContain('status: scheduled');
    expect(upd).toContain(`startsAt: "${day(1)}"`);
    expect(writes.some((w) => w.includes('updateDecision') && w.includes('archived: true'))).toBe(true);
    expect(writes.some((w) => w.includes('updateTimegrama(id: "800"'))).toBe(true);
  });

  it('a version approved late starts now and keeps its end (D2)', async () => {
    const { exec, writes } = fakeExec();
    const late = new Date(day(3));
    const out = await applyStandingPromoDecision(exec, decision(), late);
    expect(out).toMatchObject({ status: 'active', startsAt: late.toISOString(), endsAt: day(8) });
    expect(writes.find((w) => w.includes('updatePromotion'))).toContain('endedReason: null');
  });

  it('a standing "0%" ends the promotion — the counter that means "no promotion"', async () => {
    const d = decision();
    d.rounds.push({ ...d.rounds[0], ordern: 2, rule: { pct: 0 } });
    const { exec, writes } = fakeExec();
    expect((await applyStandingPromoDecision(exec, d, NOW)).status).toBe('ended');
    expect(writes.find((w) => w.includes('updatePromotion'))).toContain('endedReason: early');
  });

  it('an envelope is written to the rikma', async () => {
    const { exec, writes } = fakeExec();
    const policy = { maxPct: 20, maxDays: 14, maxDaysPerHalfYear: null, floor: 'cost' as const, kinds: ['item' as const], who: { members: true as const }, arrangedDiscountPct: 10 };
    await applyStandingPromoDecision(exec, decision({ kind: 'promoPolicy', rounds: [], promotionId: null, policy }), NOW);
    const upd = writes.find((w) => w.includes('updateProject'))!;
    expect(upd).toContain('promoPolicy: { maxPct: 20, maxDays: 14');
    expect(upd).toContain('who: "members"');
  });
});

describe('signPromoDecision', () => {
  const read = (d: PromoDecision) => ({
    decision: {
      data: {
        id: d.id,
        attributes: {
          kind: d.kind,
          archived: d.archived,
          decisionName: d.decisionName,
          vots: d.vots.map((v) => ({ what: v.what, order: v.order, users_permissions_user: { data: { id: v.userId } } })),
          negopromo: d.rounds.map((r) => ({ ...r, proposedBy: { data: { id: r.proposedById } } })),
          promotion: { data: { id: d.promotionId, attributes: { status: d.promotionStatus } } },
          timegrama: { data: { id: d.timegramaId, attributes: { date: d.timegramaDate, done: false } } },
          projects: { data: [{ id: d.projectId, attributes: { restime: 'feh', user_1s: { data: d.memberIds.map((id) => ({ id })) } } }] }
        }
      }
    }
  });

  it('waits while a member has not signed the standing round', async () => {
    const { exec } = fakeExec({ 'decision(': read(decision({ memberIds: ['1', '2', '3'] })) });
    const out = await signPromoDecision(exec, '50', '2');
    expect(out).toMatchObject({ consensus: false, awaiting: ['3'] });
  });

  it('the last signature applies it', async () => {
    const { exec, writes } = fakeExec({ 'decision(': read(decision()) });
    const out = await signPromoDecision(exec, '50', '2');
    expect(out.consensus).toBe(true);
    expect(writes.some((w) => w.includes('updatePromotion'))).toBe(true);
  });

  it('only members sign, and only once a round', async () => {
    const { exec } = fakeExec({ 'decision(': read(decision()) });
    await expect(signPromoDecision(exec, '50', '9')).rejects.toThrow(/members/);
    await expect(signPromoDecision(exec, '50', '1')).rejects.toThrow(/already signed/);
  });
});

describe('runPromotionClock', () => {
  const row = (id: string, attrs: Record<string, unknown>) => ({
    id,
    attributes: { kind: 'item', scope: {}, rule: {}, project: { data: { id: '7' } }, decision: { data: null }, ...attrs }
  });

  it('starts, ends and resumes — and leaves a pause with an open counter alone', async () => {
    const { exec, writes } = fakeExec({
      promotions: {
        promotions: {
          data: [
            row('1', { status: 'scheduled', startsAt: day(-1), endsAt: day(5) }),
            row('2', { status: 'active', startsAt: day(-5), endsAt: day(-1) }),
            row('3', { status: 'paused', startsAt: day(-5), endsAt: day(5), pausedAt: day(-2) }),
            row('4', { status: 'paused', startsAt: day(-5), endsAt: day(5), pausedAt: day(-2), decision: { data: { id: '9', attributes: { archived: false } } } }),
            row('5', { status: 'active', startsAt: day(-1), endsAt: day(5) })
          ]
        }
      }
    });
    const report = await runPromotionClock(exec, NOW);
    expect(report.moved.map((m) => [m.promotionId, m.to.status])).toEqual([
      ['1', 'active'],
      ['2', 'ended'],
      ['3', 'active']
    ]);
    expect(writes.find((w) => w.includes('updatePromotion(id: "3"'))).toContain('pausedAt: null');
  });
});
