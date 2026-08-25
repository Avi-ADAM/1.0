import { describe, expect, it, vi } from 'vitest';
import {
  approveAskwant,
  approveSheirutProposal,
  mergeSheirutpendVotes,
  sheirutGate
} from './approveSheirutRequests';

function makeStrapi(answers: Record<string, any> = {}) {
  const calls: Array<{ qid: string; vars: Record<string, any> }> = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: Record<string, any>) => {
      calls.push({ qid, vars });
      if (qid in answers) {
        const a = answers[qid];
        return typeof a === 'function' ? a(vars) : a;
      }
      if (qid === '302createWant') return { data: { createWant: { data: { id: '500' } } } };
      if (qid === '303findWantForUser') return { data: { wants: { data: [] } } };
      return { data: {} };
    })
  };
  return { strapi, calls, matching: (qid: string) => calls.filter((c) => c.qid === qid) };
}

describe('mergeSheirutpendVotes', () => {
  it('reads the votes relation the addVote action writes', () => {
    const merged = mergeSheirutpendVotes({
      votes: {
        data: [
          { id: '1', attributes: { what: true, order: 0, users_permissions_user: { data: { id: '7' } } } }
        ]
      }
    });
    expect(merged).toEqual([{ what: true, order: 0, users_permissions_user: '7' }]);
  });

  it('reads the vots component the old raw-GraphQL client wrote', () => {
    const merged = mergeSheirutpendVotes({
      vots: [{ what: true, order: 0, users_permissions_user: { data: { id: '9' } } }]
    });
    expect(merged).toEqual([{ what: true, order: 0, users_permissions_user: '9' }]);
  });

  it('takes the union when a row carries both — neither store is authoritative', () => {
    const merged = mergeSheirutpendVotes({
      vots: [{ what: true, order: 0, users_permissions_user: { data: { id: '9' } } }],
      votes: {
        data: [
          { id: '1', attributes: { what: false, order: 0, users_permissions_user: { data: { id: '7' } } } }
        ]
      }
    });
    expect(merged).toHaveLength(2);
    expect(merged.map((v) => v.users_permissions_user)).toEqual(['9', '7']);
  });

  it('survives a row with neither store', () => {
    expect(mergeSheirutpendVotes({})).toEqual([]);
    expect(mergeSheirutpendVotes(null)).toEqual([]);
  });
});

describe('sheirutGate', () => {
  const memberIds = ['1', '2', '3'];

  it('matures on one member yes — the rest of the rikma is silent', () => {
    const gate = sheirutGate({
      vots: [{ what: true, order: 0, users_permissions_user: '2' }],
      memberIds,
      proposerId: '2'
    });
    expect(gate.approvable).toBe(true);
  });

  it('does not mature when nobody in the rikma said yes (D2)', () => {
    const gate = sheirutGate({ vots: [], memberIds, proposerId: '99' });
    expect(gate.approvable).toBe(false);
    expect(gate.hasPMyes).toBe(false);
  });

  it('does not count a yes from outside the rikma as the rikma answering', () => {
    // The requester's own enthusiasm is not the rikma's consent.
    const gate = sheirutGate({
      vots: [{ what: true, order: 0, users_permissions_user: '99' }],
      memberIds,
      proposerId: '99'
    });
    expect(gate.hasPMyes).toBe(false);
    expect(gate.approvable).toBe(false);
  });

  it('an objection blocks maturation even alongside an approval', () => {
    const gate = sheirutGate({
      vots: [
        { what: true, order: 0, users_permissions_user: '1' },
        { what: false, order: 0, users_permissions_user: '3' }
      ],
      memberIds,
      proposerId: '1'
    });
    expect(gate.hasNo).toBe(true);
    expect(gate.approvable).toBe(false);
  });
});

describe('approveSheirutProposal', () => {
  it('publishes the service before it closes the proposal', async () => {
    const { strapi, calls } = makeStrapi();

    await approveSheirutProposal(strapi, {}, { sheirutpendId: '12', sheirutId: '34' });

    // Order matters: if the second write is refused, the service is live and
    // the proposal is retried — never the reverse.
    expect(calls.map((c) => c.qid)).toEqual(['213updateSheirut', '73updateSheirutpend']);
    expect(calls[0].vars).toEqual({ id: '34', data: { isApruved: true } });
    expect(calls[1].vars).toEqual({ id: '12', data: { appruved: true, archived: true } });
  });

  it('leaves the proposal open when publishing the service fails', async () => {
    const { strapi, matching } = makeStrapi({
      '213updateSheirut': () => {
        throw new Error('FORBIDDEN');
      }
    });

    await expect(
      approveSheirutProposal(strapi, {}, { sheirutpendId: '12', sheirutId: '34' })
    ).rejects.toThrow('FORBIDDEN');
    expect(matching('73updateSheirutpend')).toHaveLength(0);
  });
});

describe('approveAskwant', () => {
  it('subscribes the requester, then archives the request', async () => {
    const { strapi, calls } = makeStrapi();

    const result = await approveAskwant(strapi, {}, {
      askwantId: '4',
      sheirutId: '1',
      userId: '146',
      startedAt: '2026-08-25T10:00:00.000Z'
    });

    expect(result).toEqual({ wantId: '500', created: true });
    expect(calls.map((c) => c.qid)).toEqual([
      '303findWantForUser',
      '302createWant',
      '301updateAskwant'
    ]);
    expect(calls[1].vars).toEqual({
      sheirut: '1',
      userId: '146',
      starte: '2026-08-25T10:00:00.000Z'
    });
    expect(calls[2].vars).toEqual({ id: '4', data: { archived: true } });
  });

  it('does not subscribe the same person twice when a run is retried', async () => {
    // The first attempt created the Want and died before archiving.
    const { strapi, matching } = makeStrapi({
      '303findWantForUser': { data: { wants: { data: [{ id: '77', attributes: { archived: false } }] } } }
    });

    const result = await approveAskwant(strapi, {}, {
      askwantId: '4',
      sheirutId: '1',
      userId: '146'
    });

    expect(result).toEqual({ wantId: '77', created: false });
    expect(matching('302createWant')).toHaveLength(0);
    expect(matching('301updateAskwant')).toHaveLength(1);
  });

  it('ignores an archived subscription and opens a fresh one', async () => {
    // Someone who left the service and came back is a new Want, not a revival.
    const { strapi, matching } = makeStrapi({
      '303findWantForUser': { data: { wants: { data: [{ id: '77', attributes: { archived: true } }] } } }
    });

    const result = await approveAskwant(strapi, {}, {
      askwantId: '4',
      sheirutId: '1',
      userId: '146'
    });

    expect(result.created).toBe(true);
    expect(matching('302createWant')).toHaveLength(1);
  });

  it('leaves the request open when Strapi answers without a row', async () => {
    // No error, no id — nothing was granted, so nothing may be closed.
    const { strapi, matching } = makeStrapi({ '302createWant': { data: {} } });

    await expect(
      approveAskwant(strapi, {}, { askwantId: '4', sheirutId: '1', userId: '146' })
    ).rejects.toThrow(/createWant returned no id/);
    expect(matching('301updateAskwant')).toHaveLength(0);
  });

  it('defaults the subscription start to now', async () => {
    const { strapi, matching } = makeStrapi();
    const before = Date.now();

    await approveAskwant(strapi, {}, { askwantId: '4', sheirutId: '1', userId: '146' });

    const starte = matching('302createWant')[0].vars.starte as string;
    expect(Date.parse(starte)).toBeGreaterThanOrEqual(before);
  });
});
