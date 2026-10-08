/**
 * Unit tests for /api/send entity-level guards.
 *
 * Locks in the behaviour previously inlined in +server.js (same conditions,
 * status codes and messages) after the extraction into guards.js.
 */

import { describe, it, expect, vi } from 'vitest';
import { runSendGuards, filterSendResponse } from './guards.js';

const base = {
  isSer: false,
  keyValueObject: {} as Record<string, any>,
  variablesObject: {} as Record<string, any>,
  identity: null as any,
  bearer1: 'Bearer admin-token',
  ep: 'https://strapi.test/graphql'
};

/** Extract the status a thrown SvelteKit error() carries. */
function statusOf(fn: () => Promise<unknown>) {
  return fn().then(
    () => ({ threw: false as const }),
    (e: any) => ({ threw: true as const, status: e?.status, body: e?.body })
  );
}

describe('runSendGuards — 307myIncomeHistory', () => {
  const q = { ...base, queId: '307myIncomeHistory' };

  it('allows reading your own income history', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '7' } })
    ).resolves.toBeUndefined();
  });

  it('tolerates a numeric uid against a string cookie', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: 7 } })
    ).resolves.toBeUndefined();
  });

  it("blocks reading another user's income history", async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '8' } })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('blocks an omitted uid', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, callerId: '7', variablesObject: {} }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('401s when there is no caller id', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, variablesObject: { uid: '7' } }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(401);
  });

  it('does not pin the service path', async () => {
    await expect(
      runSendGuards({ ...q, isSer: true, variablesObject: { uid: '8' } })
    ).resolves.toBeUndefined();
  });
});

describe('runSendGuards — 308myResourcesViaUser', () => {
  const q = { ...base, queId: '308myResourcesViaUser' };

  it('allows reading your own resources', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '7' } })
    ).resolves.toBeUndefined();
  });

  it('tolerates a numeric uid against a string cookie', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: 7 } })
    ).resolves.toBeUndefined();
  });

  it("blocks reading another user's resources", async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '8' } })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('blocks an omitted uid', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, callerId: '7', variablesObject: {} }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('401s when there is no caller id', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, variablesObject: { uid: '7' } }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(401);
  });

  it('does not pin the service path', async () => {
    await expect(
      runSendGuards({ ...q, isSer: true, variablesObject: { uid: '8' } })
    ).resolves.toBeUndefined();
  });
});

describe('runSendGuards — ConsensusMyPlaces', () => {
  const q = { ...base, queId: 'ConsensusMyPlaces' };

  it('allows reading your own places', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: 7 } })
    ).resolves.toBeUndefined();
  });

  it("blocks reading another user's places", async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '8' } })
    );
    expect((r as any).status).toBe(403);
  });

  it('blocks the service path', async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...q, isSer: true, callerId: undefined, variablesObject: { uid: '8' } })
    );
    expect((r as any).status).toBe(403);
  });

  it('requires a caller', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, variablesObject: { uid: '8' } }));
    expect((r as any).status).toBe(401);
  });
});

describe('runSendGuards — 170getMyCoMembers', () => {
  const q = { ...base, queId: '170getMyCoMembers' };

  it('allows reading your own co-members', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '7' } })
    ).resolves.toBeUndefined();
  });

  it('tolerates a numeric uid against a string cookie', async () => {
    await expect(
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: 7 } })
    ).resolves.toBeUndefined();
  });

  it("blocks reading another user's co-members", async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...q, callerId: '7', variablesObject: { uid: '8' } })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('blocks an omitted uid', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, callerId: '7', variablesObject: {} }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('401s when there is no caller id', async () => {
    const r = await statusOf(() => runSendGuards({ ...q, variablesObject: { uid: '7' } }));
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(401);
  });

  it('does not pin the service path', async () => {
    await expect(
      runSendGuards({ ...q, isSer: true, variablesObject: { uid: '8' } })
    ).resolves.toBeUndefined();
  });
});

// Same pin as the guards above, on the variable each qid actually takes.
for (const [queId, variable] of [
  ['8getMissionsOnProgress', 'id'],
  ['64getUserProjectList', 'uid'],
  ['saleCenterUserProducts', 'uid']
] as const) {
  describe(`runSendGuards — ${queId}`, () => {
    const q = { ...base, queId };

    it('allows reading your own', async () => {
      await expect(
        runSendGuards({ ...q, callerId: '7', variablesObject: { [variable]: '7' } })
      ).resolves.toBeUndefined();
    });

    it('tolerates a numeric id against a string caller id', async () => {
      await expect(
        runSendGuards({ ...q, callerId: '7', variablesObject: { [variable]: 7 } })
      ).resolves.toBeUndefined();
    });

    it("blocks reading another user's", async () => {
      const r = await statusOf(() =>
        runSendGuards({ ...q, callerId: '7', variablesObject: { [variable]: '8' } })
      );
      expect(r.threw).toBe(true);
      expect((r as any).status).toBe(403);
    });

    it('blocks an omitted id', async () => {
      const r = await statusOf(() => runSendGuards({ ...q, callerId: '7', variablesObject: {} }));
      expect(r.threw).toBe(true);
      expect((r as any).status).toBe(403);
    });

    it('401s when there is no caller id', async () => {
      const r = await statusOf(() => runSendGuards({ ...q, variablesObject: { [variable]: '7' } }));
      expect(r.threw).toBe(true);
      expect((r as any).status).toBe(401);
    });

    it('does not pin the service path', async () => {
      await expect(
        runSendGuards({ ...q, isSer: true, variablesObject: { [variable]: '8' } })
      ).resolves.toBeUndefined();
    });
  });
}

describe('runSendGuards — 42UpdatePosition', () => {
  it('blocks a service edit (isSer, support !== true)', async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...base, queId: '42UpdatePosition', isSer: true, keyValueObject: {} })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('allows a service vote (support === true)', async () => {
    await expect(
      runSendGuards({ ...base, queId: '42UpdatePosition', isSer: true, keyValueObject: { support: true } })
    ).resolves.toBeUndefined();
  });

  it('allows a registered-user edit (not isSer)', async () => {
    await expect(
      runSendGuards({ ...base, queId: '42UpdatePosition', isSer: false, keyValueObject: {} })
    ).resolves.toBeUndefined();
  });
});

describe('runSendGuards — UpdateClause', () => {
  it('blocks a service call editing body/issueId', async () => {
    const r = await statusOf(() =>
      runSendGuards({ ...base, queId: 'UpdateClause', isSer: true, keyValueObject: { body: 'x' } })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('rejects a service call without __identity.externalId', async () => {
    const r = await statusOf(() =>
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: true,
        keyValueObject: { stanceValue: 1 },
        variablesObject: { id: '10' },
        identity: {}
      })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('allows the clause author (matching authorExternalId) and passes the JWT bearer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { clause: { data: { attributes: { authorExternalId: 'ext-1' } } } } })
    });
    await expect(
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: true,
        keyValueObject: { stanceValue: 1 },
        variablesObject: { id: '10' },
        identity: { externalId: 'ext-1' },
        fetch: fetchMock as any
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer admin-token');
  });

  it('blocks a non-author service call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { clause: { data: { attributes: { authorExternalId: 'someone-else' } } } } })
    });
    const r = await statusOf(() =>
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: true,
        keyValueObject: { stanceValue: 1 },
        variablesObject: { id: '10' },
        identity: { externalId: 'ext-1' },
        fetch: fetchMock as any
      })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  function clauseBy(authorExternalId: unknown) {
    return vi.fn().mockResolvedValue({
      json: async () => ({ data: { clause: { data: { attributes: { authorExternalId } } } } })
    });
  }

  it('lets the registered author edit body on the JWT path', async () => {
    const fetchMock = clauseBy('12');
    await expect(
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        callerId: '12',
        keyValueObject: { body: 'x' },
        variablesObject: { id: '10', body: 'x' },
        fetch: fetchMock as any
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('matches a numeric caller id against the stored string', async () => {
    await expect(
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        callerId: 12 as any,
        keyValueObject: { body: 'x' },
        variablesObject: { id: '10' },
        fetch: clauseBy('12') as any
      })
    ).resolves.toBeUndefined();
  });

  it("blocks a registered user editing someone else's clause", async () => {
    const r = await statusOf(() =>
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        callerId: '12',
        keyValueObject: { body: 'x' },
        variablesObject: { id: '10' },
        fetch: clauseBy('99') as any
      })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('blocks editing a clause that has no recorded author', async () => {
    const r = await statusOf(() =>
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        callerId: '12',
        keyValueObject: { stanceValue: 1 },
        variablesObject: { id: '10' },
        fetch: clauseBy(null) as any
      })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(403);
  });

  it('401s a JWT-path edit with no verified caller', async () => {
    const r = await statusOf(() =>
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        keyValueObject: { body: 'x' },
        variablesObject: { id: '10' }
      })
    );
    expect(r.threw).toBe(true);
    expect((r as any).status).toBe(401);
  });
});

/**
 * A Strapi double for the bridge guards: answers each lookup by the field the
 * query asks for. `rows` maps a field (pmash, openMission, negotiation, …) to
 * its `data`; anything unlisted comes back as a missing row.
 */
function strapiRows(rows: Record<string, any>) {
  return vi.fn().mockImplementation(async (_ep: string, opts: any) => {
    const { query } = JSON.parse(opts.body);
    const field = Object.keys(rows).find((f) => new RegExp(`\\{ ${f}\\(id`).test(query));
    return { json: async () => ({ data: { [field ?? 'none']: { data: field ? rows[field] : null } } }) };
  });
}

const memberOf = (...ids: string[]) => ({
  id: '42',
  attributes: { project: { data: { id: '5', attributes: { user_1s: { data: ids.map((id) => ({ id })) } } } } }
});

for (const queId of ['GetNegotiationBySource', 'GetNegotiationResolutionBySource']) {
  describe(`runSendGuards — ${queId}`, () => {
    const q = { ...base, queId };

    it('lets a member of the source rikma find the discussion', async () => {
      const fetchMock = strapiRows({ pmash: memberOf('7') });
      await expect(
        runSendGuards({
          ...q,
          callerId: '7',
          variablesObject: { sourceType: 'pmash', sourceId: '42' },
          fetch: fetchMock as any
        })
      ).resolves.toBeUndefined();
    });

    it('accepts the open listing a card may also negotiate (openMission)', async () => {
      const fetchMock = strapiRows({ openMission: memberOf('7') });
      await expect(
        runSendGuards({
          ...q,
          callerId: '7',
          variablesObject: { sourceType: 'mission', sourceId: '42' },
          fetch: fetchMock as any
        })
      ).resolves.toBeUndefined();
    });

    it('blocks a logged-in user outside the source rikma', async () => {
      const fetchMock = strapiRows({ tosplit: memberOf('8', '9') });
      const r = await statusOf(() =>
        runSendGuards({
          ...q,
          callerId: '7',
          variablesObject: { sourceType: 'tosplit', sourceId: '42' },
          fetch: fetchMock as any
        })
      );
      expect(r).toMatchObject({ threw: true, status: 403 });
    });

    it('blocks an unknown source type without a lookup', async () => {
      const fetchMock = strapiRows({});
      const r = await statusOf(() =>
        runSendGuards({
          ...q,
          callerId: '7',
          variablesObject: { sourceType: 'project', sourceId: '42' },
          fetch: fetchMock as any
        })
      );
      expect(r).toMatchObject({ threw: true, status: 403 });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('401s without a caller id', async () => {
      const r = await statusOf(() =>
        runSendGuards({ ...q, variablesObject: { sourceType: 'pmash', sourceId: '42' } })
      );
      expect(r).toMatchObject({ threw: true, status: 401 });
    });
  });
}

describe('runSendGuards — 43SetNegotiationResolution', () => {
  const q = { ...base, queId: '43SetNegotiationResolution' };
  const negotiation = { attributes: { sourceType: 'tosplit', sourceId: '42' } };
  const resolution = { v: 1, sourceType: 'tosplit', sourceId: '42', values: {} };

  it('lets a member of the source rikma sign', async () => {
    const fetchMock = strapiRows({ negotiation, tosplit: memberOf('7') });
    await expect(
      runSendGuards({
        ...q,
        callerId: '7',
        variablesObject: { id: '3', resolution, status: 'completed' },
        fetch: fetchMock as any
      })
    ).resolves.toBeUndefined();
  });

  it('blocks a non-member from signing', async () => {
    const fetchMock = strapiRows({ negotiation, tosplit: memberOf('8') });
    const r = await statusOf(() =>
      runSendGuards({
        ...q,
        callerId: '7',
        variablesObject: { id: '3', resolution, status: 'completed' },
        fetch: fetchMock as any
      })
    );
    expect(r).toMatchObject({ threw: true, status: 403 });
  });

  it('rejects a resolution that names another source', async () => {
    const fetchMock = strapiRows({ negotiation, tosplit: memberOf('7') });
    const r = await statusOf(() =>
      runSendGuards({
        ...q,
        callerId: '7',
        variablesObject: { id: '3', resolution: { ...resolution, sourceId: '99' } },
        fetch: fetchMock as any
      })
    );
    expect(r).toMatchObject({ threw: true, status: 400 });
  });

  it('refuses a negotiation that was not bridged', async () => {
    const fetchMock = strapiRows({ negotiation: { attributes: {} } });
    const r = await statusOf(() =>
      runSendGuards({
        ...q,
        callerId: '7',
        variablesObject: { id: '3', resolution },
        fetch: fetchMock as any
      })
    );
    expect(r).toMatchObject({ threw: true, status: 403 });
  });
});

describe('runSendGuards — unguarded qids', () => {
  it('is a no-op for a qid with no registered guard', async () => {
    await expect(
      runSendGuards({ ...base, queId: '12mission', isSer: true })
    ).resolves.toBeUndefined();
  });
});

describe('filterSendResponse — 39GetNegotiation', () => {
  it('nulls a private negotiation on the service path', () => {
    const newd = { data: { negotiation: { data: { attributes: { visibility: 'private' } } } } };
    const out = filterSendResponse({ queId: '39GetNegotiation', isSer: true, newd });
    expect(out).toEqual({ negotiation: { data: null } });
  });

  it('leaves a public negotiation untouched', () => {
    const newd = { data: { negotiation: { data: { attributes: { visibility: 'public' } } } } };
    const out = filterSendResponse({ queId: '39GetNegotiation', isSer: true, newd });
    expect(out).toBeUndefined();
  });

  it('does not filter on the JWT path (not isSer)', () => {
    const newd = { data: { negotiation: { data: { attributes: { visibility: 'private' } } } } };
    const out = filterSendResponse({ queId: '39GetNegotiation', isSer: false, newd });
    expect(out).toBeUndefined();
  });

  it('is a no-op for an unfiltered qid', () => {
    const out = filterSendResponse({ queId: '12mission', isSer: true, newd: { data: {} } });
    expect(out).toBeUndefined();
  });
});
