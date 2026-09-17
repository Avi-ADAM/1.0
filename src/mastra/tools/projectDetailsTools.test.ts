import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/send/sendToSer', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../../lib/server/mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));

const {
  shapeProjectDetails,
  shapeProjectStats,
  buildLinkUpdate,
  safeUrl,
  getProjectDetailsTool,
  listProjectResourcesTool,
  proposeProjectLinkTool
} = await import(
  './projectDetailsTools'
);

function project(id = '89') {
  return {
    id,
    attributes: {
      projectName: 'Rikma',
      publicDescription: 'public text',
      descripFor: 'inner text',
      restime: 'feh',
      linkToWebsite: 'rikma.example.org',
      githublink: 'javascript:alert(1)',
      drivelink: 'https://drive.google.com/x',
      vallues: { data: [{ id: '4', attributes: { valueName: 'openness' } }, { attributes: { valueName: 'no id' } }] },
      user_1s: { data: [{ id: '42', attributes: { username: 'noa' } }] },
      tafkidims: { data: [{ id: '3', attributes: { roleDescription: 'dev' } }] },
      open_missions: { data: [{ id: '5', attributes: { name: 'design' } }] },
      mesimabetahaliches: {
        data: [{ id: '6', attributes: { name: 'build', users_permissions_user: { data: { id: '42', attributes: { username: 'noa' } } } } }]
      },
      open_mashaabims: { data: [{ id: '8', attributes: { name: 'laptop', kindOf: 'total' } }] },
      mashabetahaliches: { data: [] },
      matanotofs: { data: [{ id: '9', attributes: { name: 'kit', price: 120 } }] }
    }
  };
}

describe('safeUrl', () => {
  it('keeps http(s), adds a missing scheme, drops everything else', () => {
    expect(safeUrl('https://a.org/x')).toBe('https://a.org/x');
    expect(safeUrl('a.org')).toBe('https://a.org/');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html,hi')).toBeNull();
    expect(safeUrl('')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});

describe('shapeProjectDetails', () => {
  it('gives a member the whole picture', () => {
    const d = shapeProjectDetails(project(), '42')!;
    expect(d.isMember).toBe(true);
    expect(d.members).toEqual(['noa']);
    expect(d.missionsInProgress).toEqual([{ id: '6', name: 'build', holder: 'noa' }]);
    expect(d.openResources).toEqual([{ id: '8', name: 'laptop', kind: 'total' }]);
    expect(d.links).toEqual({ website: 'https://rikma.example.org/', drive: 'https://drive.google.com/x' });
    expect(d.memberWritten.descripFor).toBe('inner text');
  });

  it('gives a non-member only the public face', () => {
    const d = shapeProjectDetails(project(), '999')!;
    expect(d.isMember).toBe(false);
    expect(d.members).toBeUndefined();
    expect(d.openMissions).toBeUndefined();
    expect(d.products).toBeUndefined();
    expect(d.restime).toBeUndefined();
    expect(d.links.drive).toBeUndefined();
    expect(d.memberWritten).toEqual({ publicDescription: 'public text', descripFor: '' });
    expect(d.url).toMatch(/\/project\/89$/);
  });

  it('returns null for a missing rikma', () => {
    expect(shapeProjectDetails(null, '42')).toBeNull();
  });
});

describe('tools', () => {
  beforeEach(() => {
    sendToSer.mockReset();
    getMcpContext.mockReset().mockReturnValue({ userId: '999', fetchInstance: vi.fn() });
  });

  it('getProjectDetails hides a hidden QA rikma from outsiders', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: project('88') } } });
    const res: any = await (getProjectDetailsTool as any).execute({ projectId: '88' }, {});
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/not found/);
  });

  it('listProjectResources is members only', async () => {
    sendToSer.mockResolvedValue({ data: { project: { data: project() } } });
    const res: any = await (listProjectResourcesTool as any).execute({ projectId: '89' }, {});
    expect(res.success).toBe(false);
    expect(res.openResources).toBeUndefined();
  });

  it('does not leak a raw backend error', async () => {
    getMcpContext.mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
    sendToSer.mockRejectedValue(new Error('GraphQL: Cannot query field "secret" on type Project'));
    const res: any = await (getProjectDetailsTool as any).execute({ projectId: '89' }, {});
    expect(res.success).toBe(false);
    expect(res.message).not.toMatch(/GraphQL/);
  });
});

describe('shapeProjectStats', () => {
  const count = (total: number) => ({ meta: { pagination: { total } } });

  it('counts, sums hours and finds the latest activity', () => {
    const s = shapeProjectStats(
      {
        project: { data: { id: '89', attributes: { projectName: 'Rikma', user_1s: { data: [{ id: '1' }, { id: '2' }] } } } },
        openMissions: count(3),
        inProgress: count(2),
        openResources: count(1),
        openDecisions: count(4),
        activeTimers: count(1),
        finishedRecent: {
          ...count(2),
          data: [
            { attributes: { noofhours: 5.25, createdAt: '2026-09-10T10:00:00.000Z' } },
            { attributes: { noofhours: 2, createdAt: '2026-09-01T10:00:00.000Z' } }
          ]
        },
        savedRecent: { data: [{ attributes: { totalHours: 1.04 } }, { attributes: { totalHours: null } }] },
        lastDecision: { data: [{ attributes: { createdAt: '2026-09-12T08:00:00.000Z' } }] },
        lastTimer: { data: [] }
      },
      30
    )!;
    expect(s).toMatchObject({
      projectId: '89',
      members: 2,
      openMissions: 3,
      missionsInProgress: 2,
      openResources: 1,
      openDecisions: 4,
      activeTimers: 1,
      missionsFinishedInWindow: 2,
      approvedHoursInWindow: 7.3,
      savedTimerHoursInWindow: 1,
      lastActivityAt: '2026-09-12T08:00:00.000Z'
    });
  });

  it('returns null for a missing rikma and zeros for empty data', () => {
    expect(shapeProjectStats({ project: { data: null } }, 30)).toBeNull();
    const s = shapeProjectStats({ project: { data: { id: '1', attributes: {} } } }, 7)!;
    expect(s.openMissions).toBe(0);
    expect(s.lastActivityAt).toBeNull();
  });
});

describe('proposeProjectLink', () => {
  const executeAction = vi.fn();
  vi.doMock('../../lib/server/actions/index.js', () => ({ actionService: { executeAction } }));
  vi.doMock('../../lib/server/adminToken.js', () => ({ normalizeAdminToken: (t: any) => t ?? 'admin', adminToken: () => 'admin' }));

  beforeEach(() => {
    executeAction.mockReset().mockResolvedValue({ success: true, data: { decisionsCreated: 0 } });
    sendToSer.mockReset().mockResolvedValue({ data: { project: { data: project() } } });
    getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
  });

  it('carries the other links through, so the action cannot null them', () => {
    const update: any = buildLinkUpdate(project().attributes, 'githublink', 'https://github.com/a/b');
    // The action writes every field it is given; anything missing here is wiped.
    expect(update.githublink).toBe('https://github.com/a/b');
    expect(update.drivelink).toBe('https://drive.google.com/x');
    expect(update.linkToWebsite).toBe('rikma.example.org');
    expect(update.publicDescription).toBe('public text');
    expect(update.vallueIds).toEqual(['4']);
  });

  it('refuses a URL that is not http(s) and changes nothing', async () => {
    const res: any = await (proposeProjectLinkTool as any).execute(
      { projectId: '89', kind: 'website', url: 'javascript:alert(1)' },
      {}
    );
    expect(res.success).toBe(false);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it('sets a link and reports it changed directly', async () => {
    const res: any = await (proposeProjectLinkTool as any).execute(
      { projectId: '89', kind: 'github', url: 'github.com/a/b' },
      {}
    );
    const [action, params] = executeAction.mock.calls[0];
    expect(action).toBe('updateProjectDetails');
    expect(params.githublink).toBe('https://github.com/a/b');
    expect(res).toMatchObject({ success: true, decisionOpened: false });
  });

  it('says a decision was opened when the action opened one', async () => {
    executeAction.mockResolvedValue({ success: true, data: { decisionsCreated: 1 } });
    const res: any = await (proposeProjectLinkTool as any).execute(
      { projectId: '89', kind: 'website', url: 'https://rikma.example.org' },
      {}
    );
    expect(res).toMatchObject({ success: true, decisionOpened: true });
    expect(res.message).toMatch(/decision/i);
  });

  it('clears a link when passed an empty string', async () => {
    const res: any = await (proposeProjectLinkTool as any).execute({ projectId: '89', kind: 'drive', url: '' }, {});
    expect(executeAction.mock.calls[0][1].drivelink).toBe('');
    expect(res).toMatchObject({ success: true, url: null });
  });
});
