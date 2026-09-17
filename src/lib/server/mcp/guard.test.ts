import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// The guard reads the caller from the MCP context and member ids through
// sendToSer; both are stubbed so the test is only about who gets through.
const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../send/sendToSer.js', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));

const { createTool } = await import('@mastra/core/tools');
const { guardProjectTool, keyAllowsProject, filterToKeyProjects, clearMemberCache } = await import('./guard');

function membersResponse(ids: string[]) {
  return {
    data: { project: { data: { id: '89', attributes: { user_1s: { data: ids.map((id) => ({ id })) } } } } }
  };
}

const innerExecute = vi.fn(async () => ({ success: true }));
const inner = createTool({
  id: 'probe',
  description: 'probe',
  inputSchema: z.object({ projectId: z.string().optional() }),
  execute: innerExecute
});

const run = (tool: any, input: any) => tool.execute(input, {});

beforeEach(() => {
  clearMemberCache();
  sendToSer.mockReset();
  innerExecute.mockClear();
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
});

describe('keyAllowsProject / filterToKeyProjects', () => {
  it('an unscoped key reaches every rikma', () => {
    expect(keyAllowsProject(undefined, '90')).toBe(true);
    expect(keyAllowsProject([], '90')).toBe(true);
  });

  it('a scoped key reaches only its own rikmot', () => {
    expect(keyAllowsProject(['89'], '89')).toBe(true);
    expect(keyAllowsProject(['89'], '90')).toBe(false);
    expect(filterToKeyProjects([{ id: '89' }, { id: '90' }], ['89'])).toEqual([{ id: '89' }]);
  });
});

describe('guardProjectTool', () => {
  it('lets a member through', async () => {
    sendToSer.mockResolvedValue(membersResponse(['42', '7']));
    const res = await run(guardProjectTool(inner), { projectId: '89' });
    expect(res).toEqual({ success: true });
    expect(innerExecute).toHaveBeenCalledOnce();
  });

  it('refuses a non-member before the tool runs', async () => {
    sendToSer.mockResolvedValue(membersResponse(['7']));
    const res = await run(guardProjectTool(inner), { projectId: '89' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(JSON.stringify(res)).toMatch(/not a member/);
  });

  it('answers a missing rikma exactly like a foreign one', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: null } } });
    const res = await run(guardProjectTool(inner), { projectId: '404' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(JSON.stringify(res)).toMatch(/not a member/);
  });

  it('refuses a rikma outside the key scope even for a member, without a lookup', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    const res = await run(guardProjectTool(inner), { projectId: '90' });
    expect(innerExecute).not.toHaveBeenCalled();
    expect(sendToSer).not.toHaveBeenCalled();
    expect(JSON.stringify(res)).toMatch(/limited to other rikmas/);
  });

  it('requireMember:false still enforces the key scope', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    const tool = guardProjectTool(inner, { requireMember: false });
    await run(tool, { projectId: '90' });
    expect(innerExecute).not.toHaveBeenCalled();

    await run(tool, { projectId: '89' });
    expect(innerExecute).toHaveBeenCalledOnce();
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('an omitted optional projectId is not a project call', async () => {
    const res = await run(guardProjectTool(inner), {});
    expect(res).toEqual({ success: true });
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('refuses when there is no authenticated caller', async () => {
    getMcpContext.mockReturnValue(null);
    await run(guardProjectTool(inner), { projectId: '89' });
    expect(innerExecute).not.toHaveBeenCalled();
  });

  it('leaves the original tool unguarded for the in-app bot', async () => {
    guardProjectTool(inner);
    const res = await run(inner, { projectId: '89' });
    expect(res).toEqual({ success: true });
    expect(sendToSer).not.toHaveBeenCalled();
  });
});
