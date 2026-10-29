import { describe, it, expect, vi } from 'vitest';
import { renewSheirutJoinConfig } from './renewSheirutJoin';
import { askwantState } from '$lib/sheirut/askwantState';

/** TIMEGRAMA_REMINDERS R3 — "ask again" on a request nobody answered. */
function askwant(attrs: Record<string, unknown> = {}) {
  return {
    archived: false,
    users_permissions_user: { data: { id: '5' } },
    project: { data: { id: '7', attributes: { projectName: 'P', restime: 'feh' } } },
    sheirut: { data: { id: '40', attributes: { name: 'S', isApruved: true, archived: false } } },
    timegrama: { data: { id: '300', attributes: { done: true, date: '2026-01-01T00:00:00.000Z' } } },
    ...attrs
  };
}

function run(attrs: Record<string, unknown>, userId = '5') {
  const calls: Array<{ qid: string; vars: any; jwt: unknown }> = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any, jwt?: unknown) => {
      calls.push({ qid, vars, jwt });
      if (qid === '298getAskwantForFinalize') return { data: { askwant: { data: { id: '90', attributes: attrs } } } };
      if (qid === '300createTimegramaForAskwant') return { data: { createTimegrama: { data: { id: '301' } } } };
      return { data: {} };
    })
  };
  const handler = renewSheirutJoinConfig.graphqlOperation as any;
  const result = handler({ askwantId: '90' }, { userId, jwt: 'user-jwt', fetch: undefined }, { strapi });
  return { result, calls };
}

describe('renewSheirutJoin', () => {
  it('opens a fresh restime on the same request — no duplicate askwant', async () => {
    const { result, calls } = run(askwant());
    const r = await result;
    expect(r.data).toMatchObject({ askwantId: '90', projectId: '7', sheirutId: '40', alreadyOpen: false, timegramaId: '301' });
    const created = calls.filter((c) => c.qid === '300createTimegramaForAskwant');
    expect(created).toHaveLength(1);
    expect(created[0].vars.askwantId).toBe('90');
    // 48h for restime 'feh'.
    const ms = new Date(created[0].vars.date).getTime() - Date.now();
    expect(ms).toBeGreaterThan(47 * 3600e3);
    expect(calls.some((c) => c.qid === '299createAskwant')).toBe(false);
    // serviceAdmin-only qids: never under the user's jwt.
    expect(calls.every((c) => c.jwt === undefined)).toBe(true);
  });

  it('only the requester can renew it', async () => {
    await expect(run(askwant(), '6').result).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('a running clock is left alone', async () => {
    const { result, calls } = run(askwant({ timegrama: { data: { id: '300', attributes: { done: false } } } }));
    expect((await result).data.alreadyOpen).toBe(true);
    expect(calls.some((c) => c.qid === '300createTimegramaForAskwant')).toBe(false);
  });

  it('an answered request, or a service not offered, cannot be renewed', async () => {
    await expect(run(askwant({ archived: true })).result).rejects.toMatchObject({ code: 'ALREADY_RESOLVED' });
    await expect(
      run(askwant({ sheirut: { data: { id: '40', attributes: { isApruved: false } } } })).result
    ).rejects.toMatchObject({ code: 'NOT_READY' });
  });

  it('members hear about it only when a new round opened', () => {
    const intent = renewSheirutJoinConfig.notification!.intent as any;
    expect(intent({}, { data: { alreadyOpen: false } })).toBe('consent');
    expect(intent({}, { data: { alreadyOpen: true } })).toBe('ambient');
  });
});

describe('askwantState', () => {
  it('reads the same rule the action renews by', () => {
    expect(askwantState(askwant())).toBe('lapsed');
    expect(askwantState(askwant({ timegrama: { data: null } }))).toBe('lapsed');
    expect(askwantState(askwant({ timegrama: { data: { id: '1', attributes: { done: false } } } }))).toBe('waiting');
    expect(askwantState(askwant({ archived: true }))).toBe('approved');
    expect(askwantState(askwant({ sheirut: { data: { id: '40', attributes: { isApruved: true, archived: true } } } }))).toBe('unavailable');
  });
});
