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

const wishNode = (over: Record<string, unknown> = {}, proposals: any[] = []) => ({
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
    ratsonProposals: { data: proposals }
  }
});

/**
 * Answers the wish query with `node`, and the owner's "hidden proposals" query (C-10) with
 * the given ids — a mock that answered every qid alike would read the whole proposal list as
 * "hidden".
 */
const answer = (node: unknown, hidden: string[] = []) =>
  sendToSer.mockImplementation(async (_arg: unknown, qid: string) =>
    qid === '394hiddenWishProposals'
      ? { data: { ratsonProposals: { data: hidden.map((id) => ({ id })) } } }
      : node
  );

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


describe('/concierge/[id] loader — the terms negotiation, from the wisher’s side (C-9)', () => {
  const proposal = (over: Record<string, unknown> = {}) => ({
    id: '77',
    attributes: {
      status_proposal: 'suggested',
      kind: 'partial',
      total_price: 680,
      proposer_users: { data: [{ id: '20', attributes: { username: 'דנה' } }] },
      covered_missions: [{ id: 'c1', extracted_mission_idx: '55', hours: 6, price: 680 }],
      covered_resources: [],
      ratson_willingness_entry: [
        {
          user: { data: { id: '20' } },
          agree: false,
          note: 'השולחן דורש שעתיים נוספות',
          willingHours: 6,
          willingAmount: 680
        }
      ],
      ...over
    }
  });

  it('hands each proposal its negotiation: whose move, the terms on the table, what was said', async () => {
    answer(wishNode({}, [proposal()]));
    const out: any = await load(event());
    expect(out.proposals[0].negotiation).toMatchObject({
      canCounter: true,
      round: 1,
      signedBy: 'provider',
      yourTurn: true,
      amount: 6,
      price: 680
    });
    expect(out.proposals[0].negotiation.counters[0].note).toBe('השולחן דורש שעתיים נוספות');
  });

  it('after she countered it is the provider’s move', async () => {
    answer(
      wishNode({}, [
        proposal({
          ratson_willingness_entry: [
            { user: { data: { id: '5' } }, agree: false, note: 'התקציב מאפשר חמש שעות', willingHours: 5, willingAmount: 640 }
          ]
        })
      ])
    );
    const out: any = await load(event());
    expect(out.proposals[0].negotiation).toMatchObject({ signedBy: 'wisher', yourTurn: false });
  });

  it('a first-contact proposal carries no silence deadline — only talking starts the clock (C-9)', async () => {
    answer(wishNode({}, [proposal({ ratson_willingness_entry: [], createdAt: '2026-10-01T10:00:00.000Z' })]));
    const out: any = await load(event());
    expect(out.proposals[0].negotiation).toMatchObject({ round: 0, deadlineAt: null });

    answer(wishNode({}, [proposal({ createdAt: '2026-10-01T10:00:00.000Z' })]));
    const countered: any = await load(event());
    expect(countered.proposals[0].negotiation.round).toBe(1);
  });
});

describe('/concierge/[id] loader — what the owner chose to hide (C-10)', () => {
  const p = (id: string) => ({
    id,
    attributes: {
      status_proposal: 'suggested',
      kind: 'partial',
      total_price: 680,
      proposer_users: { data: [{ id: '20', attributes: { username: 'דנה' } }] },
      covered_missions: [],
      covered_resources: [],
      ratson_willingness_entry: []
    }
  });

  beforeEach(() => {
    sendToSer.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('the proposals she hid do not reach her page — the others do', async () => {
    answer(wishNode({}, [p('1'), p('2'), p('3')]), ['2']);
    const out: any = await load(event());
    expect(out.proposals.map((x: any) => String(x.id))).toEqual(['1', '3']);
  });

  it('a backend that does not know the field yet hides nothing — and the page still loads', async () => {
    sendToSer.mockImplementation(async (_a: unknown, qid: string) =>
      qid === '394hiddenWishProposals' ? { errors: [{ message: 'Invalid key hidden_by_wisher' }] } : wishNode({}, [p('1'), p('2')])
    );
    const out: any = await load(event());
    expect(out.proposals).toHaveLength(2);

    sendToSer.mockImplementation(async (_a: unknown, qid: string) => {
      if (qid === '394hiddenWishProposals') throw new Error('network');
      return wishNode({}, [p('1')]);
    });
    expect(((await load(event())) as any).proposals).toHaveLength(1);
  });
});
