import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAssistantSessionConfig,
  materializeRikmaBlueprintConfig,
  proposeRikmaBlueprintConfig,
  reviewUrl,
  setAssistantItemsConfig,
  undoAssistantRevisionConfig
} from './assistantSessions.js';
import type { ActionContext, ActionExecutionHandler } from '../types.js';

/** In-memory stand-in for the qids the actions use. */
function fakeStrapi() {
  const rows = new Map<string, any>();
  const projects: Record<string, { name: string; members: string[] }> = {
    '12': { name: 'קיימת', members: ['5', '6'] }
  };
  let nextId = 1;
  const node = (id: string) => {
    const r = rows.get(id);
    return {
      id,
      attributes: {
        ...r,
        user: { data: r.user ? { id: r.user } : null },
        project: { data: r.project ? { id: r.project, attributes: { projectName: projects[r.project]?.name ?? '' } } : null },
        ratson: { data: null }
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
  });
});
