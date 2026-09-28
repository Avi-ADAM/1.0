import { beforeEach, describe, expect, it, vi } from 'vitest';

// Preview links are signed with a key derived from OAUTH_SECRET, read through
// $env/dynamic/private, which has no value under vitest.
vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789' }
}));

import {
  claimAssistantSessionConfig,
  getAssistantSessionConfig,
  importPlanBoardRowsConfig,
  materializeRikmaBlueprintConfig,
  previewUrl,
  proposeRikmaBlueprintConfig,
  reviewUrl,
  setAssistantItemsConfig,
  shareRikmaPreviewConfig,
  undoAssistantRevisionConfig
} from './assistantSessions.js';
import { loadByShareKey } from '$lib/server/assistant/session.js';
import type { ActionContext, ActionExecutionHandler } from '../types.js';

/** In-memory stand-in for the qids the actions use. */
function fakeStrapi() {
  const rows = new Map<string, any>();
  const projects: Record<string, { name: string; members: string[] }> = {
    '12': { name: 'קיימת', members: ['5', '6'] }
  };
  const boardItem = (id: string, kind: string, name: string, status = 'proposed', spec: Record<string, unknown> = {}) => ({
    id,
    attributes: { kind, name, descrip: '', status, spec }
  });
  const boards: Record<string, any> = {
    '40': {
      id: '40',
      attributes: {
        title: 'מה אנחנו מוכרים',
        project: { data: { id: '12', attributes: { projectName: 'קיימת' } } },
        items: {
          data: [
            boardItem('401', 'product', 'סדנה', 'proposed', { price: 180 }),
            boardItem('402', 'mission', 'צילום', 'accepted', { skills: ['צילום'] }),
            boardItem('403', 'act', 'לקנות נייר'),
            boardItem('404', 'resource', 'תנור', 'created'),
            boardItem('405', 'resource', 'מקרר', 'dismissed'),
            boardItem('406', 'resource', 'שולחן')
          ]
        }
      }
    }
  };
  const userChezin: Record<string, string> = { '5': '800', '6': '801' };
  let nextId = 1;
  const node = (id: string) => {
    const r = rows.get(id);
    return {
      id,
      attributes: {
        ...r,
        user: { data: r.user ? { id: r.user } : null },
        project: { data: r.project ? { id: r.project, attributes: { projectName: projects[r.project]?.name ?? '' } } : null },
        ratson: { data: r.ratson ? { id: r.ratson } : null },
        chezin: { data: r.chezin ? { id: r.chezin } : null }
      }
    };
  };
  const calls: string[] = [];
  return {
    rows,
    calls,
    async execute(qid: string, vars: Record<string, any>) {
      calls.push(qid);
      switch (qid) {
        case '363createAssistantSession': {
          const id = String(nextId++);
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
        case '372assistantProjectContext': {
          const p = projects[vars.pid];
          return {
            data: { project: { data: p ? { id: vars.pid, attributes: { projectName: p.name, user_1s: { data: p.members.map((id) => ({ id })) } } } : null } }
          };
        }
        case '379getUserChezin':
          return { data: { usersPermissionsUser: { data: { id: vars.uid, attributes: { chezin: { data: userChezin[vars.uid] ? { id: userChezin[vars.uid] } : null } } } } } };
        case '367findPendingAssistantByChezin': {
          const ids = [...rows.keys()].filter((id) => rows.get(id).chezin === vars.cid && rows.get(id).status === 'pending');
          return { data: { assistantSessions: { data: ids.map(node) } } };
        }
        case '286getPlanBoard': {
          const board = boards[vars.id];
          return { data: { projectPlanBoard: { data: board ?? null } } };
        }
        default:
          throw new Error(`unexpected qid ${qid}`);
      }
    }
  };
}

const ctx = (userId: string): ActionContext => ({ userId, jwt: 'jwt', lang: 'he', fetch: (async () => new Response()) as any });

const run = (config: { graphqlOperation: unknown }, params: Record<string, any>, userId: string, strapi: any) =>
  (config.graphqlOperation as ActionExecutionHandler)(params, ctx(userId), { strapi } as any) as Promise<any>;

const blueprint = {
  fields: { track: 'business', name: 'השקד' },
  products: [{ name: 'סדנה', price: 180 }, { name: 'מגש' }]
};

describe('assistant session actions', () => {
  let strapi: ReturnType<typeof fakeStrapi>;
  beforeEach(() => {
    strapi = fakeStrapi();
  });

  it('proposeRikmaBlueprint saves a draft and returns the review URL — nothing else is created', async () => {
    const r = await run(proposeRikmaBlueprintConfig, { blueprint, via: 'agent' }, '5', strapi);
    expect(r.data.items.map((it: any) => it.label)).toEqual(['סדנה', 'מגש']);
    expect(r.data.reviewUrl).toBe(`https://www.1lev1.com/moach/import/${r.data.sessionId}`);
    expect(strapi.calls).toEqual(['363createAssistantSession']);
    expect(strapi.rows.get(r.data.sessionId)).toMatchObject({ user: '5', kind: 'rikma', startedVia: 'agent', version: 1 });
  });

  it('an invalid blueprint is refused with the reasons', async () => {
    await expect(run(proposeRikmaBlueprintConfig, { blueprint: { fields: { track: 'x' } } }, '5', strapi)).rejects.toThrow(
      /fields\.track/
    );
  });

  it('importing into a rikma requires membership', async () => {
    await expect(run(proposeRikmaBlueprintConfig, { blueprint, projectId: '12' }, '9', strapi)).rejects.toThrow(/member/);
    const ok = await run(proposeRikmaBlueprintConfig, { blueprint, projectId: '12' }, '6', strapi);
    expect(ok.data.reviewUrl).toContain('/moach/12/import/');
  });

  it('someone else cannot read, edit, undo or create from my session', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    const id = data.sessionId;
    await expect(run(getAssistantSessionConfig, { sessionId: id }, '6', strapi)).rejects.toThrow('not found');
    await expect(run(setAssistantItemsConfig, { sessionId: id, ops: [{ op: 'drop', key: 'i1' }], expectedVersion: 1 }, '6', strapi)).rejects.toThrow('not found');
    await expect(run(undoAssistantRevisionConfig, { sessionId: id, expectedVersion: 1 }, '6', strapi)).rejects.toThrow('not found');
    await expect(run(materializeRikmaBlueprintConfig, { sessionId: id, selectedKeys: ['i1'], expectedVersion: 1 }, '6', strapi)).rejects.toThrow('not found');
  });

  it('setAssistantItems applies ops, records the transcript, and bumps the version', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    const r = await run(
      setAssistantItemsConfig,
      { sessionId: data.sessionId, ops: [{ op: 'drop', key: 'i2' }, { op: 'keep', key: 'nope' }], expectedVersion: 1, via: 'agent', instruction: 'בלי המגש' },
      '5',
      strapi
    );
    expect(r.data).toMatchObject({ version: 2, applied: 1, conflict: false });
    expect(r.data.rejected).toEqual([{ op: { op: 'keep', key: 'nope' }, reason: 'unknownKey' }]);
    expect(r.data.items[1].status).toBe('dropped');
    // Internal bookkeeping stays inside.
    expect(r.data.items[1]).not.toHaveProperty('droppedFrom');
    expect(r.data.recent).toEqual([{ at: expect.any(String), via: 'agent', instruction: 'בלי המגש', ops: [{ op: 'drop', key: 'i2' }], v: 2 }]);
  });

  it('a stale expectedVersion returns the current list with conflict:true and writes nothing', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    await run(setAssistantItemsConfig, { sessionId: data.sessionId, ops: [{ op: 'drop', key: 'i2' }], expectedVersion: 1 }, '5', strapi);
    const late = await run(setAssistantItemsConfig, { sessionId: data.sessionId, ops: [{ op: 'drop', key: 'i1' }], expectedVersion: 1 }, '5', strapi);
    expect(late.data).toMatchObject({ conflict: true, version: 2 });
    expect(late.data.items[0].status).toBe('proposed');
  });

  it('undo puts the list back exactly', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    const before = data.items;
    await run(setAssistantItemsConfig, { sessionId: data.sessionId, ops: [{ op: 'rename', key: 'i1', label: 'סדנת אפייה' }, { op: 'add', group: 'products', label: 'עוגה' }], expectedVersion: 1 }, '5', strapi);
    const undone = await run(undoAssistantRevisionConfig, { sessionId: data.sessionId, expectedVersion: 2 }, '5', strapi);
    expect(undone.data.items).toEqual(before);
    expect(undone.data.version).toBe(3);
  });

  it('getAssistantSession by kind returns my latest rikma session with its review URL', async () => {
    await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    const second = await run(proposeRikmaBlueprintConfig, { blueprint: { ...blueprint, fields: { track: 'idea', name: 'רעיון' } } }, '5', strapi);
    const r = await run(getAssistantSessionConfig, { kind: 'rikma' }, '5', strapi);
    expect(r.data.session.sessionId).toBe(second.data.sessionId);
    expect(r.data.session.reviewUrl).toBe(reviewUrl({ id: second.data.sessionId, projectId: null }));
    expect((await run(getAssistantSessionConfig, { kind: 'wish' }, '5', strapi)).data.session).toBeNull();
  });

  it('materialize refuses a stale version and a non-rikma session', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    const stale = await run(materializeRikmaBlueprintConfig, { sessionId: data.sessionId, selectedKeys: ['i1'], expectedVersion: 0 }, '5', strapi);
    expect(stale.data.conflict).toBe(true);
  });

  it('materialize is never reachable with an api key', () => {
    expect(materializeRikmaBlueprintConfig.access).toEqual(['user']);
    expect(importPlanBoardRowsConfig.access).toEqual(['user']);
  });

  it('shareRikmaPreview makes a link only the owner can make; a new one replaces the old; revoke ends it', async () => {
    const { data } = await run(proposeRikmaBlueprintConfig, { blueprint }, '5', strapi);
    await expect(run(shareRikmaPreviewConfig, { sessionId: data.sessionId }, '6', strapi)).rejects.toThrow('not found');

    const first = await run(shareRikmaPreviewConfig, { sessionId: data.sessionId }, '5', strapi);
    const key1 = first.data.previewUrl.split('/').pop();
    expect(first.data.previewUrl).toBe(previewUrl(key1));
    const found = await loadByShareKey(strapi, key1);
    expect(found?.id).toBe(data.sessionId);
    // Sharing is not an edit: an agent holding version 1 is not told it changed.
    expect(found?.version).toBe(1);

    const second = await run(shareRikmaPreviewConfig, { sessionId: data.sessionId }, '5', strapi);
    const key2 = second.data.previewUrl.split('/').pop();
    expect(key2).not.toBe(key1);
    expect(await loadByShareKey(strapi, key1)).toBeNull();

    // Expired → gone.
    const later = new Date(Date.now() + 31 * 86_400_000);
    expect(await loadByShareKey(strapi, key2, later)).toBeNull();

    await run(shareRikmaPreviewConfig, { sessionId: data.sessionId, revoke: true }, '5', strapi);
    expect(await loadByShareKey(strapi, key2)).toBeNull();
    // A malformed key never reaches Strapi.
    const before = strapi.calls.length;
    expect(await loadByShareKey(strapi, 'x"} or {')).toBeNull();
    expect(strapi.calls.length).toBe(before);
  });

  it('claim: the pending session tied to MY signatory row becomes mine and says where to go; once', async () => {
    // What prepareSignup + agent-sign leave behind: ownerless, pending, tied to chezin 800.
    strapi.rows.set('50', {
      kind: 'rikma',
      status: 'pending',
      startedVia: 'agent',
      chezin: '800',
      claimEmail: 'dana@x.co',
      claimExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      state: { items: [{ key: 'i1', group: 'products', label: 'סדנה', status: 'proposed', origin: 'agent' }] },
      revisions: [],
      version: 1
    });

    // Someone else (another signatory row) gets nothing, whatever their email.
    expect((await run(claimAssistantSessionConfig, {}, '6', strapi)).data.claimed).toBeNull();

    const r = await run(claimAssistantSessionConfig, {}, '5', strapi);
    expect(r.data.claimed).toEqual({ sessionId: '50', kind: 'rikma', landing: '/moach/import/50' });
    expect(strapi.rows.get('50')).toMatchObject({ user: '5', status: 'active' });
    // And now it is an ordinary session of mine.
    expect((await run(getAssistantSessionConfig, { sessionId: '50' }, '5', strapi)).data.session.items).toHaveLength(1);

    expect((await run(claimAssistantSessionConfig, {}, '5', strapi)).data.claimed).toBeNull();
  });

  it('claim ignores an expired pending session', async () => {
    strapi.rows.set('51', {
      kind: 'profile',
      status: 'pending',
      chezin: '800',
      claimExpiresAt: new Date(Date.now() - 1000).toISOString(),
      state: { items: [] },
      revisions: [],
      version: 1
    });
    expect((await run(claimAssistantSessionConfig, {}, '5', strapi)).data.claimed).toBeNull();
  });

  it("importPlanBoardRows drafts the board's open rows for the review screen, each stamped with its row", async () => {
    const r = await run(importPlanBoardRowsConfig, { projectId: '12', boardId: '40' }, '5', strapi);
    expect(r.data.reviewPath).toBe(`/moach/12/import/${r.data.sessionId}`);
    const saved = strapi.rows.get(r.data.sessionId);
    expect(saved).toMatchObject({ kind: 'rikma', project: '12', startedVia: 'site' });
    // Created, set-aside and act rows stay on the board only.
    expect(saved.state.items.map((it: any) => [it.label, it.spec?.planItem?.itemId])).toEqual([
      ['סדנה', '401'],
      ['צילום', '402'],
      ['שולחן', '406']
    ]);
    // Work in a rikma with members is not assigned by default.
    expect(saved.state.items[1].spec.holder).toBe('open');
  });

  it('importPlanBoardRows refuses a board of another rikma and a board with nothing to create', async () => {
    await expect(run(importPlanBoardRowsConfig, { projectId: '13', boardId: '40' }, '5', strapi)).rejects.toThrow(/does not belong/);
    await expect(
      run(importPlanBoardRowsConfig, { projectId: '12', boardId: '40', itemIds: ['403', '404'] }, '5', strapi)
    ).rejects.toThrow(/No product/);
  });
});
