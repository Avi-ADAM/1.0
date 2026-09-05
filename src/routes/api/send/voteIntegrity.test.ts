/**
 * The invariant under test is narrow on purpose: casting a vote must not be
 * able to delete somebody else's. Everything about *whether* the caller may
 * vote lives elsewhere.
 */

import { describe, it, expect, vi } from 'vitest';

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }));

import { tallyByUser, droppedEntries, enforceVoteIntegrity } from './voteIntegrity.js';

const REL = 'users_permissions_user';
/** As Strapi reads them back. */
const stored = (...ids: (string | null)[]) =>
  ids.map((id) => ({ [REL]: { data: id == null ? null : { id } } }));
/** As a client submits them. */
const sent = (...ids: (string | null)[]) => ids.map((id) => ({ [REL]: id }));

describe('tallyByUser', () => {
  it('counts both the read shape and the submitted shape the same way', () => {
    expect(tallyByUser(stored('7', '9', '7'), REL)).toEqual(
      tallyByUser(sent('7', '9', '7'), REL)
    );
  });

  it('buckets unattributed entries together rather than dropping them', () => {
    const counts = tallyByUser(stored(null, null, '7'), REL);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe('droppedEntries', () => {
  it('is empty when the caller only adds their own vote', () => {
    expect(droppedEntries(stored('7', '9'), sent('7', '9', '4'), REL, '4')).toEqual([]);
  });

  it('is empty when the caller changes their own entry', () => {
    expect(droppedEntries(stored('7', '4'), sent('7', '4'), REL, '4')).toEqual([]);
  });

  it('reports another member whose vote disappeared', () => {
    expect(droppedEntries(stored('7', '9'), sent('9', '4'), REL, '4')).toEqual([
      { userId: '7', was: 1, now: 0 }
    ]);
  });

  it('lets the caller drop their own entry', () => {
    expect(droppedEntries(stored('7', '4'), sent('7'), REL, '4')).toEqual([]);
  });

  it('catches a partial cull, not just a full one', () => {
    expect(droppedEntries(stored('7', '7', '7'), sent('7'), REL, '4')).toEqual([
      { userId: '7', was: 3, now: 1 }
    ]);
  });
});

describe('enforceVoteIntegrity', () => {
  const target = { op: 'update' as const, entity: 'Tosplit', field: 'tosplit', idVar: 'id' };
  const componentLists = [
    { field: 'vots', varName: 'vots', inputType: 'ComponentProjectsVotsInput' }
  ];

  const strapiHolding = (...ids: string[]) =>
    vi.fn(async () =>
      new Response(
        JSON.stringify({ data: { tosplit: { data: { attributes: { vots: stored(...ids) } } } } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

  const base = {
    queId: '124addVoteToTosplit',
    isSer: false,
    callerId: '4',
    bearer1: 'Bearer x',
    ep: 'http://strapi/graphql',
    targets: [target],
    componentLists,
    mode: 'enforce' as const
  };

  it('allows an ordinary added vote', async () => {
    await expect(
      enforceVoteIntegrity({
        ...base,
        variablesObject: { id: '5', vots: sent('7', '9', '4') },
        fetch: strapiHolding('7', '9') as any
      })
    ).resolves.toBeUndefined();
  });

  it('refuses a submission that erases the other members — the mass assignment', async () => {
    await expect(
      enforceVoteIntegrity({
        ...base,
        variablesObject: { id: '5', vots: sent('4') },
        fetch: strapiHolding('7', '9') as any
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('shadow-logs on an entity that is not enforced yet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const doFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ data: { ask: { data: { attributes: { vots: stored('7') } } } } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    await expect(
      enforceVoteIntegrity({
        ...base,
        queId: '120addVoteToAsk',
        targets: [{ op: 'update', entity: 'Ask', field: 'ask', idVar: 'id' }],
        variablesObject: { id: '5', vots: sent('4') },
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ignores component types that carry no attribution', async () => {
    const doFetch = strapiHolding('7');
    await expect(
      enforceVoteIntegrity({
        ...base,
        componentLists: [
          { field: 'negom', varName: 'negom', inputType: 'ComponentProjectsNegomInput' }
        ],
        variablesObject: { id: '5', negom: [{ price: 1 }] },
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    expect(doFetch).not.toHaveBeenCalled();
  });

  it('never checks the service path', async () => {
    const doFetch = strapiHolding('7', '9');
    await expect(
      enforceVoteIntegrity({
        ...base,
        isSer: true,
        variablesObject: { id: '5', vots: sent('4') },
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    expect(doFetch).not.toHaveBeenCalled();
  });
});
