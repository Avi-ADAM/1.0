import { describe, it, expect, vi, beforeEach } from 'vitest';

const envState: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: envState }));

const { webmcpMode, describeSurface, callWebMcpTool } = await import('./index');

const caller = (userId: string | null) => ({
  userId,
  clientIp: '127.0.0.1',
  lang: 'en',
  fetchInstance: (async () => new Response('{}')) as unknown as typeof fetch
});

describe('webmcpMode', () => {
  beforeEach(() => {
    delete envState.WEBMCP;
  });
  it('is off unless set to read or on', () => {
    expect(webmcpMode()).toBe('off');
    envState.WEBMCP = 'yes';
    expect(webmcpMode()).toBe('off');
    envState.WEBMCP = 'READ';
    expect(webmcpMode()).toBe('read');
    envState.WEBMCP = 'on';
    expect(webmcpMode()).toBe('on');
  });
});

describe('describeSurface', () => {
  it('hands the browser object JSON Schemas and honest hints', () => {
    const tools = describeSurface('/moach/89', true, 'on');
    expect(tools.length).toBeGreaterThan(0);
    for (const t of tools) {
      expect(t.inputSchema.type, t.name).toBe('object');
      expect(t.name).toMatch(/^[A-Za-z0-9_.-]{1,128}$/);
      expect(t.description.length, t.name).toBeGreaterThan(0);
      expect(t.annotations.consequentialHint, t.name).toBe(!t.annotations.readOnlyHint);
    }
    const details = tools.find((t) => t.name === 'getProjectDetailsTool');
    expect(details?.defaults).toEqual({ projectId: '89' });
    expect(details?.annotations.untrustedContentHint).toBe(true);
  });

  it('is empty when off', () => {
    expect(describeSurface('/moach/89', true, 'off')).toEqual([]);
  });
});

describe('callWebMcpTool', () => {
  it('refuses a tool the page never offered', async () => {
    const out = await callWebMcpTool({ tool: 'createMissionTool', input: {}, path: '/moach/89' }, caller('256'), 'on');
    expect(out.status).toBe(403);
    const guest = await callWebMcpTool({ tool: 'getMyUpdatesTool', input: {}, path: '/' }, caller(null), 'on');
    expect(guest.status).toBe(403);
  });

  it('refuses a write in read mode', async () => {
    const out = await callWebMcpTool({ tool: 'timerActionTool', input: {}, path: '/lev' }, caller('256'), 'read');
    expect(out.status).toBe(403);
  });

  it('rejects input that fails the tool schema', async () => {
    const out = await callWebMcpTool({ tool: 'searchCatalogTool', input: { query: 'x' }, path: '/' }, caller(null), 'read');
    expect(out.status).toBe(400);
  });

  it('runs an account-free tool for a guest', async () => {
    const out = await callWebMcpTool({ tool: 'getPlatformInfo', input: {}, path: '/' }, caller(null), 'read');
    expect(out.status).toBe(200);
    expect((out.body as any).info).toBeTruthy();
  });
});
