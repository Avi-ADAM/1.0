import { describe, it, expect } from 'vitest';
import { planLapsedRevival } from './lapsedRevival';

const NOW = new Date('2026-11-14T10:00:00.000Z');

function lapsedAsk(over: Record<string, any> = {}, om: Record<string, any> = {}) {
  return {
    id: '50',
    attributes: {
      archived: true,
      lapsedAt: '2026-11-12T10:00:00.000Z',
      users_permissions_user: { data: { id: '7', attributes: { username: 'dana' } } },
      project: {
        data: { id: '3', attributes: { restime: 'sth', user_1s: { data: [{ id: '1' }, { id: '7' }, { id: '9' }] } } }
      },
      open_mission: {
        data: {
          id: '40',
          attributes: { name: 'Vision', archived: false, isRishon: false, asks: { data: [] }, ...om }
        }
      },
      vots: [{ what: true, order: 0, zman: null, ide: 1, users_permissions_user: { data: { id: '1' } } }],
      negopendmissions: { data: [] },
      ...over
    }
  };
}

describe('planLapsedRevival', () => {
  it('lets the invited member restore it with their yes at the standing round', () => {
    const plan = planLapsedRevival(lapsedAsk(), '7', NOW);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.role).toBe('taker');
    expect(plan).toMatchObject({ askId: '50', openMissionId: '40', takerId: '7', projectId: '3', restime: 'sth' });
    expect(plan.vots).toHaveLength(2);
    expect(plan.vots[1]).toEqual({
      what: true,
      users_permissions_user: '7',
      order: 0,
      zman: NOW.toISOString(),
      ide: 7
    });
  });

  it('records the yes at the latest negotiated round', () => {
    const plan = planLapsedRevival(
      lapsedAsk({ negopendmissions: { data: [{ attributes: { ordern: 2 } }] } }),
      '7',
      NOW
    );
    expect(plan.ok && plan.vots.at(-1)?.order).toBe(2);
  });

  it('lets a member offer it again without counting as the invited member', () => {
    const plan = planLapsedRevival(lapsedAsk(), '9', NOW);
    expect(plan.ok && plan.role).toBe('member');
    expect(plan.ok && plan.vots.some((v) => v.users_permissions_user === '7')).toBe(false);
  });

  it('does not add a second yes for a member who already said yes', () => {
    const plan = planLapsedRevival(lapsedAsk(), '1', NOW);
    expect(plan.ok && plan.vots).toHaveLength(1);
  });

  it('refuses someone outside the rikma', () => {
    expect(planLapsedRevival(lapsedAsk(), '99', NOW)).toEqual({ ok: false, reason: 'notAllowed' });
  });

  it('refuses an ask that was not stamped as lapsed', () => {
    expect(planLapsedRevival(lapsedAsk({ lapsedAt: null }), '7', NOW)).toEqual({ ok: false, reason: 'notLapsed' });
    expect(planLapsedRevival(lapsedAsk({ archived: false }), '7', NOW)).toEqual({ ok: false, reason: 'notLapsed' });
  });

  it('refuses once the mission was taken or offered to someone else', () => {
    expect(planLapsedRevival(lapsedAsk({}, { archived: true }), '7', NOW)).toEqual({ ok: false, reason: 'missionTaken' });
    expect(planLapsedRevival(lapsedAsk({}, { isRishon: true }), '7', NOW)).toEqual({ ok: false, reason: 'missionTaken' });
  });

  it('refuses while another candidate is on the table', () => {
    const ask = lapsedAsk({}, { asks: { data: [{ id: '61' }] } });
    expect(planLapsedRevival(ask, '7', NOW)).toEqual({ ok: false, reason: 'otherCandidate' });
  });

  it('refuses a missing ask', () => {
    expect(planLapsedRevival(null, '7', NOW)).toEqual({ ok: false, reason: 'notFound' });
  });
});
