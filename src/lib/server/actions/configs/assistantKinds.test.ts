/**
 * Profile and wish sessions (PLAN_AI_SIGNUP_CONCIERGE §6, §7): who may, what
 * is written where, and that nothing a supplier answered is touched. The model
 * and the Strapi side of kinds.ts are mocked; the list logic is the real one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const kinds = vi.hoisted(() => ({
  loadProfile: vi.fn(),
  analyzeProfileText: vi.fn(),
  applyProfile: vi.fn(),
  profileSuggestions: vi.fn(),
  loadOwnedWish: vi.fn(),
  runRevise: vi.fn()
}));
vi.mock('$lib/server/assistant/kinds.js', () => kinds);

const executeAction = vi.hoisted(() => vi.fn());
vi.mock('$lib/server/actions/index.js', () => ({ actionService: { executeAction } }));

import {
  applyAssistantSessionConfig,
  proposeRikmaBlueprintConfig,
  reviseAssistantSessionConfig,
  startAssistantSessionConfig
} from './assistantSessions.js';
import type { ActionExecutionHandler } from '../types.js';

function fakeStrapi() {
  const rows = new Map<string, any>();
  let n = 0;
  const node = (id: string) => {
    const r = rows.get(id);
    return {
      id,
      attributes: {
        ...r,
        user: { data: r.user ? { id: r.user } : null },
        project: { data: null },
        ratson: { data: r.ratson ? { id: r.ratson } : null },
        chezin: { data: null }
      }
    };
  };
  return {
    rows,
    async execute(qid: string, vars: any) {
      switch (qid) {
        case '363createAssistantSession': {
          const id = String(++n);
          rows.set(id, { ...vars.data });
          return { data: { createAssistantSession: { data: node(id) } } };
        }
        case '364getAssistantSession':
          return { data: { assistantSession: { data: rows.has(vars.id) ? node(vars.id) : null } } };
        case '365updateAssistantSession':
          rows.set(vars.id, { ...rows.get(vars.id), ...vars.data });
          return { data: { updateAssistantSession: { data: node(vars.id) } } };
        case '366findMyAssistantSessions': {
          const ids = [...rows.keys()].filter((id) => rows.get(id).user === vars.uid && rows.get(id).kind === vars.kind);
          return { data: { assistantSessions: { data: ids.reverse().slice(0, 1).map(node) } } };
        }
        default:
          throw new Error('unexpected ' + qid);
      }
    }
  };
}

const run = (config: { graphqlOperation: unknown }, params: any, userId: string, strapi: any) =>
  (config.graphqlOperation as ActionExecutionHandler)(
    params,
    { userId, jwt: 'jwt', lang: 'he', fetch: (async () => new Response()) as any },
    { strapi } as any
  ) as Promise<any>;

const snapshot = { skills: [{ id: '1', name: 'עיצוב' }], roles: [], methods: [], vallues: [], resources: [] };
const wishAttrs = {
  status_ratson: 'open',
  name: 'יום הולדת',
  extracted_missions: [{ name: 'צלם', importance: 'must' }, { name: 'DJ', importance: 'nice' }],
  extracted_resources: []
};
const answered = [{ attributes: { status_proposal: 'suggested', covered_missions: [{ extracted_mission_idx: '1' }] } }];

let strapi: ReturnType<typeof fakeStrapi>;
beforeEach(() => {
  strapi = fakeStrapi();
  Object.values(kinds).forEach((f) => f.mockReset());
  executeAction.mockReset();
  kinds.loadProfile.mockResolvedValue({ snapshot, projectIds: [] });
});

describe('profile session', () => {
  it('starts from the profile and adds what the text says; a model runs only when there is text', async () => {
    kinds.analyzeProfileText.mockResolvedValue({ newItems: { skills: [{ input: 'צילום' }] } });
    const r = await run(startAssistantSessionConfig, { kind: 'profile', text: 'אני מעצבת ומצלמת חתונות כבר עשר שנים, בעיקר בצפון' }, '5', strapi);
    expect(r.data.items.map((i: any) => [i.label, i.status])).toEqual([
      ['עיצוב', 'applied'],
      ['צילום', 'proposed']
    ]);
    expect(kinds.analyzeProfileText).toHaveBeenCalledTimes(1);

    // Continuing: the same session, no second analysis without text.
    const again = await run(startAssistantSessionConfig, { kind: 'profile' }, '5', strapi);
    expect(again.data.sessionId).toBe(r.data.sessionId);
    expect(kinds.analyzeProfileText).toHaveBeenCalledTimes(1);
  });

  it('an agent-prepared session is read from the words it carries', async () => {
    strapi.rows.set('9', { kind: 'profile', status: 'active', user: '5', sourceText: 'מתכנת פייתון שאוהב קהילות ועובד מרחוק', state: { items: [] }, revisions: [], version: 1 });
    kinds.analyzeProfileText.mockResolvedValue({ newItems: { skills: [{ input: 'Python' }] } });
    const r = await run(startAssistantSessionConfig, { kind: 'profile', sessionId: '9' }, '5', strapi);
    expect(kinds.analyzeProfileText).toHaveBeenCalledWith('מתכנת פייתון שאוהב קהילות ועובד מרחוק', 'he');
    expect(r.data.items.map((i: any) => i.label)).toContain('Python');
  });

  it('revise applies the model’s ops through applyOps — an unknown key is refused, not invented', async () => {
    const { data } = await run(startAssistantSessionConfig, { kind: 'profile' }, '5', strapi);
    kinds.runRevise.mockResolvedValue({ ops: [{ op: 'add', group: 'skills', label: 'צילום' }, { op: 'drop', key: 'nope' }], say: 'הוספתי צילום', questions: ['גם וידאו?'] });
    const r = await run(reviseAssistantSessionConfig, { sessionId: data.sessionId, instruction: 'תוסיף צילום', expectedVersion: data.version }, '5', strapi);
    expect(r.data).toMatchObject({ say: 'הוספתי צילום', applied: 1, questions: ['גם וידאו?'] });
    expect(r.data.rejected).toEqual([{ op: { op: 'drop', key: 'nope' }, reason: 'unknownKey' }]);
    await expect(run(reviseAssistantSessionConfig, { sessionId: data.sessionId, instruction: 'x', expectedVersion: 1 }, '6', strapi)).rejects.toThrow('not found');
  });

  it('apply saves to the profile and returns the list as saved', async () => {
    const { data } = await run(startAssistantSessionConfig, { kind: 'profile' }, '5', strapi);
    kinds.applyProfile.mockImplementation(async (_s: any, _u: any, state: any) => ({ state, written: ['skills'], unresolved: [] }));
    const r = await run(applyAssistantSessionConfig, { sessionId: data.sessionId, expectedVersion: data.version }, '5', strapi);
    expect(kinds.applyProfile).toHaveBeenCalledWith(strapi, '5', expect.any(Object), expect.objectContaining({ jwt: 'jwt', lang: 'he' }));
    expect(r.data).toMatchObject({ applied: true, written: ['skills'] });
  });
});

describe('wish session', () => {
  it('opens a wish I own with the answered row locked; not someone else’s', async () => {
    kinds.loadOwnedWish.mockImplementation(async (_s: any, _id: any, uid: string) => {
      if (uid !== '5') throw new Error('Wish not found');
      return { attrs: wishAttrs, proposals: answered, isDraft: false };
    });
    const r = await run(startAssistantSessionConfig, { kind: 'wish', ratsonId: '70' }, '5', strapi);
    expect(r.data.items.map((i: any) => [i.label, !!i.committed])).toEqual([
      ['צלם', false],
      ['DJ', true]
    ]);
    expect(r.data.siteUrl).toBe('https://www.1lev1.com/concierge/70');
    await expect(run(startAssistantSessionConfig, { kind: 'wish', ratsonId: '70' }, '6', strapi)).rejects.toThrow('Wish not found');
  });

  it('apply on a published wish: my rows via updateRatsonExtraction, then matching re-runs', async () => {
    kinds.loadOwnedWish.mockResolvedValue({ attrs: wishAttrs, proposals: answered, isDraft: false });
    executeAction.mockResolvedValue({ success: true, data: {} });
    const { data } = await run(startAssistantSessionConfig, { kind: 'wish', ratsonId: '70' }, '5', strapi);
    const { setAssistantItemsConfig } = await import('./assistantSessions.js');
    const edited = await run(setAssistantItemsConfig, { sessionId: data.sessionId, ops: [{ op: 'add', group: 'wishMissions', label: 'מנחה' }], expectedVersion: data.version }, '5', strapi);

    const r = await run(applyAssistantSessionConfig, { sessionId: data.sessionId, expectedVersion: edited.data.version }, '5', strapi);
    expect(executeAction.mock.calls.map((c) => c[0])).toEqual(['updateRatsonExtraction', 'refreshWishMatches']);
    expect(executeAction.mock.calls[0][1].extracted_missions.map((m: any) => m.name)).toEqual(['צלם', 'DJ', 'מנחה']);
    expect(r.data).toMatchObject({ applied: true, siteUrl: 'https://www.1lev1.com/concierge/70' });
  });

  it('apply on a draft stays a draft (no publish) and nothing is written when nothing changed', async () => {
    kinds.loadOwnedWish.mockResolvedValue({ attrs: { ...wishAttrs, status_ratson: 'draft' }, proposals: [], isDraft: true });
    executeAction.mockResolvedValue({ success: true, data: {} });
    const { data } = await run(startAssistantSessionConfig, { kind: 'wish', ratsonId: '71' }, '5', strapi);
    const same = await run(applyAssistantSessionConfig, { sessionId: data.sessionId, expectedVersion: data.version }, '5', strapi);
    expect(same.data.applied).toBe(false);
    expect(executeAction).not.toHaveBeenCalled();
  });
});

describe('rikma session', () => {
  it('apply never creates a rikma — it hands back the review screen', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint: { fields: { track: 'business', name: 'x' }, products: [{ name: 'p' }] } }, '5', strapi);
    const r = await run(applyAssistantSessionConfig, { sessionId: data.sessionId, expectedVersion: data.version }, '5', strapi);
    expect(r.data).toMatchObject({ applied: false, reviewUrl: `https://www.1lev1.com/moach/import/${data.sessionId}` });
    expect(executeAction).not.toHaveBeenCalled();
  });
});
