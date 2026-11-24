import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { env, ctx, members } = vi.hoisted(() => ({
  env: {} as Record<string, string>,
  ctx: { current: null as any },
  members: { ids: new Set<string>() }
}));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('../../lib/server/mcpContext', () => ({ getMcpContext: () => ctx.current }));
vi.mock('../../lib/server/adminToken', () => ({ adminToken: () => 'admin', normalizeAdminToken: (t: any) => t }));

// The membership lookup the operator rule runs, and an action service that runs
// the real growth handlers (the tool already passed the operator check).
vi.mock('../../lib/server/actions/index.js', async () => {
  const { growthConfigs } = await import('../../lib/server/actions/configs/growth');
  const strapiClient = {
    execute: vi.fn(async (qid: string, v: any) => {
      if (qid !== '65checkProjectMembership') throw new Error(`unexpected ${qid}`);
      const ok = members.ids.has(String(v.uid));
      return { data: { usersPermissionsUser: { data: { attributes: { projects_1s: { data: ok ? [{ id: v.projectId }] : [] } } } } } };
    })
  };
  const actionService = {
    executeAction: vi.fn(async (key: string, params: any, context: any) => {
      const cfg = growthConfigs.find((c) => c.key === key)!;
      try {
        const data = await (cfg.graphqlOperation as any)(params, context);
        return { success: true, data };
      } catch (e: any) {
        return { success: false, error: { code: e.code, message: e.message } };
      }
    })
  };
  return { strapiClient, actionService };
});

import { memoryRepository, setGrowthRepositoryForTests } from '../../lib/server/growth/repo';
import {
  growthGetBusinessTool,
  growthLogTool,
  growthMcpEnabled,
  growthOverviewTool,
  growthSaveBusinessTool,
  growthSetStageTool
} from './growthTools';

const call = (tool: any, input: any) => tool.execute(input, {});

beforeEach(() => {
  env.GROWTH_STATE_DIR = '/tmp/growth-test';
  env.GROWTH_PROJECT_ID = '1';
  delete env.GROWTH_OPERATOR_IDS;
  members.ids = new Set(['7']);
  ctx.current = { userId: '7', fetchInstance: fetch, lang: 'en' };
  setGrowthRepositoryForTests(memoryRepository());
});
afterEach(() => setGrowthRepositoryForTests(null));

describe('growth MCP tools', () => {
  it('are off when the module has no store', () => {
    expect(growthMcpEnabled()).toBe(true);
    delete env.GROWTH_STATE_DIR;
    expect(growthMcpEnabled()).toBe(false);
  });

  it('refuse anyone who is not a member of the growth rikma', async () => {
    ctx.current = { userId: '99', fetchInstance: fetch };
    const out = await call(growthOverviewTool, {});
    expect(out.success).toBe(false);
    expect(out.message).toMatch(/platform team/);
    const w = await call(growthSaveBusinessTool, { business: { name: 'X' } });
    expect(w.success).toBe(false);
  });

  it('GROWTH_OPERATOR_IDS narrows access, never widens it', async () => {
    env.GROWTH_OPERATOR_IDS = '8';
    expect((await call(growthOverviewTool, {})).success).toBe(false);
    members.ids.add('8');
    ctx.current = { userId: '8', fetchInstance: fetch };
    expect((await call(growthOverviewTool, {})).success).toBe(true);
  });

  it('refuses a key limited to other rikmas', async () => {
    ctx.current = { userId: '7', fetchInstance: fetch, keyProjects: ['89'] };
    const out = await call(growthOverviewTool, {});
    expect(out.success).toBe(false);
    expect(out.message).toMatch(/limited to other rikmas/);
  });

  it('adds, deduplicates, lists and reads a business', async () => {
    const a = await call(growthSaveBusinessTool, {
      business: { name: 'Olive Catering', website: 'https://olive.example', city: 'Haifa', category: 'catering' }
    });
    expect(a.success).toBe(true);
    expect(a.duplicated).toBe(false);
    const again = await call(growthSaveBusinessTool, { business: { name: 'Other', website: 'http://www.olive.example/' } });
    expect(again.duplicated).toBe(true);
    expect(again.id).toBe(a.id);

    const ov = await call(growthOverviewTool, { query: 'olive' });
    expect(ov.success).toBe(true);
    expect(ov.total).toBe(1);
    expect(ov.businesses[0]).toMatchObject({ id: a.id, name: 'Olive Catering', stage: 'discovered' });
    expect(ov.nextActions.some((n: any) => n.key === 'research')).toBe(true);

    const one = await call(growthGetBusinessTool, { id: a.id });
    expect(one.business.contact.website).toContain('olive.example');
    expect(one.business.page).toContain(`/growth/b/${a.id}`);
  });

  it('an edit changes only the fields it sends', async () => {
    const a = await call(growthSaveBusinessTool, {
      business: {
        name: 'Olive Catering',
        website: 'https://olive.example',
        city: 'Haifa',
        category: 'catering',
        services: ['events', 'weddings'],
        notes: 'Met at the fair',
        lang: 'en'
      }
    });
    const edit = await call(growthSaveBusinessTool, { id: a.id, business: { phone: '050-7654321' } });
    expect(edit.success).toBe(true);
    const { business: b } = await call(growthGetBusinessTool, { id: a.id });
    expect(b).toMatchObject({
      name: 'Olive Catering',
      category: 'catering',
      services: ['events', 'weddings'],
      notes: 'Met at the fair',
      lang: 'en',
      contact: { phone: '050-7654321' },
      place: { city: 'Haifa' }
    });
    expect(b.contact.website).toContain('olive.example');

    // An empty value clears on purpose.
    await call(growthSaveBusinessTool, { id: a.id, business: { notes: '', services: [] } });
    const { business: c } = await call(growthGetBusinessTool, { id: a.id });
    expect(c.notes).toBeNull();
    expect(c.services).toEqual([]);
    expect(c.contact.phone).toBe('050-7654321');

    const noName = await call(growthSaveBusinessTool, { business: { phone: '050-1111111' } });
    expect(noName.success).toBe(false);
  });

  it('do-not-contact forgets the contact details and closes outreach', async () => {
    const a = await call(growthSaveBusinessTool, { business: { name: 'Quiet', email: 'q@q.example', phone: '050-1234567' } });
    const r = await call(growthLogTool, { id: a.id, kind: 'response', response: 'doNotContact' });
    expect(r.success).toBe(true);
    expect(r.stage).toBe('doNotContact');
    const one = await call(growthGetBusinessTool, { id: a.id });
    expect(one.business.contact.email).toBeNull();
    expect(one.business.contact.phone).toBeNull();

    const contacted = await call(growthLogTool, { id: a.id, kind: 'contacted', channel: 'email' });
    expect(contacted.success).toBe(false);
    expect(contacted.message).toContain('CLOSED_DOOR');

    const leave = await call(growthSetStageTool, { id: a.id, stage: 'discovered' });
    expect(leave.success).toBe(false);
    // Still recognised: it is never re-added.
    const back = await call(growthSaveBusinessTool, { business: { name: 'Quiet again', email: 'q@q.example' } });
    expect(back.duplicated).toBe(true);
  });
});
