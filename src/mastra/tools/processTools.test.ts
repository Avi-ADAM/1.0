import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
const executeAction = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/send/sendToSer', () => ({ sendToSer: (...a: any[]) => sendToSer(...a) }));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/actions/index.js', () => ({ actionService: { executeAction } }));
vi.mock('../../lib/server/adminToken.js', () => ({ normalizeAdminToken: (t: any) => t ?? 'admin' }));

const { shapeProcess, ATTACHABLE, listRikmaProcessesTool, startProcessTool, attachToProcessTool } = await import(
  './processTools'
);

const run = (tool: any, input: any) => tool.execute(input, {});

beforeEach(() => {
  sendToSer.mockReset();
  executeAction.mockReset();
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
});

describe('shapeProcess', () => {
  it('flattens the stages into one list of objects with their stage', () => {
    const p = shapeProcess({
      id: '7',
      projectId: '89',
      title: 'Approach: community centre',
      description: 'they might fund the workshop',
      mainForumId: '12',
      nextExpectedStage: 'candidates',
      stageCounts: { open: 1 },
      stages: [{ stage: 'open', items: [{ id: '5', type: 'openMission', title: 'run the workshop' }] }]
    });
    expect(p).toMatchObject({ processId: '7', forumId: '12', nextExpectedStage: 'candidates' });
    expect(p.items).toEqual([{ stage: 'open', kind: 'openMission', id: '5', title: 'run the workshop' }]);
    expect(p.url).toMatch(/\/moach\/89\/processes\/7$/);
  });

  it('survives a process with no stages', () => {
    expect(shapeProcess({ id: '7', projectId: '89' }).items).toEqual([]);
  });
});

describe('listRikmaProcesses', () => {
  it('reads the rikma through the processes query', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: { attributes: { forums: { data: [] } } } } } });
    const res: any = await run(listRikmaProcessesTool, { projectId: '89' });
    expect(sendToSer.mock.calls[0][1]).toBe('102projectProcessesQuery');
    expect(res).toMatchObject({ success: true, totalCount: 0 });
  });

  it('reports a missing rikma', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: null } } });
    const res: any = await run(listRikmaProcessesTool, { projectId: '404' });
    expect(res.success).toBe(false);
  });
});

describe('startProcess', () => {
  it('passes the raw text as the description, and returns the process and its forum', async () => {
    executeAction.mockResolvedValue({ success: true, data: { processId: '7', mainForumId: '12' } });
    const res: any = await run(startProcessTool, {
      projectId: '89',
      name: '  Approach: community centre  ',
      description: '  they might fund the workshop  '
    });
    const [action, params] = executeAction.mock.calls[0];
    expect(action).toBe('createProcess');
    expect(params).toEqual({
      projectId: '89',
      name: 'Approach: community centre',
      description: 'they might fund the workshop'
    });
    expect(res).toMatchObject({ success: true, processId: '7', forumId: '12' });
  });

  it('refuses without echoing the action error', async () => {
    executeAction.mockResolvedValue({ success: false, error: { message: 'User is not a member of project 89' } });
    const res: any = await run(startProcessTool, { projectId: '89', name: 'x y' });
    expect(res).toMatchObject({ success: false, denied: true });
    expect(res.message).not.toMatch(/not a member of project/);
  });
});

describe('attachToProcess', () => {
  it('only offers the kinds the action can actually attach', () => {
    expect([...ATTACHABLE]).toEqual(['openMission', 'openMashaabim', 'mesimabetahalich', 'maap', 'pendm', 'pmash']);
  });

  it('attaches an open mission to a process', async () => {
    executeAction.mockResolvedValue({ success: true, data: { attachedVia: 'partof' } });
    const res: any = await run(attachToProcessTool, {
      projectId: '89',
      processId: '7',
      entityType: 'openMission',
      entityId: '5',
      name: 'run the workshop'
    });
    expect(executeAction.mock.calls[0][0]).toBe('attachEntityToProcess');
    expect(res).toMatchObject({ success: true, entityType: 'openMission', entityId: '5' });
  });
});
