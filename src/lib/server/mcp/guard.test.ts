import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// The guard reads the caller from the MCP context and Strapi through sendToSer;
// both are stubbed so the test is only about who gets through.
const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../send/sendToSer.js', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));
vi.mock('./audit.js', () => ({ audit: vi.fn() }));

const { createTool } = await import('@mastra/core/tools');
const { wrapMcpTool, keyAllowsProject, filterToKeyProjects, narrowOutput, clearMemberCache } = await import('./guard');
const { resetRateLimits } = await import('./rateLimit');

/** Answers the two lookups the guard makes: members of a rikma, rikma of a mission. */
function strapi({ members = ['42'], missionProject = '89' as string | null } = {}) {
  sendToSer.mockImplementation(async (vars: any, qid: string) => {
    if (qid === 'getProjectPeopleAndRoles') {
      return { data: { project: { data: { id: vars.pid, attributes: { user_1s: { data: members.map((id) => ({ id })) } } } } } };
    }
    if (qid === '36getMissionTimer') {
      return {
        data: {
          mesimabetahalich: {
            data: missionProject ? { id: vars.missionId, attributes: { project: { data: { id: missionProject } } } } : null
          }
        }
      };
    }
    throw new Error(`unexpected qid ${qid}`);
  });
}

const innerExecute = vi.fn(async (input: any) => ({ success: true, got: input }));
const inner = createTool({
  id: 'probe',
  description: 'probe',
  inputSchema: z.object({ projectId: z.string().optional(), missionId: z.string().optional() }),
  execute: innerExecute
});

const run = (tool: any, input: any) => tool.execute(input, {});
const asCaller = (extra: Record<string, unknown> = {}) =>
  getMcpContext.mockReturnValue({ userId: '42', keyId: 'k1', fetchInstance: vi.fn(), ...extra });

beforeEach(() => {
  clearMemberCache();
  resetRateLimits();
  sendToSer.mockReset();
  innerExecute.mockClear();
  getMcpContext.mockReset();
  asCaller();
});

describe('keyAllowsProject / filterToKeyProjects / narrowOutput', () => {
  it('an unscoped key reaches every rikma', () => {
    expect(keyAllowsProject(undefined, '90')).toBe(true);
    expect(keyAllowsProject([], '90')).toBe(true);
  });

  it('a scoped key reaches only its own rikmot', () => {
    expect(keyAllowsProject(['89'], '89')).toBe(true);
    expect(keyAllowsProject(['89'], '90')).toBe(false);
    expect(filterToKeyProjects([{ id: '89' }, { id: '90' }], ['89'])).toEqual([{ id: '89' }]);
  });

  it('narrows listed records and their count, and drops rows with no rikma', () => {
    const out = { missions: [{ projectId: '89' }, { projectId: '90' }, { projectId: null }], totalCount: 3 };
    expect(narrowOutput(out, ['missions'], ['89'])).toEqual({ missions: [{ projectId: '89' }], totalCount: 1 });
    expect(narrowOutput(out, ['missions'], undefined)).toBe(out);
  });
});

describe('wrapMcpTool — project', () => {
  const tool = wrapMcpTool(inner, { tier: 'read', project: 'member' });

  it('lets a member through', async () => {
    strapi({ members: ['42', '7'] });
    const res = await run(tool, { projectId: '89' });
    expect(res.success).toBe(true);
    expect(innerExecute).toHaveBeenCalledOnce();
  });

  it('refuses a non-member before the tool runs', async () => {
    strapi({ members: ['7'] });
    const res = await run(tool, { projectId: '89' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res).toMatchObject({ success: false, denied: true });
    expect(res.message).toMatch(/not a member/);
  });

  it('answers a missing rikma exactly like a foreign one', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: null } } });
    const res = await run(tool, { projectId: '404' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res.message).toMatch(/not a member/);
  });

  it('refuses a rikma outside the key scope even for a member, without a lookup', async () => {
    asCaller({ keyProjects: ['89'] });
    const res = await run(tool, { projectId: '90' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(sendToSer).not.toHaveBeenCalled();
    expect(res.message).toMatch(/limited to other rikmas/);
  });

  it('project:scope enforces the key scope without a membership lookup', async () => {
    asCaller({ keyProjects: ['89'] });
    const scoped = wrapMcpTool(inner, { tier: 'read', project: 'scope' });
    await run(scoped, { projectId: '90' });
    expect(innerExecute).not.toHaveBeenCalled();
    await run(scoped, { projectId: '89' });
    expect(innerExecute).toHaveBeenCalledOnce();
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('an omitted optional projectId is not a project call', async () => {
    const res = await run(tool, {});
    expect(res.success).toBe(true);
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('refuses when there is no authenticated caller', async () => {
    getMcpContext.mockReturnValue(null);
    await run(tool, { projectId: '89' });
    expect(innerExecute).not.toHaveBeenCalled();
  });

  it('leaves the original tool unguarded for the in-app bot', async () => {
    const res = await run(inner, { projectId: '89' });
    expect(res.success).toBe(true);
    expect(sendToSer).not.toHaveBeenCalled();
  });
});

describe('wrapMcpTool — mission', () => {
  it('mission:member lets a member of the mission\'s rikma through', async () => {
    strapi({ members: ['42'], missionProject: '89' });
    const res = await run(wrapMcpTool(inner, { tier: 'read', mission: 'member' }), { missionId: '5' });
    expect(res.success).toBe(true);
  });

  it('mission:member refuses without naming the foreign rikma', async () => {
    strapi({ members: ['7'], missionProject: '89' });
    const res = await run(wrapMcpTool(inner, { tier: 'read', mission: 'member' }), { missionId: '5' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res.message).toBe('Mission 5 is not available.');
  });

  it('mission:scope with an unscoped key needs no lookup', async () => {
    const res = await run(wrapMcpTool(inner, { tier: 'selfWrite', mission: 'scope' }), { missionId: '5' });
    expect(res.success).toBe(true);
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('mission:scope refuses a mission in a rikma outside the key scope', async () => {
    asCaller({ keyProjects: ['90'] });
    strapi({ missionProject: '89' });
    const res = await run(wrapMcpTool(inner, { tier: 'selfWrite', mission: 'scope' }), { missionId: '5' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res.denied).toBe(true);
  });
});

describe('wrapMcpTool — scoped keys', () => {
  it('fills in the only rikma of a single-rikma key', async () => {
    asCaller({ keyProjects: ['89'] });
    const res = await run(wrapMcpTool(inner, { tier: 'read', project: 'scope', scopedKeyNeeds: 'projectId' }), {});
    expect(res.got).toEqual({ projectId: '89' });
  });

  it('asks a multi-rikma key to choose', async () => {
    asCaller({ keyProjects: ['89', '90'] });
    const res = await run(wrapMcpTool(inner, { tier: 'read', project: 'scope', scopedKeyNeeds: 'projectId' }), {});
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res.message).toMatch(/89, 90/);
  });

  it('refuses an omitted missionId for a scoped key', async () => {
    asCaller({ keyProjects: ['89'] });
    const res = await run(wrapMcpTool(inner, { tier: 'selfWrite', mission: 'scope', scopedKeyNeeds: 'missionId' }), {});
    expect(innerExecute).not.toHaveBeenCalled();
    expect(res.denied).toBe(true);
  });

  it('an unscoped key is never asked for either', async () => {
    const res = await run(wrapMcpTool(inner, { tier: 'selfWrite', scopedKeyNeeds: 'missionId' }), {});
    expect(res.success).toBe(true);
  });
});

describe('wrapMcpTool — rate limit', () => {
  it('stops an AI tool after its hourly budget, per key', async () => {
    const tool = wrapMcpTool(inner, { tier: 'prepare', ai: true });
    for (let i = 0; i < 10; i++) expect((await run(tool, {})).success).toBe(true);
    const res = await run(tool, {});
    expect(res).toMatchObject({ success: false, rateLimited: true });
    expect(res.retryAfterSeconds).toBeGreaterThan(0);

    asCaller({ keyId: 'k2' });
    expect((await run(tool, {})).success).toBe(true);
  });
});
