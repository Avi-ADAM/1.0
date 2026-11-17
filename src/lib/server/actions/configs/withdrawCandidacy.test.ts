import { describe, expect, it, vi } from 'vitest';

const { withdrawCandidacyConfig, planWithdrawal, withoutAsked } = await import('./withdrawCandidacy');

/**
 * A candidate takes back their own open candidacy. In the Nas demo the only way
 * out was deleting Ask 183 in Strapi; now the candidate archives it themself,
 * its clock stops, and the opening stays open for a later application.
 */

const CANDIDATE = '270';
const MEMBER = '271';

function askNode(over: Record<string, any> = {}, om: Record<string, any> = {}) {
  return {
    id: '183',
    attributes: {
      archived: false,
      lapsedAt: null,
      users_permissions_user: { data: { id: CANDIDATE, attributes: { username: 'nas' } } },
      project: { data: { id: '105', attributes: { projectName: 'Bakery' } } },
      open_mission: { data: { id: '302', attributes: { name: 'Bake bread', archived: false, isRishon: false, ...om } } },
      ...over
    }
  };
}

function world(node: any, side: 'ask' | 'askm' = 'ask', askeds: string[] = ['302', '400']) {
  const calls: Array<[string, any]> = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push([qid, vars]);
      switch (qid) {
        case 'askForWithdrawal':
          return { data: { ask: { data: side === 'ask' ? node : null } } };
        case 'askmForWithdrawal':
          return { data: { askm: { data: side === 'askm' ? node : null } } };
        case 'getActiveTimegramaForAsk':
        case 'getActiveTimegramaForAskm':
          return { data: { timegramas: { data: [{ id: '900' }] } } };
        case '80usersPermissionsUserWithAskeds':
          return { data: { usersPermissionsUser: { data: { attributes: { askeds: { data: askeds.map((id) => ({ id })) } } } } } };
        default:
          return { data: {} };
      }
    })
  };
  return { strapi, calls, qids: () => calls.map((c) => c[0]) };
}

const run = (w: ReturnType<typeof world>, params: Record<string, any>, userId = CANDIDATE) =>
  (withdrawCandidacyConfig.graphqlOperation as any)(params, { userId, jwt: 'jwt', fetch: vi.fn() }, { strapi: w.strapi });

describe('planWithdrawal', () => {
  it('lets the candidate withdraw their open Ask', () => {
    const plan = planWithdrawal(askNode(), 'ask', CANDIDATE);
    expect(plan).toMatchObject({ id: '183', projectId: '105', openingId: '302', openingName: 'Bake bread', candidateName: 'nas' });
  });
  it('refuses anyone else — a member cannot withdraw it for them', () => {
    expect(planWithdrawal(askNode(), 'ask', MEMBER)).toEqual({ reason: 'notYours' });
  });
  it('has nothing to take back once it is archived or lapsed', () => {
    expect(planWithdrawal(askNode({ archived: true }), 'ask', CANDIDATE)).toEqual({ reason: 'alreadyClosed' });
    expect(planWithdrawal(askNode({ lapsedAt: '2026-11-01T00:00:00Z' }), 'ask', CANDIDATE)).toEqual({ reason: 'alreadyClosed' });
  });
  it('an offer the rikma made to the person is answered, not withdrawn', () => {
    expect(planWithdrawal(askNode({}, { isRishon: true }), 'ask', CANDIDATE)).toEqual({ reason: 'assignedOffer' });
  });
  it('an Askm without an open resource is not an offer', () => {
    const node = { id: '7', attributes: { archived: false, users_permissions_user: { data: { id: CANDIDATE } }, open_mashaabim: { data: null } } };
    expect(planWithdrawal(node, 'askm', CANDIDATE)).toEqual({ reason: 'notAnOffer' });
  });
  it('not found', () => {
    expect(planWithdrawal(null, 'ask', CANDIDATE)).toEqual({ reason: 'notFound' });
  });
});

describe('withoutAsked', () => {
  it('drops only the opening', () => {
    expect(withoutAsked(['302', '400'], '302')).toEqual(['400']);
  });
});

describe('withdrawCandidacy handler', () => {
  it('archives the Ask, stops its clock and frees the opening in askeds', async () => {
    const w = world(askNode());
    const out = await run(w, { side: 'ask', id: '183', projectId: '105' });
    expect(out.data).toMatchObject({ withdrawn: true, id: '183', openingId: '302', candidateName: 'nas' });
    expect(w.calls).toContainEqual(['withdrawAsk', { id: '183' }]);
    expect(w.calls).toContainEqual(['mrSetTimegramaDone', { id: '900', done: true }]);
    expect(w.calls).toContainEqual(['81updateAskeds', { userId: CANDIDATE, askedsList: ['400'] }]);
    // Archive, never delete; and the opening itself is not touched.
    expect(w.qids().some((q) => /delete/i.test(q))).toBe(false);
    expect(w.qids().some((q) => /OpenMission/i.test(q))).toBe(false);
  });

  it('refuses another user and writes nothing', async () => {
    const w = world(askNode());
    await expect(run(w, { side: 'ask', id: '183', projectId: '105' }, MEMBER)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(w.qids()).toEqual(['askForWithdrawal']);
  });

  it('refuses a candidacy from another rikma than the one named', async () => {
    const w = world(askNode());
    await expect(run(w, { side: 'ask', id: '183', projectId: '999' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(w.qids()).not.toContain('withdrawAsk');
  });

  it('withdraws an Askm on an open resource', async () => {
    const node = {
      id: '44',
      attributes: {
        archived: false,
        users_permissions_user: { data: { id: CANDIDATE, attributes: { username: 'nas' } } },
        project: { data: { id: '105', attributes: { projectName: 'Bakery' } } },
        open_mashaabim: { data: { id: '12', attributes: { name: 'Oven' } } }
      }
    };
    const w = world(node, 'askm');
    const out = await run(w, { side: 'askm', id: '44', projectId: '105' });
    expect(out.data).toMatchObject({ side: 'askm', openingName: 'Oven' });
    expect(w.calls).toContainEqual(['withdrawAskm', { id: '44' }]);
    expect(w.calls).toContainEqual(['mrSetTimegramaDone', { id: '900', done: true }]);
    expect(w.qids()).not.toContain('81updateAskeds');
  });
});

describe('withdrawCandidacy notification', () => {
  it('tells the members in one line who withdrew from what', () => {
    const t = withdrawCandidacyConfig.notification!.templatesFor!({}, { data: { candidateName: 'nas', openingName: 'Bake bread' } })!;
    expect(t.body.en).toBe('nas withdrew their candidacy for "Bake bread"');
    expect(t.body.he).toContain('nas');
    expect(withdrawCandidacyConfig.notification!.recipients.config?.excludeSender).toBe(true);
  });
});
