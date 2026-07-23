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

  it('does not guard the JWT path (not isSer)', async () => {
    await expect(
      runSendGuards({
        ...base,
        queId: 'UpdateClause',
        isSer: false,
        keyValueObject: { body: 'x' }
      })
    ).resolves.toBeUndefined();
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
