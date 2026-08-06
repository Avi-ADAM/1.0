import { describe, it, expect } from 'vitest';
import { assessMembership, endMembership } from './membership.js';
import type { ArchiveTarget } from './targets.js';

/**
 * Answers the assessment's counting query. `counts` names the ties the member
 * still has; anything unnamed is zero.
 */
function fakeExec(counts: Record<string, number> = {}, projectMembers = ['1', '2']) {
  const sent: string[] = [];
  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('project(id:')) {
      return {
        data: {
          project: {
            data: { id: '5', attributes: { user_1s: { data: projectMembers.map((id) => ({ id })) } } },
          },
        },
      };
    }
    if (query.includes('updateProject')) return { data: { updateProject: { data: { id: '5' } } } };
    const meta = (n: number) => ({ meta: { pagination: { total: n } } });
    return {
      data: {
        otherMissions: meta(counts.otherMissions ?? 0),
        otherResources: meta(counts.otherResources ?? 0),
        finnishedMissions: meta(counts.finnishedMissions ?? 0),
        sales: meta(counts.sales ?? 0),
        halukas: meta(counts.halukas ?? 0),
        openAsks: meta(counts.openAsks ?? 0),
        openAskms: meta(counts.openAskms ?? 0),
      },
    };
  };
  return { exec, sent, matching: (t: string) => sent.filter((q) => q.includes(t)) };
}

function target(over: Partial<ArchiveTarget> = {}): ArchiveTarget {
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
    hoursAlready: 0,
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

describe('assessMembership — the last tie', () => {
  it('is the last tie when the member joined for this one mission and nothing accrued', async () => {
    const { exec } = fakeExec();
    const a = await assessMembership(exec, target(), '1');
    expect(a.isLastTie).toBe(true);
    expect(a.userId).toBe('2');
    expect(a.projectId).toBe('5');
  });

  it('is the last tie for a resource just the same', async () => {
    const { exec } = fakeExec();
    const a = await assessMembership(exec, target({ kind: 'resourceInProgress' }), '1');
    expect(a.isLastTie).toBe(true);
  });

  it('excludes the object being archived from the count of remaining ties', async () => {
    const { exec, sent } = fakeExec();
    await assessMembership(exec, target(), '1');
    expect(sent[0]).toContain('id: { ne: "10" }');
  });
});

describe('assessMembership — what keeps a member', () => {
  it.each([
    ['another live mission', { otherMissions: 1 }],
    ['another live resource', { otherResources: 1 }],
    ['work already finished', { finnishedMissions: 1 }],
    ['money they hold', { sales: 1 }],
    ['a distribution', { halukas: 1 }],
    ['an offer waiting for them', { openAsks: 1 }],
  ])('stays a member when they have %s', async (_label, counts) => {
    const { exec } = fakeExec(counts);
    const a = await assessMembership(exec, target(), '1');
    expect(a.isLastTie).toBe(false);
  });

  it('stays a member once hours are logged — that is a stake, not a loose end', async () => {
    const { exec, sent } = fakeExec();
    const a = await assessMembership(exec, target({ hoursAlready: 0.5 }), '1');
    expect(a.isLastTie).toBe(false);
    expect(sent).toHaveLength(0); // decided without asking the database
  });

  it('stays a member when the mission already produced a FinnishedMission', async () => {
    const { exec } = fakeExec();
    const a = await assessMembership(exec, target({ finnishedMissionIds: ['77'] }), '1');
    expect(a.isLastTie).toBe(false);
  });

  it('never empties a rikma — the only member is not removed', async () => {
    const { exec } = fakeExec({}, ['2']);
    const a = await assessMembership(exec, target({ memberIds: ['2'] }), '2');
    expect(a.isOnlyMember).toBe(true);
    expect(a.isLastTie).toBe(false);
  });

  it('says nothing about objects that are not a personal commitment', async () => {
    const { exec, sent } = fakeExec();
    for (const kind of ['openMission', 'openResource', 'matanot'] as const) {
      const a = await assessMembership(exec, target({ kind }), '1');
      expect(a.isLastTie).toBe(false);
    }
    expect(sent).toHaveLength(0);
  });

  it('says nothing when the object has no owner or no rikma', async () => {
    const { exec } = fakeExec();
    expect((await assessMembership(exec, target({ ownerId: null }), '1')).isLastTie).toBe(false);
    expect((await assessMembership(exec, target({ projectId: null }), '1')).isLastTie).toBe(false);
  });
});

describe('endMembership', () => {
  it('rewrites the member list without them and leaves the rest intact', async () => {
    const { exec, matching } = fakeExec({}, ['1', '2', '3']);
    const res = await endMembership(exec, '5', '2');

    expect(res.removed).toBe(true);
    expect(res.remainingMemberIds).toEqual(['1', '3']);
    const [write] = matching('updateProject');
    expect(write).toContain('user_1s: ["1", "3"]');
  });

  it('is a no-op when they are not on the list', async () => {
    const { exec, matching } = fakeExec({}, ['1', '3']);
    const res = await endMembership(exec, '5', '2');
    expect(res.removed).toBe(false);
    expect(matching('updateProject')).toHaveLength(0);
  });

  it('refuses to remove the last member rather than orphan the rikma', async () => {
    const { exec, matching } = fakeExec({}, ['2']);
    const res = await endMembership(exec, '5', '2');
    expect(res.removed).toBe(false);
    expect(matching('updateProject')).toHaveLength(0);
  });
});
