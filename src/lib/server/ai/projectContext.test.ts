import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  extractProjectId,
  buildProjectContext,
  getProjectContext,
  summarizeProjectContext,
  clearProjectContextCache,
  type ProjectContext
} from './projectContext';

// ── extractProjectId ─────────────────────────────────────
describe('extractProjectId', () => {
  it('extracts the id from a /moach/ path', () => {
    expect(extractProjectId('/moach/123')).toBe('123');
    expect(extractProjectId('/moach/123/votes')).toBe('123');
    expect(extractProjectId('/moach/123/votes/9?action=x')).toBe('123');
    expect(extractProjectId('/he/moach/45/hub')).toBe('45');
  });

  it('returns null for non-project paths', () => {
    expect(extractProjectId('/me')).toBeNull();
    expect(extractProjectId('/')).toBeNull();
    expect(extractProjectId('')).toBeNull();
    expect(extractProjectId(undefined)).toBeNull();
    expect(extractProjectId(null)).toBeNull();
    expect(extractProjectId('/moach/')).toBeNull();
  });
});

// ── summarizeProjectContext ──────────────────────────────
function sampleContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectId: '42',
    projectName: 'Green Roofs',
    description: 'A project about rooftop gardens.',
    values: ['sustainability', 'community'],
    restime: '7',
    members: [
      { id: '1', username: 'alice' },
      { id: '2', username: 'bob' }
    ],
    openMissions: [{ id: '10', name: 'Design logo' }],
    products: [{ id: '5', name: 'Seed kit', price: 20 }],
    myMissions: [
      { id: '99', name: 'Write copy', hoursAlready: 2, hoursAssigned: 5, activeTimer: { timerId: '7', isActive: true, totalHours: 1 } }
    ],
    isMember: true,
    fetchedAt: Date.now(),
    ...overrides
  };
}

describe('summarizeProjectContext', () => {
  it('renders identity, counts and content within untrusted delimiters', () => {
    const s = summarizeProjectContext(sampleContext(), 'en');
    expect(s).toContain('id=42');
    expect(s).toContain('<<<Green Roofs>>>');
    expect(s).toContain('untrusted');
    expect(s).toContain('Members (2)');
    expect(s).toContain('Open missions (1)');
    expect(s).toContain('Design logo');
    expect(s).toContain('timer running');
    expect(s).toContain('Seed kit');
  });

  it('flags non-members and omits the running-timer note when idle', () => {
    const s = summarizeProjectContext(
      sampleContext({
        isMember: false,
        myMissions: [{ id: '1', name: 'x', hoursAlready: null, hoursAssigned: null, activeTimer: null }]
      }),
      'en'
    );
    expect(s.toLowerCase()).toContain('not a member');
    expect(s).not.toContain('timer running');
  });

  it('supports Hebrew labels', () => {
    const s = summarizeProjectContext(sampleContext(), 'he');
    expect(s).toContain('חברים');
    expect(s).toContain('משימות פתוחות');
  });
});

// ── buildProjectContext / getProjectContext (mocked fetch) ─
function mockFetch(payloads: Record<string, any>) {
  return vi.fn(async (_url: string, init: any) => {
    const body = JSON.parse(init.body);
    const queId: string = body.data.queId;
    return {
      status: 200,
      json: async () => payloads[queId] ?? {}
    } as any;
  });
}

const projectPayload = {
  data: {
    project: {
      data: {
        attributes: {
          projectName: 'Green Roofs',
          publicDescription: 'Rooftop gardens.',
          restime: '7',
          user_1s: { data: [{ id: '1', attributes: { username: 'alice' } }, { id: '2', attributes: { username: 'bob' } }] },
          vallues: { data: [{ attributes: { valueName: 'sustainability' } }] },
          open_missions: { data: [{ id: '10', attributes: { name: 'Design logo' } }] },
          matanotofs: { data: [{ id: '5', attributes: { name: 'Seed kit', price: 20 } }] }
        }
      }
    }
  }
};

const userPayload = {
  data: {
    usersPermissionsUser: {
      data: {
        attributes: {
          mesimabetahaliches: {
            data: [
              {
                id: '99',
                attributes: {
                  name: 'Write copy',
                  howmanyhoursalready: 2,
                  hoursassinged: 5,
                  project: { data: { id: '42' } },
                  activeTimer: { data: { id: '7', attributes: { isActive: true, totalHours: 1 } } }
                }
              },
              {
                // Belongs to a different project — must be filtered out.
                id: '100',
                attributes: { name: 'Other', project: { data: { id: '77' } }, activeTimer: null }
              }
            ]
          }
        }
      }
    }
  }
};

describe('buildProjectContext', () => {
  beforeEach(() => clearProjectContextCache());

  it('maps project + user data and scopes myMissions to the project', async () => {
    const fetchInstance = mockFetch({ '49GetProjectById': projectPayload, '8getMissionsOnProgress': userPayload });
    const ctx = await buildProjectContext('42', '1', fetchInstance as any);

    expect(ctx.projectName).toBe('Green Roofs');
    expect(ctx.members).toHaveLength(2);
    expect(ctx.values).toEqual(['sustainability']);
    expect(ctx.openMissions).toEqual([{ id: '10', name: 'Design logo' }]);
    expect(ctx.products[0]).toMatchObject({ name: 'Seed kit', price: 20 });
    expect(ctx.isMember).toBe(true);
    // Only the mission in project 42 survives.
    expect(ctx.myMissions).toHaveLength(1);
    expect(ctx.myMissions[0]).toMatchObject({ id: '99', name: 'Write copy' });
    expect(ctx.myMissions[0].activeTimer?.isActive).toBe(true);
  });

  it('reports non-membership when the user is not in user_1s', async () => {
    const fetchInstance = mockFetch({ '49GetProjectById': projectPayload, '8getMissionsOnProgress': userPayload });
    const ctx = await buildProjectContext('42', '999', fetchInstance as any);
    expect(ctx.isMember).toBe(false);
  });

  it('caches results within the TTL (one fetch pair)', async () => {
    const fetchInstance = mockFetch({ '49GetProjectById': projectPayload, '8getMissionsOnProgress': userPayload });
    await getProjectContext('42', '1', fetchInstance as any);
    await getProjectContext('42', '1', fetchInstance as any);
    // 2 queries on the first build, 0 on the cached second call.
    expect(fetchInstance).toHaveBeenCalledTimes(2);
  });
});
