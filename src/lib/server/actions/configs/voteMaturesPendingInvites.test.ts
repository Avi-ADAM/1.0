/**
 * Both explicit-vote maturation paths send the invites a proposal carried
 * (PLAN_INVITE_PARTNER_TO_MISSION P2). The restime-silence twins live in
 * src/routes/api/timegrama/pend.svelte and pendM.svelte.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_URL: 'http://strapi.test' }));
vi.mock('$lib/server/shifts/mode.js', () => ({ shiftsEnabled: () => false }));
vi.mock('$lib/server/matching/engine', () => ({
  matchOpenMissionToUsers: vi.fn().mockResolvedValue(undefined),
  matchOpenMashaabimToUsers: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('$lib/server/invites/pendingInvites.js', () => ({
  firePendingInvites: vi.fn().mockResolvedValue([])
}));

import { firePendingInvites } from '$lib/server/invites/pendingInvites.js';
import { voteOnPendmConfig } from './voteOnPendm';
import { voteOnPmashConfig } from './voteOnPmash';

const members = { data: { project: { data: { attributes: { user_1s: { data: [{ id: '5' }, { id: '6' }] } } } } } };
// User 6 already said yes in round 0; user 5's yes completes the consensus.
const priorYes = [{ what: true, order: 0, ide: 6, zman: '2026-10-26T09:00:00.000Z', users_permissions_user: { data: { id: '6' } } }];

function context(createdKey: string, createdId: string) {
  return {
    userId: '5',
    jwt: 'jwt',
    lang: 'he',
    fetch: vi.fn().mockResolvedValue({
      json: async () => ({ data: { [createdKey]: { data: { id: createdId } } } })
    }) as unknown as typeof fetch
  };
}

beforeEach(() => vi.mocked(firePendingInvites).mockClear());

describe('a vote that matures a proposal sends its waiting invites', () => {
  it('voteOnPendm → the new open mission', async () => {
    const strapi = {
      execute: vi.fn(async (qid: string) =>
        qid === '142getPendmForVote'
          ? { data: { pendm: { data: { id: '30', attributes: { name: 'לוגו', users: priorYes, mission: { data: { id: '2' } } } } } } }
          : members
      )
    };
    const ctx = context('createOpenMission', '77');
    const out: any = await (voteOnPendmConfig.graphqlOperation as any)(
      { pendId: '30', projectId: '20', what: true },
      ctx,
      { strapi }
    );

    expect(out.data.consensus).toBe(true);
    expect(firePendingInvites).toHaveBeenCalledWith(
      { kind: 'pendm', proposalId: '30', openEntityId: '77' },
      expect.objectContaining({ strapi, lang: 'he' })
    );
  });

  it('voteOnPmash → the new open resource', async () => {
    const strapi = {
      execute: vi.fn(async (qid: string) =>
        qid === '144getPmashForVote'
          ? { data: { pmash: { data: { id: '8', attributes: { name: 'מקרר', users: priorYes, mashaabim: { data: { id: '3' } } } } } } }
          : members
      )
    };
    const ctx = context('createOpenMashaabim', '61');
    const out: any = await (voteOnPmashConfig.graphqlOperation as any)(
      { pmashId: '8', projectId: '20', what: true },
      ctx,
      { strapi }
    );

    expect(out.data.consensus).toBe(true);
    expect(firePendingInvites).toHaveBeenCalledWith(
      { kind: 'pmash', proposalId: '8', openEntityId: '61' },
      expect.objectContaining({ strapi, lang: 'he' })
    );
  });

  it('a vote that does not complete the consensus sends nothing', async () => {
    const strapi = {
      execute: vi.fn(async (qid: string) =>
        qid === '142getPendmForVote'
          ? { data: { pendm: { data: { id: '30', attributes: { name: 'לוגו', users: [] } } } } }
          : members
      )
    };
    await (voteOnPendmConfig.graphqlOperation as any)(
      { pendId: '30', projectId: '20', what: true },
      context('createOpenMission', '77'),
      { strapi }
    );
    expect(firePendingInvites).not.toHaveBeenCalled();
  });
});
