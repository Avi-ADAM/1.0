import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The server, not the card, decides whether an askm approval completes the
 * rikma's agreement — and the votes it writes are the DB's, at the standing
 * round (nego/candidacyVote.ts).
 */

const { runAcceptance } = vi.hoisted(() => ({ runAcceptance: vi.fn(async () => {}) }));
vi.mock('../helpers/runResourceAskmAcceptance.js', () => ({
  runResourceAskmAcceptance: runAcceptance,
  activateRecurringEngine: vi.fn(async () => {})
}));
vi.mock('../../nego/timegrama.js', () => ({ ensureCandidacyTimegrama: vi.fn(async () => 'tg1') }));
vi.mock('$lib/server/deal/offerDeal.js', () => ({ loadCandidacyDeal: vi.fn(async () => null) }));

import { finalizeAskmAcceptanceConfig } from './finalizeAskmAcceptance';
import { voteOnAskmConfig } from './voteOnAskm';
import type { ActionExecutionHandler } from '../types';

const finalize = finalizeAskmAcceptanceConfig.graphqlOperation as ActionExecutionHandler;
const voteNo = voteOnAskmConfig.graphqlOperation as ActionExecutionHandler;

const v = (uid: string, order = 0, what = true) => ({
  what,
  order,
  users_permissions_user: { data: { id: uid } }
});

/** Members 1,2,3 of rikma 5; candidate 9 offers resource 40 on open-mashaabim 60. */
function world({
  vots = [] as any[],
  rounds = [] as { ordern: number; proposedBy: string }[],
  project = '5',
  archived = false
} = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === 'getAskmForFinalize') {
        return {
          data: {
            askm: {
              data: {
                id: '40',
                attributes: {
                  archived,
                  vots,
                  users_permissions_user: { data: { id: '9' } },
                  sp: { data: { id: '77' } },
                  project: {
                    data: {
                      id: project,
                      attributes: { restime: 'feh', user_1s: { data: [{ id: '1' }, { id: '2' }, { id: '3' }] } }
                    }
                  },
                  open_mashaabim: { data: { id: '60', attributes: { name: 'Projector', askms: { data: [] } } } },
                  nego_mashes: { data: rounds.map((attributes, i) => ({ id: String(i), attributes })) }
                }
              }
            }
          }
        };
      }
      return { data: {} };
    })
  };
  const written = () => calls.filter((c) => c.qid === '133addVoteToAskm').map((c) => c.vars.vots);
  return { strapi, calls, written };
}

const ctx = (userId = '1') => ({ userId, jwt: 'j', fetch: undefined as any }) as any;
const rows = (vots: any[]) =>
  vots.map((r: any) => `${r.users_permissions_user}@${r.order}:${r.what ? 'y' : 'n'}`).sort();

beforeEach(() => runAcceptance.mockClear());

describe('finalizeAskmAcceptance — "partial" from the card', () => {
  it('keeps the other members’ votes and their rounds (the card’s copy is ignored)', async () => {
    const w = world({ vots: [v('2', 1)], rounds: [{ ordern: 1, proposedBy: 'candidate' }] });
    const res: any = await finalize(
      { variant: 'partial', askmId: '40', projectId: '5', existingVotes: [] },
      ctx('1'),
      { strapi: w.strapi } as any
    );
    expect(res.data.materialized).toBe(false);
    expect(res.data.pending).toBe('members');
    expect(rows(w.written()[0])).toEqual(['1@1:y', '2@1:y']);
    expect(runAcceptance).not.toHaveBeenCalled();
  });

  it('completes it when everyone else said yes since the card loaded', async () => {
    const w = world({ vots: [v('2'), v('3')] });
    const res: any = await finalize(
      { variant: 'partial', askmId: '40', projectId: '5' },
      ctx('1'),
      { strapi: w.strapi } as any
    );
    expect(res.data.materialized).toBe(true);
    expect(runAcceptance).toHaveBeenCalledOnce();
    const p = (runAcceptance.mock.calls[0] as any[])[2];
    // From the DB, not from a card that sent none of it.
    expect(p.openMashaabimId).toBe('60');
    expect(p.acceptedUserId).toBe('9');
    expect(p.spId).toBe('77');
    expect(p.missionName).toBe('Projector');
    expect(p.existingMemberIds).toEqual(['1', '2', '3']);
    expect(rows(p.existingVotes)).toEqual(['1@0:y', '2@0:y', '3@0:y']);
  });
});

describe('finalizeAskmAcceptance — "allVoted" from the card', () => {
  it('does not materialize on the card’s count when a member has not answered', async () => {
    const w = world({ vots: [v('2')] });
    const res: any = await finalize(
      { variant: 'allVoted', askmId: '40', projectId: '5', openMashaabimId: '60', acceptedUserId: '9', existingMemberIds: ['1', '2', '3'] },
      ctx('1'),
      { strapi: w.strapi } as any
    );
    expect(res.data.materialized).toBe(false);
    expect(res.data.membersPending).toEqual(['3']);
    expect(runAcceptance).not.toHaveBeenCalled();
    expect(w.written()).toHaveLength(1);
  });

  it('refuses to sign terms that moved since the caller saw them', async () => {
    const w = world({ vots: [v('2', 1), v('3', 1)], rounds: [{ ordern: 1, proposedBy: 'candidate' }] });
    await expect(
      finalize({ variant: 'allVoted', askmId: '40', projectId: '5', expectRound: 0 }, ctx('1'), { strapi: w.strapi } as any)
    ).rejects.toMatchObject({ code: 'ROUND_MOVED' });
    expect(w.written()).toHaveLength(0);
    expect(runAcceptance).not.toHaveBeenCalled();
  });

  it('refuses an askm of another rikma', async () => {
    const w = world({ project: '6' });
    await expect(
      finalize({ variant: 'allVoted', askmId: '40', projectId: '5' }, ctx('1'), { strapi: w.strapi } as any)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('says so when the askm was already resolved', async () => {
    const w = world({ archived: true });
    await expect(
      finalize({ variant: 'allVoted', askmId: '40', projectId: '5' }, ctx('1'), { strapi: w.strapi } as any)
    ).rejects.toMatchObject({ code: 'ALREADY_RESOLVED' });
  });

  it('asks the other members’ cards to re-read the slice', async () => {
    const w = world({ vots: [v('2')] });
    const res: any = await finalize({ variant: 'partial', askmId: '40', projectId: '5' }, ctx('1'), { strapi: w.strapi } as any);
    expect(res.updateStrategy).toEqual({
      type: 'refetchScope',
      config: { dataKeys: ['askedResources'], projectId: '5' }
    });
  });
});

describe('voteOnAskm', () => {
  it('records the objection on the standing round over the DB’s rows', async () => {
    const w = world({ vots: [v('2', 1)], rounds: [{ ordern: 1, proposedBy: 'candidate' }] });
    const res: any = await voteNo(
      // An old card: stale round, a list without member 2's vote.
      { askmId: '40', projectId: '5', what: false, order: 0, existingVotes: [] },
      ctx('3'),
      { strapi: w.strapi } as any
    );
    expect(res.data.order).toBe(1);
    expect(rows(w.written()[0])).toEqual(['2@1:y', '3@1:n']);
  });
});
