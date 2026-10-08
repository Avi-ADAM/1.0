/**
 * timerStart — the manual-entry path (`manual: true`).
 *
 * Opening a timer for hours typed in by hand used to be a start and then a
 * stop from the browser. On 2026-10-07 the stop was lost to a slow Strapi: the
 * page sat on "⏳" and a real timer ran on the server for twenty minutes. The
 * manual path is now one write that creates the timer already stopped, and a
 * retry finds the timer the first attempt left instead of opening another.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/archive/gql.js', () => ({ run: vi.fn() }));
vi.mock('$lib/server/archive/exec.js', () => ({ execFromContext: () => vi.fn() }));
vi.mock('$lib/server/archive/dormancyClock.js', () => ({ touchDormancy: vi.fn(async () => null) }));

import { timerStartConfig } from './timerStart.js';
import { run } from '$lib/server/archive/gql.js';

const handler = timerStartConfig.graphqlOperation as (
  params: Record<string, any>,
  context: any,
  util: any
) => Promise<any>;

const context = { userId: '258', jwt: 'jwt', fetch: (() => {}) as any };
const params = { missionId: '196', projectId: '92', userId: '258', manual: true };

function missionWith(activeTimer: any, ownerId = '258') {
  return {
    mesimabetahalich: {
      data: {
        attributes: {
          perhour: 80,
          users_permissions_user: { data: { id: ownerId } },
          activeTimer: { data: activeTimer }
        }
      }
    }
  };
}

function fakeStrapi() {
  return {
    execute: vi.fn(async (qid: string, vars: any) => ({
      createTimer: { data: { id: '901', attributes: { isActive: false, timers: [], totalHours: 0, saved: false, rate: vars.rate } } },
      qid
    }))
  };
}

describe('timerStart — manual entry', () => {
  beforeEach(() => vi.mocked(run).mockReset());

  it('creates the timer stopped and empty, in one write — never a start that needs a stop', async () => {
    vi.mocked(run).mockResolvedValueOnce(missionWith(null));
    const strapi = fakeStrapi();
    const res = await handler(params, context, { strapi });

    expect(strapi.execute).toHaveBeenCalledTimes(1);
    const [qid, vars] = strapi.execute.mock.calls[0];
    expect(qid).toBe('33CreateManualTimer');
    expect(vars).toMatchObject({ missionId: '196', projectId: '92', userId: '258', rate: 80 });
    expect(res.createTimer.data.attributes.isActive).toBe(false);
  });

  it('hands back the unsaved timer a timed-out first attempt left, instead of opening a second', async () => {
    const left = { id: '901', attributes: { isActive: false, saved: false, timers: [], totalHours: 0 } };
    vi.mocked(run).mockResolvedValueOnce(missionWith(left));
    const strapi = fakeStrapi();
    const res = await handler(params, context, { strapi });

    expect(strapi.execute).not.toHaveBeenCalled();
    expect(res.createTimer.data).toBe(left);
  });

  it('opens a fresh one when the timer on the mission is already saved', async () => {
    vi.mocked(run).mockResolvedValueOnce(missionWith({ id: '800', attributes: { saved: true } }));
    const strapi = fakeStrapi();
    await handler(params, context, { strapi });
    expect(strapi.execute.mock.calls[0][0]).toBe('33CreateManualTimer');
  });

  it("refuses someone else's mission", async () => {
    vi.mocked(run).mockResolvedValueOnce(missionWith(null, '256'));
    const strapi = fakeStrapi();
    await expect(handler(params, context, { strapi })).rejects.toThrow(/carrying this mission/);
    expect(strapi.execute).not.toHaveBeenCalled();
  });

  it('fails cleanly (nothing written) when the mission cannot be read', async () => {
    vi.mocked(run).mockRejectedValueOnce(new Error('ETIMEDOUT'));
    const strapi = fakeStrapi();
    await expect(handler(params, context, { strapi })).rejects.toThrow('ETIMEDOUT');
    expect(strapi.execute).not.toHaveBeenCalled();
  });

  it('leaves the ordinary start alone', async () => {
    vi.mocked(run).mockResolvedValueOnce({ mesimabetahalich: { data: { attributes: { perhour: 80 } } } });
    const strapi = fakeStrapi();
    await handler({ missionId: '196', projectId: '92', userId: '258', timerId: '0' }, context, { strapi });
    expect(strapi.execute.mock.calls[0][0]).toBe('33CreateTimer');
  });
});
