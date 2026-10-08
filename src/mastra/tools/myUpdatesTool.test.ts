import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ctx, load } = vi.hoisted(() => ({ ctx: { value: null as any }, load: vi.fn() }));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => ctx.value }));
vi.mock('../../lib/server/notices/updates', () => ({ loadMyUpdates: load }));

import { getMyUpdatesTool } from './myUpdatesTool';

const run = (input: Record<string, unknown> = {}) => (getMyUpdatesTool as any).execute(input);

const updates = {
  lang: 'he',
  waiting: [],
  totalWaiting: 0,
  hiddenCount: 0,
  work: {
    missions: { active: 2, running: 0, notStarted: 0, dormantSoon: [{ id: '1', projectId: '5', projectName: 'Gefen' }, { id: '2', projectId: '6', projectName: 'Other' }] },
    tasks: { open: 1, overdue: 0, dueSoon: 0, items: [{ id: '3', projectId: '6', projectName: 'Other' }] }
  },
  whatsNew: { total: 0, byKind: {}, since: 'x' },
  suggestions: { count: 0, fresh: 0 },
  unavailable: []
};

beforeEach(() => {
  load.mockReset();
  load.mockResolvedValue(updates);
});

describe('getMyUpdatesTool', () => {
  it('the site chat reads through the member’s own session', async () => {
    ctx.value = { userId: '261', fetchInstance: fetch, isInternalBot: true, lang: 'en' };
    await run({ rikma: 'Gefen' });
    expect(load).toHaveBeenCalledWith('261', fetch, expect.objectContaining({ door: 'session', lang: 'en', rikma: 'Gefen' }));
  });

  it('an MCP key has no session — it reads through the service door', async () => {
    ctx.value = { userId: '261', fetchInstance: fetch };
    await run({ lang: 'ru' });
    expect(load).toHaveBeenCalledWith('261', fetch, expect.objectContaining({ door: 'service', lang: 'ru' }));
  });

  it('a key limited to some rikmas sees only their work items', async () => {
    ctx.value = { userId: '261', fetchInstance: fetch, keyProjects: ['5'] };
    const out = await run();
    expect(out.work.missions.dormantSoon.map((m: any) => m.id)).toEqual(['1']);
    expect(out.work.tasks.items).toEqual([]);
  });

  it('without a user there is nothing to read', async () => {
    ctx.value = null;
    expect(await run()).toEqual({ success: false, message: 'Not authenticated.' });
    expect(load).not.toHaveBeenCalled();
  });
});
