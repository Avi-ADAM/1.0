import { describe, expect, it, vi } from 'vitest';
import { buildRikmaContext, resolveFocus, shapeLead, shapeRole, capList, type RikmaContextLoaders } from './buildRikmaContext';

const details = {
  success: true,
  projectId: '103',
  projectName: 'Calm Coding',
  isMember: true,
  url: 'https://www.1lev1.com/moach/103',
  values: ['care'],
  links: { github: 'https://github.com/x/y' },
  restime: 'feh',
  members: ['maya', 'dan'],
  roles: ['dev'],
  openMissions: [{ id: '1', name: 'a' }],
  missionsInProgress: [],
  openResources: [],
  resourcesInProgress: [],
  products: [{ id: '9', name: 'course', price: 100 }],
  memberWritten: { publicDescription: '<p style="x">A <b>calm</b> course</p>', descripFor: '' }
};

function loaders(over: Partial<RikmaContextLoaders> = {}): RikmaContextLoaders {
  return {
    details: vi.fn(async () => details),
    updates: vi.fn(async () => ({ success: true, totalWaiting: 1, waiting: [{ sentence: 'x' }], whatsNew: { sales: 1 }, work: { tasks: { open: 2, overdue: 0 } } })),
    stats: vi.fn(async () => ({ success: true, windowDays: 7, members: 2, openDecisions: 1 })),
    missions: vi.fn(async () => [
      { id: '222', name: 'Dev', holderName: 'dan', closed: false, roleIds: ['5'], roles: [{ id: '5', name: 'Development' }] },
      { id: '223', name: 'Old', holderName: 'maya', closed: true, roleIds: ['5'], roles: [] }
    ]),
    processes: vi.fn(async () => ({ success: true, processes: [{ processId: '7', title: 'Approach', description: '<p>hi</p>', forumId: '50', items: [] }] })),
    conversation: vi.fn(async () => ({ success: true, messages: [{ username: 'maya', text: 'hello' }] })),
    lead: vi.fn(async () => ({
      success: true,
      url: 'u',
      lead: {
        id: '4', name: 'Studio Noa', email: 'noa@example.com', phone: '050', status: 'talking', message: '<p>wants 3</p>',
        products: [{ id: '9', name: 'course' }, { id: '10', name: 'gone' }], orders: [], activities: [{ kind: 'call' }], details: []
      }
    })),
    products: vi.fn(async () => ({ success: true, products: [{ id: '9', name: 'course', price: 120, pricingMode: 'fixed' }] })),
    product: vi.fn(async () => ({ success: true, product: { id: '9' } })),
    shipping: vi.fn(async () => ({ success: true, configured: false })),
    task: vi.fn(async () => ({ success: true, note: 'n', task: { taskId: '141', roles: [{ id: '5' }] }, rikma: { projectId: '103' } })),
    mission: vi.fn(async () => ({ success: true, mission: { id: '222', name: 'Dev', projectId: '103', tasks: [] } })),
    search: vi.fn(async () => ({ success: true, items: [{ projectId: '103', name: 'checkout' }, { projectId: '8', name: 'other' }] })),
    playbooks: vi.fn(async () => []),
    ...over
  };
}

describe('resolveFocus', () => {
  it('picks the most specific focus and ignores blanks', () => {
    expect(resolveFocus({})).toEqual({ kind: 'general', id: null });
    expect(resolveFocus({ topic: 'x', roleId: ' ' })).toEqual({ kind: 'topic', id: 'x' });
    expect(resolveFocus({ topic: 'x', leadId: '4', actId: '141' })).toEqual({ kind: 'task', id: '141' });
  });
});

describe('capList', () => {
  it('says how many there were', () => {
    expect(capList([1, 2, 3], 2)).toEqual({ items: [1, 2], total: 3, cut: true });
    expect(capList(null)).toEqual({ items: [], total: 0, cut: false });
  });
});

describe('buildRikmaContext', () => {
  it('general: clean description, world now, playbook not yet', async () => {
    const out: any = await buildRikmaContext('103', {}, loaders());
    expect(out.success).toBe(true);
    expect(out.general.memberWritten.description).toBe('A calm course');
    expect(out.general.counts.openMissions).toBe(1);
    expect(out.worldNow.waitingForYou).toHaveLength(1);
    expect(out.worldNow.pulse.openDecisions).toBe(1);
    expect(out.playbook.status).toBe('notYet');
    expect(out.playbook.more.tool).toBe('getPlaybookTool');
    expect(out.focusContext.processes.total).toBe(1);
    expect(out.unavailable).toEqual([]);
  });

  it('refuses a non-member', async () => {
    const out: any = await buildRikmaContext('103', {}, loaders({ details: async () => ({ ...details, isMember: false }) }));
    expect(out).toMatchObject({ success: false, denied: true });
  });

  it('lead: never carries contact details, prices what they wanted today', async () => {
    const out: any = await buildRikmaContext('103', { leadId: '4' }, loaders());
    const json = JSON.stringify(out);
    expect(json).not.toContain('noa@example.com');
    expect(json).not.toContain('"050"');
    const lead = out.focusContext.lead;
    expect(lead.hasContactDetails).toBe(true);
    expect(lead.memberWritten.message).toBe('wants 3');
    expect(lead.products).toEqual([
      expect.objectContaining({ productId: '9', price: 120, stillSold: true }),
      expect.objectContaining({ productId: '10', price: null, stillSold: false })
    ]);
    expect(out.more.map((m: any) => m.tool)).toContain('logLeadActivityTool');
  });

  it("lead of another rikma reads as not found", async () => {
    const out: any = await buildRikmaContext(
      '103',
      { leadId: '4' },
      loaders({ lead: async () => ({ success: false, denied: true, message: 'Lead 4 is not in rikma 103.' }) })
    );
    expect(out).toMatchObject({ success: false, denied: true });
  });

  it('task: refuses a task of another rikma, adds its role', async () => {
    const other: any = await buildRikmaContext(
      '103',
      { actId: '141' },
      loaders({ task: async () => ({ success: true, task: {}, rikma: { projectId: '8' } }) })
    );
    expect(other).toMatchObject({ success: false, denied: true });

    const out: any = await buildRikmaContext('103', { actId: '141' }, loaders());
    expect(out.focusContext.task.task.taskId).toBe('141');
    expect(out.focusContext.task.rikma).toBeUndefined();
    expect(out.focusContext.role).toMatchObject({ roleId: '5', held: true, holders: ['dan'] });
  });

  it('mission: refuses another rikma, finds its role from the running list', async () => {
    const other: any = await buildRikmaContext(
      '103',
      { missionId: '222' },
      loaders({ mission: async () => ({ success: true, mission: { id: '222', projectId: '8' } }) })
    );
    expect(other).toMatchObject({ success: false, denied: true });
    const out: any = await buildRikmaContext('103', { missionId: '222' }, loaders());
    expect(out.focusContext.role.memberWritten.roleName).toBe('Development');
  });

  it('process: unknown id is refused; known one carries its last messages', async () => {
    const missing: any = await buildRikmaContext('103', { processId: '99' }, loaders());
    expect(missing).toMatchObject({ success: false, denied: true });
    const out: any = await buildRikmaContext('103', { processId: '7' }, loaders());
    expect(out.focusContext.process.memberWritten.description).toBe('hi');
    expect(out.focusContext.process.memberWritten.lastMessages).toHaveLength(1);
  });

  it('topic: keeps only matches in this rikma', async () => {
    const out: any = await buildRikmaContext('103', { topic: 'checkout' }, loaders());
    expect(out.focusContext.topic.memberWritten.matches).toEqual([{ projectId: '103', name: 'checkout' }]);
  });

  it('a part that fails is named, not guessed', async () => {
    const out: any = await buildRikmaContext(
      '103',
      {},
      loaders({ updates: async () => ({ success: false }), stats: async () => { throw new Error('x'); } })
    );
    expect(out.success).toBe(true);
    expect(out.worldNow).toBeNull();
    expect(out.unavailable).toEqual(expect.arrayContaining(['worldNow.updates', 'worldNow.pulse']));
  });
});

describe('shapeRole / shapeLead', () => {
  it('a role nobody holds says so', () => {
    expect(shapeRole('6', [{ id: '1', closed: false, roleIds: ['5'], roles: [] }])).toMatchObject({ held: false, holders: [] });
  });
  it('no lead, no shape', () => {
    expect(shapeLead({ success: false }, null)).toBeNull();
  });
});

describe('playbooks in the context', () => {
  const pb = (id: string, roleId: string | null, body = 'how we work', updatedAt = '2026-11-01') => ({
    docId: id, projectId: '103', roleId, roleName: roleId ? 'Development' : null, title: 't', body, updatedAt, by: 'maya'
  });

  it('a role focus carries the rikma-wide and the role playbook', async () => {
    const out: any = await buildRikmaContext('103', { roleId: '5' }, loaders({ playbooks: async () => [pb('1', null), pb('2', '5', 'dev rules')] }));
    expect(out.playbook.status).toBe('present');
    expect(out.playbook.general.docId).toBe('1');
    expect(out.playbook.role.memberWritten.body).toBe('dev rules');
  });

  it("a task focus picks its role's playbook", async () => {
    const out: any = await buildRikmaContext('103', { actId: '141' }, loaders({ playbooks: async () => [pb('2', '5')] }));
    expect(out.playbook.roleId).toBe('5');
    expect(out.playbook.role.docId).toBe('2');
    expect(out.playbook.general).toBeNull();
  });

  it('a long playbook is cut, with the way to the whole', async () => {
    const out: any = await buildRikmaContext('103', {}, loaders({ playbooks: async () => [pb('1', null, 'x'.repeat(5000))] }));
    expect(out.playbook.general.truncated).toBe(true);
    expect(out.playbook.general.memberWritten.body).toHaveLength(4000);
  });

  it('unreadable playbooks are named, the rest still comes', async () => {
    const out: any = await buildRikmaContext('103', {}, loaders({ playbooks: async () => { throw new Error('schema'); } }));
    expect(out.success).toBe(true);
    expect(out.playbook.status).toBe('unavailable');
    expect(out.unavailable).toContain('playbook');
  });
});
