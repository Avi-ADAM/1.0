import { describe, expect, it, vi, beforeEach } from 'vitest';

const executeAction = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/actions/index.js', () => ({ actionService: { executeAction } }));
vi.mock('../../lib/server/adminToken.js', () => ({ normalizeAdminToken: (t: any) => t ?? 'admin', adminToken: () => 'admin' }));

const {
  forumAllowedByKey,
  shapeConversation,
  listMyConversationsTool,
  readConversationTool,
  postConversationMessageTool
} = await import('./forumTools');

const forum = (id: string, projectId: string | null) => ({
  id,
  kind: 'mission',
  title: `Thread ${id}`,
  projectId,
  projectName: 'Rikma',
  updatedAt: '2026-09-01T00:00:00.000Z',
  messages: [
    { username: 'noa', text: 'first', timestamp: '2026-08-31T00:00:00.000Z' },
    { username: 'dan', text: 'second', timestamp: '2026-09-01T00:00:00.000Z' }
  ]
});

const run = (tool: any, input: any) => tool.execute(input, {});

beforeEach(() => {
  executeAction.mockReset();
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
});

describe('forumAllowedByKey', () => {
  it('lets an unscoped key anywhere', () => {
    expect(forumAllowedByKey(null, undefined)).toBe(true);
    expect(forumAllowedByKey('90', [])).toBe(true);
  });

  it('holds a scoped key to its rikmot, and a rikma-less forum is outside all of them', () => {
    expect(forumAllowedByKey('89', ['89'])).toBe(true);
    expect(forumAllowedByKey('90', ['89'])).toBe(false);
    expect(forumAllowedByKey(null, ['89'])).toBe(false);
  });
});

describe('shapeConversation', () => {
  it('keeps the fields an agent needs and links the thread', () => {
    const c = shapeConversation({ ...forum('5', '89'), lastMessage: { text: 'hi', username: 'noa', timestamp: 't' } });
    expect(c).toMatchObject({ forumId: '5', projectId: '89', kind: 'mission' });
    expect(c.lastMessage).toEqual({ text: 'hi', username: 'noa', at: 't' });
    expect(c.url).toMatch(/\/forum\/5$/);
  });
});

describe('listMyConversations', () => {
  it('filters by rikma and honours the limit', async () => {
    executeAction.mockResolvedValue({ success: true, data: { forums: [forum('1', '89'), forum('2', '90')] } });
    const all: any = await run(listMyConversationsTool, {});
    expect(all.totalCount).toBe(2);

    const one: any = await run(listMyConversationsTool, { projectId: '89' });
    expect(one.conversations.map((c: any) => c.forumId)).toEqual(['1']);
  });

  it('drops conversations outside a scoped key', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    executeAction.mockResolvedValue({
      success: true,
      data: { forums: [forum('1', '89'), forum('2', '90'), forum('3', null)] }
    });
    const res: any = await run(listMyConversationsTool, {});
    expect(res.conversations.map((c: any) => c.forumId)).toEqual(['1']);
  });
});

describe('readConversation', () => {
  it('returns the last messages oldest-first', async () => {
    executeAction.mockResolvedValue({ success: true, data: { forum: forum('1', '89') } });
    const res: any = await run(readConversationTool, { forumId: '1', limit: 1 });
    expect(res.success).toBe(true);
    expect(res.messages).toEqual([{ username: 'dan', text: 'second', at: '2026-09-01T00:00:00.000Z' }]);
  });

  it('refuses a thread the caller does not take part in, without echoing the action error', async () => {
    executeAction.mockResolvedValue({ success: false, error: { message: 'Forum not found or not authorized' } });
    const res: any = await run(readConversationTool, { forumId: '1' });
    expect(res).toMatchObject({ success: false, denied: true });
    expect(res.message).not.toMatch(/authorized/);
  });

  it('refuses a thread outside a scoped key even when the caller takes part in it', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    executeAction.mockResolvedValue({ success: true, data: { forum: forum('2', '90') } });
    const res: any = await run(readConversationTool, { forumId: '2' });
    expect(res).toMatchObject({ success: false, denied: true });
  });
});

describe('postConversationMessage', () => {
  it('posts the trimmed message and reports the id', async () => {
    executeAction.mockResolvedValue({ success: true, data: { messageId: '77' } });
    const res: any = await run(postConversationMessageTool, { forumId: '1', message: '  done today  ' });
    const [action, params] = executeAction.mock.calls[0];
    expect(action).toBe('createChatMessage');
    expect(params).toEqual({ forumId: '1', message: 'done today', via: 'agent' });
    expect(res).toMatchObject({ success: true, messageId: '77' });
  });

  it('refuses when the action refuses', async () => {
    executeAction.mockResolvedValue({ success: false, error: { message: 'not a participant' } });
    const res: any = await run(postConversationMessageTool, { forumId: '1', message: 'hello' });
    expect(res).toMatchObject({ success: false, denied: true });
  });

  it('checks the thread first for a scoped key, and does not post outside it', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    executeAction.mockResolvedValue({ success: true, data: { forum: forum('2', '90') } });

    const res: any = await run(postConversationMessageTool, { forumId: '2', message: 'hello' });

    expect(executeAction).toHaveBeenCalledTimes(1);
    expect(executeAction.mock.calls[0][0]).toBe('getForumThread');
    expect(res).toMatchObject({ success: false, denied: true });
  });

  it('posts for a scoped key inside its rikma', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), keyProjects: ['89'] });
    executeAction
      .mockResolvedValueOnce({ success: true, data: { forum: forum('1', '89') } })
      .mockResolvedValueOnce({ success: true, data: { messageId: '78' } });

    const res: any = await run(postConversationMessageTool, { forumId: '1', message: 'hello' });

    expect(executeAction.mock.calls.map((c) => c[0])).toEqual(['getForumThread', 'createChatMessage']);
    expect(res).toMatchObject({ success: true, messageId: '78' });
  });
});

describe('openRikmaConversation', () => {
  it('returns the existing thread, and says when it had to create one', async () => {
    const { openRikmaConversationTool } = await import('./forumTools');
    executeAction.mockResolvedValue({ success: true, data: { forumId: '12', created: true } });

    const res: any = await run(openRikmaConversationTool, { projectId: '89' });

    expect(executeAction.mock.calls[0][0]).toBe('ensureProjectForum');
    expect(res).toMatchObject({ success: true, forumId: '12', created: true });
    expect(res.url).toMatch(/\/forum\/12$/);
  });

  it('refuses for a non-member without echoing the action error', async () => {
    const { openRikmaConversationTool } = await import('./forumTools');
    executeAction.mockResolvedValue({ success: false, error: { message: 'User is not a member of project 89' } });
    const res: any = await run(openRikmaConversationTool, { projectId: '89' });
    expect(res).toMatchObject({ success: false, denied: true });
    expect(res.message).not.toMatch(/not a member of project/);
  });
});
