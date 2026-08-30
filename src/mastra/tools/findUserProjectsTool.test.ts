import { describe, expect, it, vi, beforeEach } from 'vitest';

// The tool reaches Strapi through sendToSer and reads its caller identity from
// the MCP context; both are stubbed so the test is purely about who is allowed
// to ask for whose projects.
const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/send/sendToSer', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../../lib/server/mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));

const { findUserProjectsTool } = await import('./findUserProjectsTool');

/** A Strapi response carrying one project, whoever it was asked for. */
function projectsResponse() {
  return {
    data: {
      usersPermissionsUser: {
        data: { attributes: { projects_1s: { data: [{ id: '7', attributes: { projectName: 'Rikma' } }] } } }
      }
    }
  };
}

/** The userId sendToSer was actually called with — the thing that matters. */
function queriedUserId() {
  return sendToSer.mock.calls[0]?.[2];
}

const run = (input: any) => (findUserProjectsTool as any).execute(input, {});

beforeEach(() => {
  sendToSer.mockReset().mockResolvedValue(projectsResponse());
  getMcpContext.mockReset();
});

describe('findUserProjectsTool identity handling', () => {
  it('falls back to the authenticated caller when userId is omitted', async () => {
    // An external MCP client has no way to know its own Strapi id, so omitting
    // it is the normal case rather than an error.
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn() });

    const res = await run({});

    expect(res.success).toBe(true);
    expect(queriedUserId()).toBe(42);
  });

  it('refuses to list another user\'s projects for an API-key caller', async () => {
    // External requests run against the service token, so an unchecked userId
    // here would read any account's rikmot.
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn() });

    const res = await run({ userId: '99' });

    expect(res.success).toBe(false);
    expect(res.projects).toEqual([]);
    expect(res.message).toMatch(/only list the projects of the authenticated user/i);
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('allows an API-key caller to name its own id explicitly', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn() });

    const res = await run({ userId: '42' });

    expect(res.success).toBe(true);
    expect(queriedUserId()).toBe(42);
  });

  it('lets the internal bot act for the user it already authenticated via JWT', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn(), isInternalBot: true });

    const res = await run({ userId: '99' });

    expect(res.success).toBe(true);
    expect(queriedUserId()).toBe(99);
  });

  it('fails closed when there is no context at all', async () => {
    getMcpContext.mockReturnValue(null);

    const res = await run({ userId: '42' });

    expect(res.success).toBe(false);
    expect(sendToSer).not.toHaveBeenCalled();
  });
});

describe('findUserProjectsTool contract', () => {
  it('marks userId optional so an external client can call it at all', () => {
    const shape = (findUserProjectsTool.inputSchema as any).shape;
    expect(shape.userId.isOptional()).toBe(true);
  });
});
