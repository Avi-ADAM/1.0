import { describe, it, expect } from 'vitest';
import { evaluateAskAcceptance } from './askAcceptance';

const NOW = new Date('2026-07-26T10:00:00.000Z');

/** Ask attributes as qid `getAskNegoRounds` returns them. */
function askNode({
  takerId = '2',
  isRishon = false,
  vots = [] as any[],
  rounds = [] as any[],
  members = ['1', '2', '3'],
  archived = false,
} = {}) {
  return {
    archived,
    vots,
    users_permissions_user: { data: { id: takerId } },
    open_mission: { data: { id: '77', attributes: { isRishon } } },
    project: { data: { id: '5', attributes: { user_1s: { data: members.map((id) => ({ id })) } } } },
    negopendmissions: { data: rounds.map((attributes) => ({ id: '1', attributes })) },
  };
}

const yes = (uid: string, order = 0) => ({
  what: true,
  order,
  zman: '2026-07-20T08:00:00.000Z',
  ide: Number(uid),
  users_permissions_user: { data: { id: uid } },
});

describe('evaluateAskAcceptance — assigned offers (open_mission.isRishon)', () => {
  it('blocks materialization when only the mission creator voted', () => {
    // createMission branch 2: member 1 created the mission FOR member 2 and
    // pre-cast their own yes. Member 3 now clicks approve — the assignee has
    // still said nothing, so the mission must not be registered on their name.
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '2', isRishon: true, vots: [yes('1')] }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('awaitingAssigneeConsent');
    expect(res.assignedOffer).toBe(true);
    expect(res.gate.takerYes).toBe(false);
    // The approver's yes is still captured, so it can be persisted.
    expect(res.vots.map((v) => v.users_permissions_user).sort()).toEqual(['1', '3']);
  });

  it('blocks even when every other member has approved', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '2', isRishon: true, vots: [yes('1'), yes('3')] }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('awaitingAssigneeConsent');
  });

  it('allows it once the assignee has voted yes', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '2', isRishon: true, vots: [yes('1'), yes('2')] }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.reason).toBe('ok');
  });

  it("allows it when the assignee is the one clicking approve (their click IS the consent)", () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '2', isRishon: true, vots: [yes('1')] }),
      callerId: '2',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.gate.takerYes).toBe(true);
  });

  it("treats the assignee's own counter round as their consent", () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '2',
        isRishon: true,
        vots: [yes('1', 0)],
        rounds: [{ ordern: 1, proposedBy: 'candidate' }],
      }),
      callerId: '3', // member accepting the assignee's counter-terms
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.L).toBe(1);
    // The approving member's yes lands on the current round, not on round 0.
    expect(res.vots.find((v) => v.users_permissions_user === '3')?.order).toBe(1);
  });

  it("ignores an assignee yes left on a superseded round", () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '2',
        isRishon: true,
        vots: [yes('1', 0), yes('2', 0)],
        rounds: [{ ordern: 1, proposedBy: 'project' }], // members countered after
      }),
      callerId: '1',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('awaitingAssigneeConsent');
  });
});

describe('evaluateAskAcceptance — ordinary candidacies', () => {
  it('lets a member approve an external candidate who applied', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '9', isRishon: false, vots: [] }),
      callerId: '1',
      acceptedUserId: '9',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.assignedOffer).toBe(false);
  });

  it('refuses to materialize under someone who is not the ask candidate', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '9', vots: [] }),
      callerId: '1',
      acceptedUserId: '4',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('takerMismatch');
  });

  it('refuses an ask that was already resolved', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '9', archived: true }),
      callerId: '1',
      acceptedUserId: '9',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('archived');
  });

  it('replaces the approver’s earlier vote in the same round instead of duplicating it', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '9',
        vots: [{ ...yes('1'), what: false }],
      }),
      callerId: '1',
      acceptedUserId: '9',
      now: NOW,
    });

    const mine = res.vots.filter((v) => v.users_permissions_user === '1');
    expect(mine).toHaveLength(1);
    expect(mine[0].what).toBe(true);
    expect(mine[0].zman).toBe(NOW.toISOString());
  });

  it('keeps existing vote rows intact (zman/ide/why survive the rewrite)', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '9',
        vots: [{ ...yes('3'), why: 'בעד בשמחה' }],
      }),
      callerId: '1',
      acceptedUserId: '9',
      now: NOW,
    });

    const kept = res.vots.find((v) => v.users_permissions_user === '3');
    expect(kept).toMatchObject({
      what: true,
      order: 0,
      ide: 3,
      zman: '2026-07-20T08:00:00.000Z',
      why: 'בעד בשמחה',
    });
  });
});

describe('evaluateAskAcceptance — a project round standing unanswered', () => {
  it('blocks approval while the candidate has not answered the new terms', () => {
    // The rikma edited the open mission the candidate applied to, so
    // pendingOffers put the new terms to them as a project round at order 1.
    // A member pressing approve must not register the candidate on terms they
    // have never seen — the same bar the timegrama finalizer applies.
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '2',
        vots: [yes('2', 0), yes('1', 1)],
        rounds: [{ ordern: 1, proposedBy: 'project' }],
      }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('awaitingAssigneeConsent');
    expect(res.assignedOffer).toBe(false);
    expect(res.L).toBe(1);
    // The approver's yes is still captured at the standing round, so it is
    // waiting the moment the candidate accepts.
    expect(res.vots.find((v) => v.users_permissions_user === '3')).toMatchObject({ order: 1 });
  });

  it('allows it once the candidate accepts at that round', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '2',
        vots: [yes('2', 0), yes('1', 1), yes('2', 1)],
        rounds: [{ ordern: 1, proposedBy: 'project' }],
      }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.gate.takerYes).toBe(true);
  });

  it('allows it when the standing round is the candidate’s own counter', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({
        takerId: '2',
        vots: [yes('2', 0)],
        rounds: [{ ordern: 1, proposedBy: 'project' }, { ordern: 2, proposedBy: 'candidate' }],
      }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
  });

  it('leaves the ordinary candidacy — no rounds at all — untouched', () => {
    const res = evaluateAskAcceptance({
      askAttributes: askNode({ takerId: '2', vots: [yes('1')] }),
      callerId: '3',
      acceptedUserId: '2',
      now: NOW,
    });

    expect(res.allowed).toBe(true);
    expect(res.reason).toBe('ok');
  });
});
