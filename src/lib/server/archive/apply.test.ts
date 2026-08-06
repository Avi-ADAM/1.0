import { describe, it, expect, beforeEach } from 'vitest';
import { applyObjectChange, type StandingRound } from './apply.js';
import type { ArchiveTarget } from './targets.js';

/**
 * Records every document the applier sends, and answers the reads it makes.
 *
 * `ties` controls the membership assessment: how many other things bind the
 * mission's owner to the rikma. Zero means archiving this object also ends
 * their membership.
 */
function fakeExec(ties = 0, projectMembers = ['1', '2']) {
  const sent: string[] = [];
  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('createFinnishedMission')) {
      return { data: { createFinnishedMission: { data: { id: '900' } } } };
    }
    if (query.includes('finnishedMission(id:')) {
      return { data: { finnishedMission: { data: { id: '77', attributes: { noofhours: 5 } } } } };
    }
    if (query.includes('otherMissions:')) {
      const meta = (n: number) => ({ meta: { pagination: { total: n } } });
      return {
        data: {
          otherMissions: meta(ties),
          otherResources: meta(0),
          finnishedMissions: meta(0),
          sales: meta(0),
          halukas: meta(0),
          openAsks: meta(0),
          openAskms: meta(0),
        },
      };
    }
    if (query.includes('project(id:')) {
      return {
        data: {
          project: {
            data: { id: '5', attributes: { user_1s: { data: projectMembers.map((id) => ({ id })) } } },
          },
        },
      };
    }
    return { data: {} };
  };
  return {
    exec,
    sent,
    /** All documents mentioning a token — the assertion surface. */
    matching: (token: string) => sent.filter((q) => q.includes(token)),
  };
}

function missionInProgress(over: Partial<ArchiveTarget> = {}): ArchiveTarget {
  return {
    kind: 'missionInProgress',
    id: '10',
    name: 'עיצוב לוגו',
    lifecycle: 'archiveProposed',
    archiveEffectiveFrom: null,
    dormancyDays: null,
    projectId: '5',
    projectRestime: 'sth',
    projectDormancyDays: null,
    memberIds: ['1', '2'],
    ownerId: '2',
    hoursAlready: 12,
    perhour: 50,
    hoursAssigned: 20,
    finnishedMissionIds: [],
    hasActiveTimer: false,
    lastActivityAt: '2026-05-01T00:00:00.000Z',
    openMissionId: '33',
    missionId: '44',
    recurring: false,
    cycleEnd: null,
    openOfferIds: [],
    openDecisionIds: [],
    origin: null,
    ...over,
  };
}

const archiveRound = (over: Partial<StandingRound> = {}): StandingRound => ({
  ordern: 1,
  mode: 'archive',
  hoursOutcome: 'waive',
  ...over,
});

describe('applyObjectChange — mode "keep"', () => {
  it('keeps the object and returns it to active, applying the negotiated terms', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress(),
      round: { ordern: 2, mode: 'keep', hm: 8, price: 60, name: 'עיצוב לוגו מצומצם' },
    });

    expect(result.lifecycle).toBe('active');
    const [mutation] = matching('updateMesimabetahalich');
    expect(mutation).toContain('hoursassinged: 8');
    expect(mutation).toContain('perhour: 60');
    expect(mutation).toContain('lifecycle: active');
    // Nothing was settled — the mission is still alive and carrying its hours.
    expect(matching('createFinnishedMission')).toHaveLength(0);
  });
});

describe('applyObjectChange — settling accrued hours', () => {
  it('credit turns the accrued hours into a FinnishedMission at the agreed rate', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress(),
      round: archiveRound({ hoursOutcome: 'credit', hoursToCredit: 10 }),
      why: 'הפרויקט שינה כיוון',
    });

    const [created] = matching('createFinnishedMission');
    expect(created).toContain('noofhours: 10');
    expect(created).toContain('total: 500'); // 10 × 50
    expect(created).toContain('mesimabetahalich: "10"');
    expect(created).toContain('users_permissions_user: "2"');
    expect(result.hoursCredited).toBe(10);
    expect(result.finnishedMissionId).toBe('900');
    expect(result.lifecycle).toBe('archived');
  });

  it('credit defaults to the hours actually accrued when no amount is negotiated', async () => {
    const { exec, matching } = fakeExec();
    await applyObjectChange(exec, {
      target: missionInProgress(),
      round: archiveRound({ hoursOutcome: 'credit' }),
    });
    expect(matching('createFinnishedMission')[0]).toContain('noofhours: 12');
  });

  it('credit grows the mission’s existing FinnishedMission instead of duplicating it', async () => {
    const { exec, matching } = fakeExec();
    await applyObjectChange(exec, {
      target: missionInProgress({ finnishedMissionIds: ['77'] }),
      round: archiveRound({ hoursOutcome: 'credit', hoursToCredit: 3 }),
    });
    expect(matching('createFinnishedMission')).toHaveLength(0);
    const [grown] = matching('updateFinnishedMission');
    expect(grown).toContain('noofhours: 8'); // 5 already there + 3
    expect(grown).toContain('total: 400');
  });

  it('waive archives without crediting anything', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress(),
      round: archiveRound({ hoursOutcome: 'waive' }),
    });
    expect(matching('createFinnishedMission')).toHaveLength(0);
    expect(result.hoursCredited).toBe(0);
    expect(result.lifecycle).toBe('archived');
  });

  it('transfer books the hours onto the receiving mission, never merging silently', async () => {
    const { exec, matching } = fakeExec();
    await applyObjectChange(exec, {
      target: missionInProgress({ finnishedMissionIds: ['77'] }),
      round: archiveRound({ hoursOutcome: 'transfer', hoursToCredit: 12, transferToId: '99' }),
    });
    const [created] = matching('createFinnishedMission');
    expect(created).toContain('mesimabetahalich: "99"');
    // The source mission's own row is left alone.
    expect(matching('updateFinnishedMission')).toHaveLength(0);
  });

  it('stops a running timer before the mission leaves', async () => {
    const { exec, matching } = fakeExec();
    await applyObjectChange(exec, {
      target: missionInProgress({ hasActiveTimer: true }),
      round: archiveRound(),
    });
    expect(matching('activeTimer: null')).toHaveLength(1);
  });

  it('refuses to settle an in-progress resource rather than dropping the delivery', async () => {
    const { exec } = fakeExec();
    await expect(
      applyObjectChange(exec, {
        target: missionInProgress({ kind: 'resourceInProgress' }),
        round: archiveRound({ hoursOutcome: 'credit', hoursToCredit: 4 }),
      }),
    ).rejects.toThrow(/not supported yet/);
  });
});

describe('applyObjectChange — scope', () => {
  it('release ends the commitment and puts the need back in the open pool', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
      scope: 'release',
    });

    expect(result.lifecycle).toBe('released');
    expect(result.reopenedOpenMissionId).toBe('33');
    const [reopened] = matching('updateOpenMission');
    expect(reopened).toContain('archived: false');
    expect(reopened).toContain('rishon: null');
  });

  it('archive removes the need and does not reopen anything', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
      scope: 'archive',
    });
    expect(result.lifecycle).toBe('archived');
    expect(result.reopenedOpenMissionId).toBeUndefined();
    expect(matching('updateOpenMission')).toHaveLength(0);
  });

  it('closes the open offers that only existed because the need existed', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ kind: 'openMission', openOfferIds: ['7', '8'], hoursAlready: 0 }),
      round: archiveRound(),
    });
    expect(result.closedOfferIds).toEqual(['7', '8']);
    expect(matching('updateAsk(')).toHaveLength(2);
  });
});

describe('applyObjectChange — recurring commitments', () => {
  it('endOfCycle schedules the archive instead of cutting mid-cycle', async () => {
    const { exec, matching } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress({
        kind: 'resourceInProgress',
        recurring: true,
        cycleEnd: '2026-07-01T00:00:00.000Z',
      }),
      round: archiveRound({ hoursOutcome: 'endOfCycle' }),
    });

    expect(result.lifecycle).toBe('archiveProposed');
    expect(result.effectiveFrom).toBe('2026-07-01T00:00:00.000Z');
    const [scheduled] = matching('updateMashabetahalich');
    expect(scheduled).toContain('archiveEffectiveFrom');
    expect(scheduled).toContain('lifecycle: archiveProposed');
  });

  it('refuses endOfCycle when no cycle boundary is known', async () => {
    const { exec } = fakeExec();
    await expect(
      applyObjectChange(exec, {
        target: missionInProgress({ kind: 'resourceInProgress', cycleEnd: null }),
        round: archiveRound({ hoursOutcome: 'endOfCycle' }),
      }),
    ).rejects.toThrow(/effectiveFrom/);
  });
});

describe('applyObjectChange — membership', () => {
  it('ends the membership when the archived mission was the member’s last tie', async () => {
    const { exec, matching } = fakeExec(0);
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
    });

    expect(result.membershipEnded).toEqual({
      userId: '2',
      projectId: '5',
      remainingMembers: 1,
    });
    expect(matching('updateProject')[0]).toContain('user_1s: ["1"]');
  });

  it('a release ends it too — the tie is gone either way', async () => {
    const { exec } = fakeExec(0);
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
      scope: 'release',
    });
    expect(result.membershipEnded?.userId).toBe('2');
  });

  it('keeps the membership when something else still binds them', async () => {
    const { exec, matching } = fakeExec(1);
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
    });
    expect(result.membershipEnded).toBeUndefined();
    expect(matching('updateProject')).toHaveLength(0);
  });

  it('keeps the membership when hours accrued, whatever the settlement', async () => {
    const { exec, matching } = fakeExec(0);
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 12 }),
      round: archiveRound({ hoursOutcome: 'waive' }),
    });
    expect(result.membershipEnded).toBeUndefined();
    expect(matching('updateProject')).toHaveLength(0);
  });

  it('re-checks at apply time rather than trusting the proposal', async () => {
    // Nothing bound them when the proposal opened; by maturation they had
    // taken on another mission — so they stay.
    const { exec } = fakeExec(1);
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
    });
    expect(result.membershipEnded).toBeUndefined();
  });

  it('archives the object anyway when the membership check itself fails', async () => {
    const sent: string[] = [];
    const flaky = async (query: string) => {
      sent.push(query);
      if (query.includes('otherMissions:')) throw new Error('strapi down');
      return { data: {} };
    };
    const result = await applyObjectChange(flaky, {
      target: missionInProgress({ hoursAlready: 0 }),
      round: archiveRound(),
    });
    expect(result.lifecycle).toBe('archived');
    expect(result.membershipEnded).toBeUndefined();
  });

  it('does not touch membership for an object nobody personally carries', async () => {
    const { exec, matching } = fakeExec(0);
    await applyObjectChange(exec, {
      target: missionInProgress({ kind: 'openMission', hoursAlready: 0 }),
      round: archiveRound(),
    });
    expect(matching('updateProject')).toHaveLength(0);
  });
});

describe('applyObjectChange — idempotency', () => {
  it('does nothing to an object that is already archived', async () => {
    const { exec, sent } = fakeExec();
    const result = await applyObjectChange(exec, {
      target: missionInProgress({ lifecycle: 'archived' }),
      round: archiveRound({ hoursOutcome: 'credit', hoursToCredit: 12 }),
    });
    expect(sent).toHaveLength(0);
    expect(result.lifecycle).toBe('archived');
  });
});

describe('applyObjectChange — the other target types', () => {
  let sink: ReturnType<typeof fakeExec>;
  beforeEach(() => {
    sink = fakeExec();
  });

  it('archives a product without touching its sales history', async () => {
    const result = await applyObjectChange(sink.exec, {
      target: missionInProgress({ kind: 'matanot', hoursAlready: 0, openMissionId: null }),
      round: archiveRound(),
    });
    expect(result.lifecycle).toBe('archived');
    expect(sink.matching('updateMatanot')[0]).toContain('lifecycle: archived');
    expect(sink.matching('deleteMatanot')).toHaveLength(0);
  });

  it('applies a kept product’s new price to the product’s own field names', async () => {
    await applyObjectChange(sink.exec, {
      target: missionInProgress({ kind: 'matanot' }),
      round: { ordern: 2, mode: 'keep', price: 25, hm: 4 },
    });
    const [mutation] = sink.matching('updateMatanot');
    expect(mutation).toContain('price: 25');
    expect(mutation).toContain('quant: 4');
  });
});
