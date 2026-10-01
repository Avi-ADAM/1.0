import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * QA_CONCIERGE_E2E C-6: /concierge/[id] used to fall back to a demo wish — a
 * made-up date, place, budget and offers — whenever the wish was not in hand.
 * The loader now answers with a real error instead, and hands the page the
 * wish's own creation time (the old page invented "yesterday 21:14").
 */

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...a: unknown[]) => sendToSer(...a) }));
vi.mock('$lib/money/resolve.js', () => ({ matbeaCode: () => null }));
vi.mock('$lib/server/actionViaProxy.js', () => ({ actionViaProxy: vi.fn() }));
vi.mock('$lib/server/ai/enrichWish', () => ({
  enrichWish: vi.fn(),
  placeKey: () => null,
  EMPTY_ENRICHMENT: { skills: [], missions: [], people: [], resources: [], products: [] }
}));
vi.mock('$lib/server/ai/extractWish', () => ({ extractWish: vi.fn() }));
vi.mock('$env/static/private', () => ({ GEMINI_API_KEY: 'test' }));
vi.mock('$lib/server/concierge/bell', () => ({ loadBell: async () => [] }));
vi.mock('$lib/server/concierge/externalConfig', () => ({
  externalConfig: () => ({ enabled: false, ttlHours: 24 })
}));
vi.mock('$lib/server/concierge/externalView', () => ({
  DISABLED_PANEL: { enabled: false },
  externalPanel: () => ({ enabled: false }),
  needsOf: () => [],
  proposalsFromLoader: () => []
}));

const { load } = await import('./+page.server');

const event = (uid = '5') =>
  ({
    params: { id: '16' },
    locals: { uid, tok: 'jwt' },
    fetch: (() => {}) as unknown as typeof fetch
  }) as any;

const wishNode = (over: Record<string, unknown> = {}) => ({
  data: {
    ratson: {
      data: {
        id: '16',
        attributes: {
          name: 'פינת עבודה',
          status_ratson: 'open',
          createdAt: '2026-10-01T16:22:00.000Z',
          users_permissions_users: { data: [{ id: '5', attributes: { username: 'לקוחה' } }] },
          extracted_missions: [{ id: 1, name: 'נגרות', importance: 'must' }],
          extracted_resources: [],
          ...over
        }
      }
    },
    ratsonProposals: { data: [] }
  }
});

describe('/concierge/[id] loader — never a demo wish', () => {
  beforeEach(() => {
    sendToSer.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('a wish that does not exist is a 404, not a placeholder page', async () => {
    sendToSer.mockResolvedValue({ data: { ratson: { data: null }, ratsonProposals: { data: [] } } });
    await expect(load(event())).rejects.toMatchObject({ status: 404 });
  });

  it('a lookup that threw is a 503 — "could not ask" is not "no such wish"', async () => {
    sendToSer.mockRejectedValue(new Error('network'));
    await expect(load(event())).rejects.toMatchObject({ status: 503 });
  });

  it('a GraphQL error comes back as a value, and is also a 503', async () => {
    sendToSer.mockResolvedValue({ errors: [{ message: 'boom' }] });
    await expect(load(event())).rejects.toMatchObject({ status: 503 });
  });

  it("carries the wish's own creation time for the hero", async () => {
    sendToSer.mockResolvedValue(wishNode());
    const out: any = await load(event());
    expect(out.wish.createdAt).toBe('2026-10-01T16:22:00.000Z');
    expect(out.isOwner).toBe(true);
  });

  it('a stranger is still sent to the public view', async () => {
    sendToSer.mockResolvedValue(wishNode());
    await expect(load(event('999'))).rejects.toMatchObject({ status: 302, location: '/wish/16' });
  });
});
