// PLAN_MCP_PARTNER_INTEGRATION P1.2–P1.6: the join loop an outside agent runs —
// apply, see where it stands, read a decision, read the money, find people.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitPreview } from '../../lib/revenue/splitPreview';

const execute = vi.fn();
const executeAction = vi.fn();
const getMcpContext = vi.fn();
const loadOfferDeal = vi.fn();
const env: Record<string, string> = {};

vi.mock('../../lib/server/actions/index.js', () => ({
  strapiClient: { execute },
  actionService: { executeAction: (...a: any[]) => executeAction(...a) }
}));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/adminToken.js', () => ({ adminToken: () => 'admin' }));
vi.mock('../../lib/server/deal/offerDeal', () => ({ loadOfferDeal: (...a: any[]) => loadOfferDeal(...a) }));
vi.mock('$env/dynamic/private', () => ({ env }));

const { shapeDecision, getDecisionTool } = await import('./decisionTools');
const { shapeApplications, applyRefusal, applyToMissionTool, listMyApplicationsTool, mcpApplyEnabled } = await import(
  './joinTools'
);
const { shapeLedger, isEffectiveSale, getRikmaLedgerTool } = await import('./ledgerTools');
const { shapePartners, termIds, findPartnersTool } = await import('./partnerTools');

const run = (tool: any, input: any) => tool.execute(input, {});
const rel = (id: string | null, attributes: any = {}) => ({ data: id == null ? null : { id, attributes } });
const coll = (list: any[]) => ({ data: list });
const user = (id: string, username: string) => ({ id, attributes: { username } });
const vote = (uid: string, order = 0, what = true) => ({ what, order, zman: '2026-11-10T00:00:00Z', users_permissions_user: rel(uid) });

beforeEach(() => {
  execute.mockReset();
  executeAction.mockReset();
  loadOfferDeal.mockReset().mockResolvedValue(null);
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
  delete env.MCP_APPLY_ENABLED;
});

// ── P1.4 getDecision ───────────────────────────────────────────────────────

const decision = (attrs: any) => ({ decision: { data: { id: '7', attributes: { kind: 'name', archived: false, ...attrs } } } });
const members = [
  { id: '42', username: 'maya' },
  { id: '43', username: 'dan' },
  { id: '44', username: 'noa' }
];
const NOW = new Date('2026-11-16T00:00:00Z');

describe('shapeDecision', () => {
  it('names who signed the standing round and who has not, with the silence clock', () => {
    const d = shapeDecision(
      decision({
        newname: 'Studio',
        vots: [vote('42'), vote('43')],
        timegrama: rel('1', { date: '2026-11-18T00:00:00Z', done: false })
      }),
      members,
      '42',
      NOW
    )!;
    expect(d.proposed).toBe('Studio');
    expect(d.signedBy.map((s) => s.username)).toEqual(['maya', 'dan']);
    expect(d.waitingFor.map((w) => w.username)).toEqual(['noa']);
    expect(d.youSigned).toBe(true);
    expect(d.deadline).toBe('2026-11-18T00:00:00Z');
    expect(d.silenceApproves).toBe(true);
  });

  it('a counter opens a new round: only votes of the highest order count as signed', () => {
    const d = shapeDecision(decision({ vots: [vote('42', 0), vote('43', 0), vote('43', 1)] }), members, '42', NOW)!;
    expect(d.round).toBe(1);
    expect(d.signedBy.map((s) => s.userId)).toEqual(['43']);
    expect(d.youSigned).toBe(false);
  });

  it('a closed decision waits for nobody and has no clock', () => {
    const d = shapeDecision(
      decision({ archived: true, vots: [vote('42')], timegrama: rel('1', { date: '2026-11-18T00:00:00Z' }) }),
      members,
      '42',
      NOW
    )!;
    expect(d.status).toBe('closed');
    expect(d.waitingFor).toEqual([]);
    expect(d.silenceApproves).toBe(false);
  });

  it('a bilateral kind waits only for its parties', () => {
    const d = shapeDecision(decision({ kind: 'saleClaim', vots: [vote('42')] }), members, '42', NOW, ['42', '43'])!;
    expect(d.waitingFor.map((w) => w.userId)).toEqual(['43']);
  });
});

describe('getDecisionTool', () => {
  const people = { data: { project: { data: { id: '5', attributes: { user_1s: coll(members.map((m) => user(m.id, m.username))) } } } } };

  it('refuses a decision of another rikma as not found', async () => {
    execute.mockImplementation((qid: string) =>
      qid === '159getDecisionForVote' ? { data: decision({ projects: coll([{ id: '6' }]) }) } : people
    );
    const out = await run(getDecisionTool, { projectId: '5', decisionId: '7' });
    expect(out.success).toBe(false);
    expect(out.decision).toBeUndefined();
  });

  it('a saleClaim is visible only to its reporter and holder', async () => {
    execute.mockImplementation((qid: string) => {
      if (qid === '159getDecisionForVote') return { data: decision({ kind: 'saleClaim', projects: coll([{ id: '5' }]) }) };
      if (qid === 'getSaleClaimDecision')
        return { data: { decision: { data: { attributes: { sale: rel('9', { reporter: rel('43'), users_permissions_user: rel('44') }) } } } } };
      return people;
    });
    expect((await run(getDecisionTool, { projectId: '5', decisionId: '7' })).success).toBe(false);

    getMcpContext.mockReturnValue({ userId: '43', fetchInstance: vi.fn() });
    const out = await run(getDecisionTool, { projectId: '5', decisionId: '7' });
    expect(out.success).toBe(true);
    expect(out.decision.waitingFor.map((w: any) => w.userId).sort()).toEqual(['43', '44']);
    expect(out.url).toBe('https://www.1lev1.com/moach/5/votes/decision/7');
  });
});

// ── P1.3 listMyApplications ────────────────────────────────────────────────

const project = rel('5', { projectName: 'Studio', user_1s: coll([user('42', 'maya'), user('43', 'dan'), user('44', 'noa')]) });

describe('shapeApplications', () => {
  it('a countered round shows the counter, not the original terms', () => {
    const [a] = shapeApplications(
      {
        asks: coll([
          {
            id: '11',
            attributes: {
              createdAt: '2026-11-10T00:00:00Z',
              vots: [vote('42', 0), vote('43', 1)],
              timegrama: rel('1', { date: '2026-11-18T00:00:00Z', done: false }),
              open_mission: rel('3', { name: 'Edit the course', noofhours: 20, perhour: 100 }),
              project,
              negopendmissions: coll([
                { id: 'n1', attributes: { ordern: 1, noofhours: 15, perhour: 120, proposedBy: 'project', status: 'proposed' } }
              ])
            }
          }
        ])
      },
      '42',
      NOW
    );
    expect(a.terms).toEqual({ hours: 15, rate: 120 });
    expect(a.countered).toBe(true);
    expect(a.lastProposedBy).toBe('project');
    expect(a.signedBy).toEqual(['dan']);
    expect(a.waitingFor).toEqual(['noa']);
    expect(a.silenceApproves).toBe(true);
    expect(a.url).toBe('https://www.1lev1.com/moach/5/votes/ask/11');
  });

  it('with no rounds the opening terms stand, and resources read too', () => {
    const out = shapeApplications(
      {
        asks: coll([{ id: '11', attributes: { createdAt: '2026-11-01', open_mission: rel('3', { noofhours: 20, perhour: 100 }), project } }]),
        askms: coll([{ id: '12', attributes: { createdAt: '2026-11-05', open_mashaabim: rel('4', { name: 'Camera', hm: 1, price: 500 }), project } }])
      },
      '42',
      NOW
    );
    expect(out.map((a) => a.kind)).toEqual(['resource', 'mission']);
    expect(out[1].terms).toEqual({ hours: 20, rate: 100 });
    expect(out[0].url).toContain('/votes/askm/12');
  });
});

describe('listMyApplicationsTool', () => {
  it('reads for the key owner only and narrows to the key scope', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['6'] });
    execute.mockResolvedValue({ data: { asks: coll([{ id: '11', attributes: { project } }]) } });
    const out = await run(listMyApplicationsTool, {});
    expect(execute.mock.calls[0][0]).toBe('mcpMyApplications');
    expect(execute.mock.calls[0][1]).toEqual({ uid: '42' });
    expect(out.applications).toEqual([]);
  });
});

// ── P1.2 applyToMission ────────────────────────────────────────────────────

const openMission = (attrs: any = {}) => ({
  data: { openMission: { data: { id: '3', attributes: { name: 'Edit', noofhours: 20, perhour: 100, project, ...attrs } } } }
});

describe('applyToMissionTool', () => {
  it('is on unless MCP_APPLY_ENABLED=false', () => {
    expect(mcpApplyEnabled()).toBe(true);
    env.MCP_APPLY_ENABLED = 'true';
    expect(mcpApplyEnabled()).toBe(true);
    env.MCP_APPLY_ENABLED = 'false';
    expect(mcpApplyEnabled()).toBe(false);
    env.MCP_APPLY_ENABLED = ' FALSE ';
    expect(mcpApplyEnabled()).toBe(false);
  });

  it('refuses a taken mission and one outside the key scope', () => {
    expect(applyRefusal(null)).toBe('not-found');
    expect(applyRefusal({ attributes: { archived: true } })).toBe('taken');
    expect(applyRefusal({ attributes: { project } }, ['6'])).toBe('out-of-scope');
    expect(applyRefusal({ attributes: { project } }, ['5'])).toBeNull();
  });

  it('runs the action as the key owner, with the rikma read from the opening', async () => {
    execute.mockResolvedValue(openMission());
    executeAction.mockResolvedValue({ success: true, data: { askId: '11' } });
    const out = await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true });
    const [key, params, context] = executeAction.mock.calls[0];
    expect(key).toBe('applyToMission');
    expect(params).toEqual({ openMissionId: '3', projectId: '5' });
    expect(context.userId).toBe('42');
    expect(out.status).toBe('applied');
    expect(out.url).toBe('https://www.1lev1.com/moach/5/votes/ask/11');
    // An outside candidate: no clock yet, so silence approves nothing.
    expect(out.message).toMatch(/silence approves nothing/);
  });

  it('names the silence deadline when the rikma clock is running', async () => {
    execute.mockResolvedValue(openMission());
    executeAction.mockResolvedValue({ success: true, data: { askId: '11', silenceDeadline: '2026-11-18T19:20:00.000Z' } });
    const out = await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true });
    expect(out.silenceDeadline).toBe('2026-11-18T19:20:00.000Z');
    expect(out.message).toMatch(/by 2026-11-18T19:20:00.000Z, silence approves it/);
  });

  it("a customer deal's gap applies nothing until the user understood she signs too", async () => {
    execute.mockResolvedValue(openMission());
    loadOfferDeal.mockResolvedValue({ clientIds: ['77'] });
    const first = await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true });
    expect(first.needsCustomerSignature).toBe(true);
    expect(executeAction).not.toHaveBeenCalled();

    executeAction.mockResolvedValue({ success: true, data: { askId: '11' } });
    const second = await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true, customerSignatureUnderstood: true });
    expect(second.status).toBe('applied');
  });

  it('a second application returns the standing candidacy, not a new one', async () => {
    execute.mockResolvedValue(openMission());
    executeAction.mockResolvedValue({ success: true, data: { askId: '183', alreadyApplied: true } });
    const out = await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true });
    expect(out.status).toBe('alreadyApplied');
    expect(out.applicationId).toBe('183');
    expect(out.message).toMatch(/Already applied/);
    expect(out.url).toBe('https://www.1lev1.com/moach/5/votes/ask/183');
  });

  it('the solo member takes their own mission at once', async () => {
    execute.mockResolvedValue(openMission());
    executeAction.mockResolvedValue({ success: true, data: { mesimabetahalichId: '8', solo: true } });
    expect((await run(applyToMissionTool, { openMissionId: '3', confirmedWithUser: true })).status).toBe('taken');
  });
});

// ── P1.6 getRikmaLedger ────────────────────────────────────────────────────

const sale = (id: string, holder: string, amount: number, extra: any = {}) => ({
  id,
  attributes: { in: amount, date: `2026-11-0${id}`, splited: false, users_permissions_user: rel(holder), ...extra }
});
const peopleData = { project: { data: { id: '5', attributes: { projectName: 'Studio', user_1s: coll([user('42', 'maya'), user('43', 'dan')]) } } } };
const fmi = (uid: string, total: number) => ({ id: `f${uid}`, attributes: { total, users_permissions_user: rel(uid) } });

describe('shapeLedger', () => {
  const financials = {
    project: {
      data: {
        attributes: {
          finnished_missions: coll([fmi('42', 300), fmi('43', 100)]),
          sales: coll([
            // Sale.matanot is a single relation — the shape Strapi returns.
            sale('1', '43', 1000, { holderStatus: 'self', matanot: rel('m', { name: 'Course' }) }),
            sale('2', '42', 400, { holderStatus: null }),
            sale('3', '43', 9999, { holderStatus: 'open' }),
            sale('4', '42', 50, { holderStatus: 'confirmed', note: 'site-share · paid=50 · from_project=9' })
          ]),
          tosplits: coll([])
        }
      }
    }
  };

  it('counts effective sales only; an open holder claim is a count, never an amount', () => {
    const l = shapeLedger(peopleData, financials, '42');
    expect(l.sales.map((s) => s.saleId)).not.toContain('3');
    expect(l.totals.income).toBe(1450);
    expect(l.salesAwaitingHolderConsent).toBe(1);
    expect(JSON.stringify(l)).not.toContain('9999');
  });

  it('a product sale names its product', () => {
    const l = shapeLedger(peopleData, financials, '42');
    expect(l.sales.find((x) => x.saleId === '1')).toMatchObject({ source: 'product', product: 'Course' });
  });

  it('a site-share sale shows its parsed source, never the note', () => {
    const l = shapeLedger(peopleData, financials, '42');
    const s = l.sales.find((x) => x.saleId === '4')!;
    expect(s).toMatchObject({ source: 'siteShare', fromRikmaId: '9' });
    expect(JSON.stringify(l)).not.toContain('site-share ·');
  });

  it('"if we split now" is splitPreview over the effective sales', () => {
    const l = shapeLedger(peopleData, financials, '42');
    const effective = financials.project.data.attributes.sales.data.filter(isEffectiveSale);
    const p = splitPreview({ users: peopleData.project.data.attributes.user_1s.data, fmiData: [fmi('42', 300), fmi('43', 100)], sales: effective });
    const me = p.rows.find((r) => r.uid === '42')!;
    expect(l.you.fairShareOfUnsplit).toBeCloseTo(me.x, 2);
    expect(l.you.holdingUnsplit).toBe(450);
    expect(l.you.wouldReceive).toEqual([{ from: 'dan', amount: Math.round(me.meca * 100) / 100 }]);
  });
});

// A split both signed (finished), its transfer maya → dan 400 not yet confirmed.
const pendingTransfers = {
  project: {
    data: {
      id: '5',
      attributes: {
        tosplits: coll([
          {
            id: '9',
            attributes: {
              name: 'Launch split',
              halukas: coll([{ id: 'h1', attributes: { amount: 400, senderconf: false, usersend: rel('42'), userrecive: rel('43') } }])
            }
          }
        ])
      }
    }
  }
};

describe('transfers to confirm', () => {
  it('a signed split is not open, but its unconfirmed transfer still shows', () => {
    const l = shapeLedger(peopleData, { project: { data: { attributes: { tosplits: coll([]), sales: coll([]) } } } }, '43', pendingTransfers);
    expect(l.openSplits).toEqual([]);
    expect(l.transfersToConfirm).toEqual([
      { splitId: '9', splitName: 'Launch split', from: 'maya', to: 'dan', amount: 400, senderSaysSent: false, involvesYou: true }
    ]);
  });

  it('without the read, the list is empty rather than invented', () => {
    expect(shapeLedger(peopleData, {}, '43').transfersToConfirm).toEqual([]);
  });
});

describe('getRikmaLedgerTool', () => {
  it('reports a missing rikma', async () => {
    execute.mockResolvedValue({ data: { project: { data: null } } });
    expect((await run(getRikmaLedgerTool, { projectId: '5' })).success).toBe(false);
  });

  it('reads the transfers still to confirm, and says so when that read fails', async () => {
    execute.mockImplementation(async (qid: string) => {
      if (qid === 'getProjectPeopleAndRoles') return { data: peopleData };
      if (qid === 'mcpUnconfirmedTransfers') return { data: pendingTransfers };
      return { data: { project: { data: { attributes: { tosplits: coll([]), sales: coll([]) } } } } };
    });
    const ok = await run(getRikmaLedgerTool, { projectId: '5' });
    expect(ok.transfersToConfirm).toHaveLength(1);
    expect(ok.unavailable).toBeUndefined();

    execute.mockImplementation(async (qid: string) => {
      if (qid === 'getProjectPeopleAndRoles') return { data: peopleData };
      if (qid === 'mcpUnconfirmedTransfers') throw new Error('Forbidden access');
      return { data: {} };
    });
    const partial = await run(getRikmaLedgerTool, { projectId: '5' });
    expect(partial.success).toBe(true);
    expect(partial.unavailable).toEqual(['transfersToConfirm']);
  });
});

// ── P1.5 findPartners ──────────────────────────────────────────────────────

describe('findPartners', () => {
  const data = {
    named: {
      meta: { pagination: { total: 1 } },
      data: [
        { id: '43', attributes: { username: 'dan', findableByAgents: true, email: 'x@y.z', skills: coll([{ attributes: { skillName: 'Video editing' } }]) } },
        { id: '44', attributes: { username: 'noa', findableByAgents: false } }
      ]
    },
    all: { meta: { pagination: { total: 3 } } }
  };

  it('names only the opted-in, counts everyone else, never leaks contact details', () => {
    const out = shapePartners(data, '42', 10);
    expect(out.people.map((p) => p.username)).toEqual(['dan']);
    expect(out.people[0].profileUrl).toBe('https://www.1lev1.com/user/43');
    expect(out.matching).toBe(3);
    expect(out.notNamed).toBe(2);
    expect(JSON.stringify(out)).not.toContain('@');
    expect(JSON.stringify(out)).not.toContain('noa');
  });

  // A Hebrew entry matched; members hold its default-locale sibling 12.
  const terms = {
    data: {
      skills: coll([{ id: '31', attributes: { localizations: coll([{ id: '12' }]) } }]),
      tafkidims: coll([])
    }
  };

  it('collects matched entries with their localizations, without duplicates', () => {
    expect(
      termIds({
        skills: coll([
          { id: '31', attributes: { localizations: coll([{ id: '12' }]) } },
          { id: '12', attributes: { localizations: coll([{ id: '31' }]) } }
        ]),
        tafkidims: coll([{ id: '5', attributes: {} }])
      })
    ).toEqual({ skillIds: ['31', '12'], roleIds: ['5'] });
  });

  it('looks people up by catalogue id, leaves the key owner out, and points at a mission for the unnamed', async () => {
    execute.mockImplementation((qid: string) => (qid === 'mcpPartnerTerms' ? terms : { data }));
    const out = await run(findPartnersTool, { query: ' editing ', limit: 3 });
    expect(execute.mock.calls[0][0]).toBe('mcpPartnerTerms');
    expect(execute.mock.calls[0][1]).toEqual({ q: 'editing' });
    expect(execute.mock.calls[1][0]).toBe('mcpFindPartners');
    // No role matched: a never-used id keeps `in` well-formed.
    expect(execute.mock.calls[1][1]).toEqual({ skillIds: ['31', '12'], roleIds: ['0'], uid: '42', limit: 3 });
    expect(out.notNamed).toBe(2);
    expect(out.hint).toContain('prepareMissionTool');
  });

  it('no matching entry: no people query at all, and a zero', async () => {
    execute.mockResolvedValue({ data: { skills: coll([]), tafkidims: coll([]) } });
    const out = await run(findPartnersTool, { query: 'zzz' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ success: true, matching: 0, people: [] });
  });

  it('before the opt-in field is deployed, it counts and names nobody', async () => {
    execute.mockImplementation((qid: string) => {
      if (qid === 'mcpPartnerTerms') return terms;
      if (qid === 'mcpFindPartners') throw new Error('Cannot query field "findableByAgents"');
      return { data: { all: { meta: { pagination: { total: 4 } } } } };
    });
    const out = await run(findPartnersTool, { query: 'editing' });
    expect(execute.mock.calls[2][0]).toBe('mcpCountPartners');
    expect(out).toMatchObject({ success: true, matching: 4, notNamed: 4, people: [] });
  });
});
