// PLAN_MCP_PARTNER_INTEGRATION P0.5–P0.7: the three reads an outside agent
// needs to find a way in and to see what a member owns.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memberShares } from '../../lib/revenue/memberShares';

const execute = vi.fn();
const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/server/actions/index.js', () => ({ strapiClient: { execute } }));
vi.mock('../../lib/send/sendToSer', () => ({ sendToSer: (...a: any[]) => sendToSer(...a) }));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/discovery/hiddenProjects.js', () => ({
  isHiddenProject: (id: string) => id === '999'
}));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

const { shapeMatches, listMyMatchesTool } = await import('./matchTools');
const { shapeRikmaDirectory, searchRikmasTool } = await import('./conciergeTools');
const { shapeStake, getMyStakeTool } = await import('./stakeTools');

const run = (tool: any, input: any) => tool.execute(input, {});

beforeEach(() => {
  execute.mockReset();
  sendToSer.mockReset();
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
});

// ── P0.5 listMyMatches ─────────────────────────────────────────────────────

const suggestion = (id: string, projectId: string, extra: any = {}) => ({
  id: `s${id}`,
  attributes: {
    score: 7,
    status: 'new',
    kind: 'mission',
    matchedOn: { skills: ['3'], roles: ['5'], workWays: [] },
    open_mission: {
      data: {
        id,
        attributes: {
          name: `Mission ${id}`,
          descrip: '<p>Build the <b>site</b></p>',
          noofhours: 20,
          perhour: 80,
          iskvua: false,
          project: { data: { id: projectId, attributes: { projectName: 'Garden' } } },
          skills: { data: [{ id: '3', attributes: { skillName: 'Svelte' } }, { id: '4', attributes: { skillName: 'SQL' } }] },
          tafkidims: { data: [{ id: '5', attributes: { roleDescription: 'Developer' } }] },
          work_ways: { data: [] },
          ...extra
        }
      }
    }
  }
});

describe('shapeMatches', () => {
  it('names what it matched on and links the public mission page', () => {
    const [m] = shapeMatches({ matchSuggestions: { data: [suggestion('11', '7')] } }, 10);
    expect(m).toMatchObject({
      openMissionId: '11',
      score: 7,
      matchedOn: { skills: ['Svelte'], roles: ['Developer'], workWays: [] },
      hours: 20,
      hourlyRate: 80,
      rikmaId: '7',
      rikmaName: 'Garden',
      description: 'Build the site'
    });
    expect(m.url).toMatch(/\/availableMission\/11$/);
  });

  it('skips hidden rikmas and honours the limit', () => {
    const data = { matchSuggestions: { data: [suggestion('1', '999'), suggestion('2', '7'), suggestion('3', '7')] } };
    expect(shapeMatches(data, 1).map((m) => m.openMissionId)).toEqual(['2']);
  });
});

describe('listMyMatches', () => {
  it("always reads the key owner's suggestions — the id is never an input", async () => {
    execute.mockResolvedValue({ data: { matchSuggestions: { data: [suggestion('11', '7')] } } });
    const res: any = await run(listMyMatchesTool, { limit: 5, idL: '1' });
    expect(execute.mock.calls[0][0]).toBe('209levMatchSuggestions');
    expect(execute.mock.calls[0][1]).toEqual({ idL: '42' });
    expect(res).toMatchObject({ success: true, totalFound: 1 });
  });

  it('an empty list says how to get matches', async () => {
    execute.mockResolvedValue({ data: { matchSuggestions: { data: [] } } });
    const res: any = await run(listMyMatchesTool, {});
    expect(res.hint).toMatch(/profile/);
  });
});

// ── P0.6 searchRikmas ──────────────────────────────────────────────────────

const rikma = (id: string, name: string, desc = '') => ({
  id,
  attributes: {
    projectName: name,
    publicDescription: desc,
    city: 'Haifa',
    user_1s: { data: [{ id: '1' }, { id: '2' }] },
    open_missions: { data: [{ id: 'a' }] },
    open_mashaabims: { data: [] },
    matanotofs: { data: [{ id: 'p' }, { id: 'q' }] }
  }
});

describe('shapeRikmaDirectory', () => {
  it('counts members and openings, skips hidden rikmas, filters by text', () => {
    const data = { projects: { data: [rikma('999', 'Garden QA'), rikma('5', 'Community garden', '<p>veg</p>'), rikma('6', 'Bakery')] } };
    const out = shapeRikmaDirectory(data, 'garden', 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      rikmaId: '5',
      members: 2,
      openMissions: 1,
      openResources: 0,
      products: 2,
      description: 'veg'
    });
    expect(out[0].url).toMatch(/\/project\/5$/);
  });

  it('an empty query lists the newest', () => {
    expect(shapeRikmaDirectory({ projects: { data: [rikma('5', 'A'), rikma('6', 'B')] } }, '', 10)).toHaveLength(2);
  });
});

describe('searchRikmas', () => {
  it('reads the public directory qid', async () => {
    sendToSer.mockResolvedValue({ data: { projects: { data: [rikma('5', 'Garden')] } } });
    const res: any = await run(searchRikmasTool, { query: 'gar' });
    expect(sendToSer.mock.calls[0][1]).toBe('281discoverProjects');
    expect(res).toMatchObject({ success: true, totalFound: 1 });
  });
});

// ── P0.7 getMyStake ────────────────────────────────────────────────────────

const people = {
  project: {
    data: {
      id: '7',
      attributes: {
        projectName: 'Garden',
        user_1s: { data: [{ id: '42', attributes: { username: 'me' } }, { id: '43', attributes: { username: 'dana' } }] }
      }
    }
  }
};
const owner = (id: string) => ({ data: { id, attributes: { username: 'x' } } });
const financials = {
  project: {
    data: {
      attributes: {
        finnished_missions: {
          data: [
            { id: 'f1', attributes: { missionName: 'Site', noofhours: 10, perhour: 100, total: 1000, users_permissions_user: owner('42') } },
            { id: 'f2', attributes: { missionName: 'Beds', noofhours: 5, perhour: 100, total: 500, users_permissions_user: owner('43') } },
            // someone who left — counts in the total, not in a member's row
            { id: 'f3', attributes: { missionName: 'Old', noofhours: 5, perhour: 100, total: 500, users_permissions_user: owner('77') } }
          ]
        },
        rikmashes: { data: [{ id: 'r1', attributes: { name: 'Tools', total: 1000, users_permissions_user: owner('43') } }] },
        stipend_payments: { data: [] }
      }
    }
  }
};

describe('shapeStake', () => {
  it('equals memberShares on the same rows (parity)', () => {
    const stake = shapeStake(people, financials, '42');
    const fin = financials.project.data.attributes;
    const expected = memberShares({
      users: people.project.data.attributes.user_1s.data,
      fmiData: fin.finnished_missions.data,
      rikmashes: fin.rikmashes.data,
      stipendPayments: fin.stipend_payments.data
    });
    expect(stake.totalValue).toBe(expected.net);
    expect(stake.members.map((m) => m.sharePercent)).toEqual(
      expected.rows.map((r) => Math.round(r.p * 100) / 100)
    );
    expect(stake.formerMembersValue).toBe(expected.others);
  });

  it('marks the caller and lists what stands behind each share', () => {
    const stake = shapeStake(people, financials, '42');
    expect(stake.you).toEqual({ sharePercent: 33.33, value: 1000, approvedHours: 10 });
    const dana = stake.members.find((m) => m.username === 'dana')!;
    expect(dana.finishedMissions).toEqual([{ name: 'Beds', hours: 5, hourlyRate: 100, value: 500 }]);
    expect(dana.resources).toEqual([{ name: 'Tools', value: 1000 }]);
  });
});

describe('getMyStake', () => {
  it('reads people and financials for the asked rikma', async () => {
    execute.mockImplementation(async (qid: string) => (qid === 'getProjectPeopleAndRoles' ? { data: people } : { data: financials }));
    const res: any = await run(getMyStakeTool, { projectId: '7' });
    expect(execute.mock.calls.map((c) => c[0]).sort()).toEqual(['getProjectFinancials', 'getProjectPeopleAndRoles']);
    expect(res).toMatchObject({ success: true, rikmaName: 'Garden' });
    expect(res.splitPageUrl).toMatch(/\/moach\/7\/split$/);
  });

  it('an unknown rikma is reported, not shown as zero shares', async () => {
    execute.mockResolvedValue({ data: { project: { data: null } } });
    const res: any = await run(getMyStakeTool, { projectId: '404' });
    expect(res.success).toBe(false);
  });
});
