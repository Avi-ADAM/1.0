import { describe, it, expect } from 'vitest';
import { evaluateCandidacyVote, assertStandingRound } from './candidacyVote';
import { ActionError } from '../actions/errors.js';

const NOW = new Date('2026-10-05T10:00:00.000Z');

const vote = (uid: string, order = 0, what = true) => ({
  what,
  order,
  zman: '2026-10-01T08:00:00.000Z',
  ide: Number(uid),
  users_permissions_user: { data: { id: uid } }
});

/** An Askm as `getAskmForFinalize` returns it. Members 1,2,3; candidate 9. */
function askm({
  vots = [] as any[],
  rounds = [] as { ordern: number; proposedBy: string }[],
  members = ['1', '2', '3'],
  takerId = '9'
} = {}) {
  return {
    archived: false,
    vots,
    users_permissions_user: { data: { id: takerId } },
    project: { data: { id: '5', attributes: { user_1s: { data: members.map((id) => ({ id })) } } } },
    nego_mashes: { data: rounds.map((attributes, i) => ({ id: String(i + 1), attributes })) }
  };
}

const byUser = (rows: any[]) =>
  rows.map((v) => `${v.users_permissions_user}@${v.order}:${v.what ? 'y' : 'n'}`).sort();

describe('evaluateCandidacyVote — the list written back is the DB’s', () => {
  it('keeps a vote another member cast after the caller’s card loaded', () => {
    // Member 2 voted after member 1's card was rendered. The card never had
    // that row, so rebuilding from the card's copy deleted it.
    const res = evaluateCandidacyVote({
      attrs: askm({ vots: [vote('2')] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(byUser(res.vots)).toEqual(['1@0:y', '2@0:y']);
  });

  it('puts the vote on the standing round and keeps every other row’s round', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({
        vots: [vote('2', 0), vote('3', 2)],
        rounds: [
          { ordern: 1, proposedBy: 'project' },
          { ordern: 2, proposedBy: 'candidate' }
        ]
      }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.L).toBe(2);
    expect(byUser(res.vots)).toEqual(['1@2:y', '2@0:y', '3@2:y']);
  });

  it('replaces the caller’s earlier vote in the same round, keeps the one on an older round', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({
        vots: [vote('1', 0), vote('1', 1, false)],
        rounds: [{ ordern: 1, proposedBy: 'candidate' }]
      }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(byUser(res.vots)).toEqual(['1@0:y', '1@1:y']);
  });

  it('records "not these terms" when asked to', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ vots: [vote('2')] }),
      side: 'askm',
      callerId: '1',
      what: false,
      now: NOW
    });
    expect(byUser(res.vots)).toEqual(['1@0:n', '2@0:y']);
    expect(res.gate.hasNo).toBe(true);
  });

  it('reads an Ask’s rounds from negopendmissions', () => {
    const res = evaluateCandidacyVote({
      attrs: {
        ...askm(),
        nego_mashes: undefined,
        negopendmissions: { data: [{ id: '1', attributes: { ordern: 3, proposedBy: 'candidate' } }] }
      },
      side: 'ask',
      callerId: '1',
      now: NOW
    });
    expect(res.L).toBe(3);
  });
});

describe('evaluateCandidacyVote — has the whole rikma said yes?', () => {
  it('is not done while a member has not answered', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ vots: [vote('2')] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(false);
    expect(res.membersPending).toEqual(['3']);
  });

  it('is done when the caller’s is the last yes', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ vots: [vote('2'), vote('3')] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(true);
    expect(res.membersPending).toEqual([]);
  });

  it('does not count a yes left on terms that have since been countered', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({
        vots: [vote('2', 0), vote('3', 0)],
        rounds: [{ ordern: 1, proposedBy: 'candidate' }]
      }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(false);
    expect(res.membersPending.sort()).toEqual(['2', '3']);
  });

  it('is not done while somebody objects to these terms', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ vots: [vote('2'), vote('3'), vote('2', 0, false)] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(false);
  });

  it('does not wait for the candidate as a member — their consent is takerYes', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ members: ['1', '9'], vots: [] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(true);
  });

  it('a solo rikma is done with its one yes', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ members: ['1'] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(true);
  });

  it('never calls an unknown membership "everyone"', () => {
    const res = evaluateCandidacyVote({
      attrs: askm({ members: [] }),
      side: 'askm',
      callerId: '1',
      now: NOW
    });
    expect(res.allMembersYes).toBe(false);
  });
});

describe('assertStandingRound', () => {
  it('lets a caller that does not say which round it saw through', () => {
    expect(() => assertStandingRound(undefined, 3)).not.toThrow();
    expect(() => assertStandingRound(null, 3)).not.toThrow();
  });

  it('lets the round the caller saw through', () => {
    expect(() => assertStandingRound(3, 3)).not.toThrow();
    expect(() => assertStandingRound('3', 3)).not.toThrow();
  });

  it('refuses when the terms moved, and says which round is on the table', () => {
    try {
      assertStandingRound(1, 2);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ActionError);
      expect((e as ActionError).code).toBe('ROUND_MOVED');
      expect((e as ActionError).details).toEqual({ expected: 1, standing: 2 });
    }
  });
});
