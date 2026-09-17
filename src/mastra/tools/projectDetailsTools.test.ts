import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/send/sendToSer', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../../lib/server/mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));

const { shapeProjectDetails, shapeProjectStats, safeUrl, getProjectDetailsTool, listProjectResourcesTool } = await import(
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
      vallues: { data: [{ attributes: { valueName: 'openness' } }] },
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
