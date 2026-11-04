import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The answer of a member a resource was offered to (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md):
 * only they may give it, only with a resource of their own, and it goes on
 * through the same gate as every other yes (finalizeAskmAcceptance).
 */

const { executeAction } = vi.hoisted(() => ({
  executeAction: vi.fn(async () => ({ success: true, data: { materialized: false, pending: 'members' } }))
}));
vi.mock('../index.js', () => ({ actionService: { executeAction } }));
vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_GRAPHQL: 'http://strapi/graphql' }));

import { provideAssignedResourceConfig } from './provideAssignedResource';
import type { ActionExecutionHandler } from '../types';

const provide = provideAssignedResourceConfig.graphqlOperation as ActionExecutionHandler;

/** Askm 40 of rikma 5 offers open-mashaabim 60 to member 9. Sp 77 is 9's, Sp 78 is someone else's. */
function world({ taker = '9', sp = null as any, archived = false } = {}) {
  const sent: { query: string; variables: any }[] = [];
  const fetch = vi.fn(async (_url: string, init: any) => {
    const body = JSON.parse(init.body);
    sent.push(body);
    const q: string = body.query;
    let data: any = {};
    if (q.includes('ProvideAssignedReadAskm')) {
      data = {
        askm: {
          data: {
            id: '40',
            attributes: {
              archived,
              users_permissions_user: { data: { id: taker } },
              sp: { data: sp },
              project: { data: { id: '5' } },
              open_mashaabim: {
                data: {
                  id: '60',
                  attributes: { name: 'Projector', kindOf: 'total', hm: 1, price: 300, easy: 250, mashaabim: { data: { id: '12' } } }
                }
              }
            }
          }
        }
      };
    } else if (q.includes('ProvideAssignedReadSp')) {
      const owner = body.variables.id === '77' ? '9' : '3';
      data = { sp: { data: { id: body.variables.id, attributes: { users_permissions_user: { data: { id: owner } } } } } };
    } else if (q.includes('ProvideAssignedCreateSp')) {
      data = { createSp: { data: { id: '90' } } };
    } else if (q.includes('ProvideAssignedSetSp')) {
      data = { updateAskm: { data: { id: '40' } } };
    }
    return { json: async () => ({ data }) } as any;
  });
  const ctx = (userId: string) => ({ userId, jwt: 'j', fetch }) as any;
  const setSp = () => sent.filter((b) => b.query.includes('ProvideAssignedSetSp')).map((b) => b.variables.sp);
  const created = () => sent.filter((b) => b.query.includes('ProvideAssignedCreateSp')).map((b) => b.variables.data);
  return { ctx, setSp, created };
}

beforeEach(() => executeAction.mockClear());

describe('provideAssignedResource', () => {
  it('brings one of my resources and says yes through finalizeAskmAcceptance', async () => {
    const w = world();
    const res: any = await provide({ askmId: '40', projectId: '5', spId: '77', expectRound: 0 }, w.ctx('9'), {} as any);
    expect(w.setSp()).toEqual(['77']);
    expect(executeAction).toHaveBeenCalledOnce();
    const [key, params] = executeAction.mock.calls[0] as any[];
    expect(key).toBe('finalizeAskmAcceptance');
    expect(params).toMatchObject({ askmId: '40', projectId: '5', acceptedUserId: '9', spId: '77', expectRound: 0 });
    expect(res.data).toMatchObject({ spId: '77', materialized: false, pending: 'members' });
  });

  it('creates a resource of mine from the need, at the value I give it', async () => {
    const w = world();
    await provide({ askmId: '40', projectId: '5', create: { myp: 200 } }, w.ctx('9'), {} as any);
    const [data] = w.created();
    expect(data).toMatchObject({ name: 'Projector', myp: 200, price: 300, users_permissions_user: '9', mashaabim: '12' });
    expect(w.setSp()).toEqual(['90']);
  });

  it('is only the assignee’s to answer', async () => {
    const w = world();
    await expect(provide({ askmId: '40', projectId: '5', spId: '77' }, w.ctx('2'), {} as any)).rejects.toThrow(/offered to/);
    expect(w.setSp()).toEqual([]);
  });

  it('will not bring somebody else’s resource', async () => {
    const w = world();
    await expect(provide({ askmId: '40', projectId: '5', spId: '78' }, w.ctx('9'), {} as any)).rejects.toThrow(/of your own/);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it('answers once', async () => {
    const w = world({ sp: { id: '77' } });
    await expect(provide({ askmId: '40', projectId: '5', spId: '77' }, w.ctx('9'), {} as any)).rejects.toThrow(/already chosen/);
  });
});
