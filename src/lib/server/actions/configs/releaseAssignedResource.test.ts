import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * A member a resource was offered to steps back or passes it on
 * (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md). Neither is a veto: stepping
 * back opens the resource to everyone; passing it on starts the vote over.
 */

const { cancel, ensure, match } = vi.hoisted(() => ({
  cancel: vi.fn(async () => {}),
  ensure: vi.fn(async () => 'tg2'),
  match: vi.fn(async () => {})
}));
vi.mock('../../nego/timegrama.js', () => ({ cancelCandidacyTimegrama: cancel, ensureCandidacyTimegrama: ensure }));
vi.mock('$lib/server/matching/engine', () => ({ matchOpenMashaabimToUsers: match }));
vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_GRAPHQL: 'http://strapi/graphql' }));

import { releaseAssignedResourceConfig } from './releaseAssignedResource';
import type { ActionExecutionHandler } from '../types';

const release = releaseAssignedResourceConfig.graphqlOperation as ActionExecutionHandler;

/** Askm 40 in rikma 5 (members 1, 2, 9) offers open-mashaabim 60 to member 9. */
function world({ taker = '9', sp = null as any, archived = false } = {}) {
  const sent: { query: string; variables: any }[] = [];
  const fetch = vi.fn(async (_url: string, init: any) => {
    const body = JSON.parse(init.body);
    sent.push(body);
    let data: any = {};
    if (body.query.includes('ReleaseAssignedRead')) {
      data = {
        askm: {
          data: {
            id: '40',
            attributes: {
              archived,
              users_permissions_user: { data: { id: taker } },
              sp: { data: sp },
              vots: [],
              project: {
                data: {
                  id: '5',
                  attributes: {
                    restime: 'feh',
                    projectName: 'Garden',
                    user_1s: { data: ['1', '2', '9'].map((id) => ({ id, attributes: { username: `u${id}` } })) }
                  }
                }
              },
              open_mashaabim: { data: { id: '60', attributes: { name: 'Projector' } } }
            }
          }
        }
      };
    } else if (body.query.includes('ReleaseAssignedCreateAskm')) {
      data = { createAskm: { data: { id: '41' } } };
    }
    return { json: async () => ({ data }) } as any;
  });
  const ctx = (userId: string) => ({ userId, jwt: 'j', fetch }) as any;
  const of = (name: string) => sent.filter((b) => b.query.includes(name)).map((b) => b.variables);
  return { ctx, of };
}

const deps = { strapi: { execute: vi.fn() }, notifier: null } as any;

beforeEach(() => {
  cancel.mockClear();
  ensure.mockClear();
  match.mockClear();
});

describe('releaseAssignedResource', () => {
  it('stepping back ends the offer and opens the resource to everyone', async () => {
    const w = world();
    const res: any = await release({ askmId: '40', projectId: '5', mode: 'withdraw' }, w.ctx('9'), deps);
    expect(cancel).toHaveBeenCalledOnce();
    expect(w.of('ReleaseAssignedArchiveAskm')).toEqual([{ id: '40' }]);
    expect(w.of('ReleaseAssignedReopen')).toEqual([{ id: '60' }]);
    expect(match).toHaveBeenCalledWith('60', 'resourceCreated', expect.anything());
    expect(res.data.mode).toBe('withdraw');
  });

  it('passing it on offers it to the other member, with only the passer’s yes', async () => {
    const w = world();
    const res: any = await release({ askmId: '40', projectId: '5', mode: 'reassign', toUserId: '2' }, w.ctx('9'), deps);
    const [created] = w.of('ReleaseAssignedCreateAskm');
    expect(created.data).toMatchObject({
      project: '5',
      open_mashaabim: '60',
      users_permissions_user: '2',
      vots: [{ what: true, users_permissions_user: '9', order: 0 }]
    });
    expect(created.data.sp).toBeUndefined();
    expect(w.of('ReleaseAssignedReopen')).toEqual([]);
    expect(ensure).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ side: 'askm', id: '41' }));
    expect(res.data).toMatchObject({ newAskmId: '41', toUserId: '2' });
  });

  it('only to a member, and not back to yourself', async () => {
    const w = world();
    await expect(
      release({ askmId: '40', projectId: '5', mode: 'reassign', toUserId: '77' }, w.ctx('9'), deps)
    ).rejects.toThrow(/member/);
    await expect(
      release({ askmId: '40', projectId: '5', mode: 'reassign', toUserId: '9' }, w.ctx('9'), deps)
    ).rejects.toThrow(/another member/);
    expect(w.of('ReleaseAssignedArchiveAskm')).toEqual([]);
  });

  it('is only the assignee’s, and only while unanswered', async () => {
    await expect(
      release({ askmId: '40', projectId: '5', mode: 'withdraw' }, world().ctx('1'), deps)
    ).rejects.toThrow(/offered to/);
    await expect(
      release({ askmId: '40', projectId: '5', mode: 'withdraw' }, world({ sp: { id: '77' } }).ctx('9'), deps)
    ).rejects.toThrow(/already chose/);
  });
});
