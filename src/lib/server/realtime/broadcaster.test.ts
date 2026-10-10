import { describe, it, expect, vi } from 'vitest';
import { createRealtimeBroadcaster } from './broadcaster';
import type { ActionContext, RealtimeConfig } from '../actions/types';

const ctx = (over: Partial<ActionContext> = {}): ActionContext => ({
  userId: '1',
  jwt: 'j',
  lang: 'he',
  fetch: (() => {}) as any,
  ...over
});

function setup(members: Record<string, string[]> = {}) {
  const send = vi.fn(async () => ({}));
  const warn = vi.fn();
  const membersOf = vi.fn(async (pid: string) => members[pid] ?? []);
  return { send, warn, membersOf, rt: createRealtimeBroadcaster({ send, warn, membersOf }) };
}

describe('realtime broadcaster', () => {
  it('a rikma change reaches every member, the actor included, with the origin tab', async () => {
    const { rt, send } = setup({ '12': ['1', '2', '3'] });
    const config: RealtimeConfig = { scopes: (p) => [`project:${p.projectId}`, `mission:${p.id}`] };
    await rt.publish('updateMissionStatus', config, { projectId: 12, id: 7 }, {}, ctx({ clientId: 'tab-a' }));

    expect(send).toHaveBeenCalledTimes(1);
    const [userIds, change] = send.mock.calls[0] as any[];
    expect(userIds.sort()).toEqual(['1', '2', '3']);
    expect(change).toMatchObject({
      scopes: ['project:12', 'mission:7'],
      actionKey: 'updateMissionStatus',
      originClientId: 'tab-a'
    });
  });

  it('the actor is in even when the member list is stale or empty', async () => {
    const { rt, send } = setup({ '12': ['2'] });
    await rt.publish('x', { scopes: () => ['project:12'] }, {}, {}, ctx());
    expect((send.mock.calls[0] as any[])[0].sort()).toEqual(['1', '2']);
  });

  it('parties: the two sides of a bilateral flow, not the rikma', async () => {
    const { rt, send, membersOf } = setup({ '12': ['1', '2', '3', '4'] });
    const config: RealtimeConfig = {
      scopes: () => ['project:12', 'sale:5'],
      audience: 'parties',
      partiesFrom: (_p, r) => [r.data.holderId, null]
    };
    await rt.publish('createSale', config, {}, { data: { holderId: 4 } }, ctx());
    expect(membersOf).not.toHaveBeenCalled();
    expect((send.mock.calls[0] as any[])[0].sort()).toEqual(['1', '4']);
  });

  it('project + partiesFrom: the members and the candidate who is not one yet', async () => {
    const { rt, send } = setup({ '12': ['1', '2'] });
    const config: RealtimeConfig = {
      scopes: () => ['project:12', 'decision:ask:5'],
      partiesFrom: (p) => [p.candidateId]
    };
    await rt.publish('counterOnAsk', config, { candidateId: 9 }, {}, ctx());
    expect((send.mock.calls[0] as any[])[0].sort()).toEqual(['1', '2', '9']);
  });

  it('no project scope ⇒ only the actor’s own tabs and devices', async () => {
    const { rt, send } = setup();
    await rt.publish('updateUserBasic', { scopes: () => ['user:1'] }, {}, {}, ctx());
    expect((send.mock.calls[0] as any[])[0]).toEqual(['1']);
  });

  it('drops unknown scopes and duplicates, and sends nothing when none is left', async () => {
    const { rt, send, warn } = setup();
    const r = await rt.publish('x', { scopes: () => ['pends', 'mission:*', 'user:1', 'user:1'] }, {}, {}, ctx());
    expect(r.scopes).toEqual(['user:1']);
    expect(warn).toHaveBeenCalledTimes(2);

    send.mockClear();
    await rt.publish('x', { scopes: () => ['junk'] }, {}, {}, ctx());
    expect(send).not.toHaveBeenCalled();
  });

  it('no origin tab ⇒ no originClientId (a server or API-key caller)', async () => {
    const { rt, send } = setup();
    await rt.publish('x', { scopes: () => ['user:1'] }, {}, {}, ctx());
    expect((send.mock.calls[0] as any[])[1]).not.toHaveProperty('originClientId');
  });
});
