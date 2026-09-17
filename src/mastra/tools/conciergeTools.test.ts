import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
const getMcpContext = vi.fn();

vi.mock('../../lib/send/sendToSer', () => ({
  sendToSer: (...args: any[]) => sendToSer(...args)
}));
vi.mock('../../lib/server/mcpContext.js', () => ({
  getMcpContext: () => getMcpContext()
}));

const {
  excerpt,
  matchesQuery,
  shapeCatalog,
  shapeMyWishes,
  shapeWishDetails,
  shapeMyWishOffers,
  searchCatalogTool,
  getWishDetailsTool
} = await import('./conciergeTools');

describe('excerpt / matchesQuery', () => {
  it('strips markup, collapses space and clips', () => {
    expect(excerpt('<p>hello   <b>world</b></p>')).toBe('hello world');
    expect(excerpt('abcdef', 4)).toBe('abc…');
    expect(excerpt(null)).toBe('');
  });

  it('matches case-insensitively across the given fields, and an empty query matches all', () => {
    expect(matchesQuery(['A Laptop', null], 'laptop')).toBe(true);
    expect(matchesQuery(['A Laptop'], 'desk')).toBe(false);
    expect(matchesQuery([null], '  ')).toBe(true);
  });
});

describe('shapeCatalog', () => {
  const products = {
    matanots: {
      data: [
        {
          id: '1',
          attributes: {
            name: 'Wooden desk',
            price: 300,
            projectcreates: { data: [{ id: '10', attributes: { projectName: 'Carpentry' } }] }
          }
        },
        {
          id: '2',
          attributes: { name: 'Desk lamp', projectcreates: { data: [{ id: '88', attributes: { projectName: 'QA' } }] } }
        },
        { id: '3', attributes: { name: 'Chair' } }
      ]
    }
  };

  it('filters by query and keeps the public fields', () => {
    const items = shapeCatalog('products', products, 'desk', 10);
    expect(items.map((i) => i.id)).toEqual(['1']);
    expect(items[0]).toMatchObject({ kind: 'products', name: 'Wooden desk', price: 300, projectId: '10' });
    expect(items[0].url).toMatch(/\/gift\/1$/);
  });

  it('drops rows from a hidden QA rikma', () => {
    const items = shapeCatalog('products', products, 'lamp', 10);
    expect(items).toEqual([]);
  });

  it('honours the limit', () => {
    expect(shapeCatalog('products', products, '', 2)).toHaveLength(2);
  });
});

describe('shapeWishDetails', () => {
  const wish = (overrides: any = {}) => ({
    ratson: {
      data: {
        id: '9',
        attributes: {
          name: 'A bookshelf',
          desc: 'fits the corner',
          status_ratson: 'open',
          access_mode: 'free_threshold',
          fulfillment_score: 0.5,
          extracted_missions: [{ id: 'm1', name: 'build it', importance: 'must', hoursEst: 8 }],
          extracted_resources: [{ id: 'r1', name: 'oak', importance: 'nice', quantityEst: 2 }],
          users_permissions_users: { data: [{ id: '42', attributes: { username: 'noa' } }] },
          ...overrides
        }
      }
    },
    ratsonProposals: {
      data: [
        {
          id: 'p1',
          attributes: {
            kind: 'service',
            status_proposal: 'pending',
            total_price: 900,
            match_score: 0.8,
            proposer_users: { data: [{ id: '7', attributes: { username: 'dan' } }] },
            project: { data: { attributes: { projectName: 'Carpentry' } } }
          }
        }
      ]
    }
  });

  it('gives the owner the breakdown and the proposals', () => {
    const d: any = shapeWishDetails(wish(), '42');
    expect(d).toMatchObject({ isOwner: true, visible: true, coverageScore: 0.5 });
    expect(d.missionsNeeded).toEqual([{ id: 'm1', name: 'build it', importance: 'must', hoursEstimate: 8 }]);
    expect(d.proposals[0]).toMatchObject({ id: 'p1', proposers: ['dan'], totalPrice: 900 });
  });

  it('gives a proposer the same detail', () => {
    const d: any = shapeWishDetails(wish(), '7');
    expect(d).toMatchObject({ isOwner: false, isProposer: true, visible: true });
    expect(d.proposals).toHaveLength(1);
  });

  it('gives an outsider the public card of an open wish, without proposals', () => {
    const d: any = shapeWishDetails(wish(), '999');
    expect(d).toMatchObject({ visible: true, isOwner: false, isProposer: false });
    expect(d.proposals).toBeUndefined();
    expect(d.missionsNeeded).toBeUndefined();
  });

  it('hides a draft or personal wish from an outsider', () => {
    expect(shapeWishDetails(wish({ status_ratson: 'draft' }), '999')).toMatchObject({ visible: false });
    expect(shapeWishDetails(wish({ access_mode: 'personal' }), '999')).toMatchObject({ visible: false });
    expect(shapeWishDetails(wish({ fulfilled: true }), '999')).toMatchObject({ visible: false });
  });

  it('returns null when there is no wish', () => {
    expect(shapeWishDetails({ ratson: { data: null } }, '42')).toBeNull();
  });
});

describe('shapeMyWishes / shapeMyWishOffers', () => {
  it('summarises a wish with its counts', () => {
    const [w] = shapeMyWishes({
      ratsons: {
        data: [
          {
            id: '9',
            attributes: {
              name: 'A bookshelf',
              desc: '<p>oak</p>',
              status_ratson: 'matching',
              fulfillment_score: 0.25,
              extracted_missions: [{ id: 'm1' }],
              extracted_resources: []
            }
          }
        ]
      }
    });
    expect(w).toMatchObject({
      id: '9',
      description: 'oak',
      status: 'matching',
      coverageScore: 0.25,
      missionsNeeded: 1,
      resourcesNeeded: 0
    });
  });

  it('summarises an offer with the wish behind it', () => {
    const [o] = shapeMyWishOffers({
      ratsonProposals: {
        data: [
          {
            id: 'p1',
            attributes: {
              kind: 'product',
              status_proposal: 'pending',
              ratson: { data: { id: '9', attributes: { name: 'A bookshelf', status_ratson: 'open' } } }
            }
          }
        ]
      }
    });
    expect(o).toMatchObject({ proposalId: 'p1', wishId: '9', wishName: 'A bookshelf', status: 'pending' });
    expect(o.url).toMatch(/\/wish\/9$/);
  });
});

describe('tools', () => {
  beforeEach(() => {
    sendToSer.mockReset();
    getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
  });

  it('getWishDetails refuses a wish that is not open', async () => {
    sendToSer.mockResolvedValue({
      data: {
        ratson: { data: { id: '9', attributes: { name: 'x', status_ratson: 'draft', users_permissions_users: { data: [{ id: '1' }] } } } },
        ratsonProposals: { data: [] }
      }
    });
    const res: any = await (getWishDetailsTool as any).execute({ wishId: '9' }, {});
    expect(res).toMatchObject({ success: false, denied: true });
  });

  it('searchCatalog does not leak a raw backend error', async () => {
    sendToSer.mockRejectedValue(new Error('GraphQL: Unknown field "secret"'));
    const res: any = await (searchCatalogTool as any).execute({ query: 'desk' }, {});
    expect(res.success).toBe(false);
    expect(res.message).not.toMatch(/GraphQL/);
  });

  it('searchCatalog asks only for the requested directories', async () => {
    sendToSer.mockResolvedValue({ data: { matanots: { data: [] } } });
    await (searchCatalogTool as any).execute({ query: 'desk', kinds: ['products'] }, {});
    expect(sendToSer).toHaveBeenCalledTimes(1);
    expect(sendToSer.mock.calls[0][1]).toBe('282discoverProducts');
  });
});

describe('P4 — write half', () => {
  const executeAction = vi.fn();
  const extractWish = vi.fn();

  vi.doMock('../../lib/server/actions/index.js', () => ({ actionService: { executeAction } }));
  vi.doMock('../../lib/server/adminToken.js', () => ({ normalizeAdminToken: (t: any) => t ?? 'admin' }));
  vi.doMock('../../lib/server/ai/extractWish', () => ({ extractWish: (...a: any[]) => extractWish(...a) }));
  vi.doMock('$env/static/private', () => ({ GEMINI_API_KEY: 'test-key' }));

  beforeEach(() => {
    executeAction.mockReset();
    extractWish.mockReset();
    getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
  });

  it('shapeExtraction flattens the model output and normalises importance', async () => {
    const { shapeExtraction } = await import('./conciergeTools');
    expect(
      shapeExtraction({
        titleSuggestion: 'A bookshelf',
        missions: [{ name: 'build', imp: 'must' }, { name: 'paint' }],
        resources: [{ name: 'oak', imp: 'must' }],
        skills: [{ name: 'carpentry' }],
        categories: ['home'],
        hints: [{ kind: 'question', text: 'how tall?' }]
      })
    ).toEqual({
      titleSuggestion: 'A bookshelf',
      missions: [
        { name: 'build', importance: 'must' },
        { name: 'paint', importance: 'nice' }
      ],
      resources: [{ name: 'oak', importance: 'must' }],
      skills: ['carpentry'],
      categories: ['home'],
      hints: [{ kind: 'question', text: 'how tall?' }]
    });
  });

  it('previewWish saves nothing and says so', async () => {
    const { previewWishTool } = await import('./conciergeTools');
    extractWish.mockResolvedValue({ titleSuggestion: 'A bookshelf', missions: [], resources: [] });
    const res: any = await (previewWishTool as any).execute({ text: 'I need a bookshelf for the corner' }, {});
    expect(res.success).toBe(true);
    expect(res.titleSuggestion).toBe('A bookshelf');
    expect(res.note).toMatch(/Nothing was saved/);
    expect(executeAction).not.toHaveBeenCalled();
  });

  it('draftWish creates a private draft owned by the key holder, never a published wish', async () => {
    const { draftWishTool } = await import('./conciergeTools');
    executeAction.mockResolvedValue({ success: true, data: { id: '9' } });

    const res: any = await (draftWishTool as any).execute(
      { name: 'A bookshelf', text: 'oak, fits the corner', missions: [{ name: 'build it', importance: 'must' }] },
      {}
    );

    const [action, params, context] = executeAction.mock.calls[0];
    expect(action).toBe('createRatson');
    expect(params.status_ratson).toBe('draft');
    expect(params.access_mode).toBe('personal');
    expect(params.extracted_missions).toEqual([{ name: 'build it', importance: 'must', hoursEst: undefined }]);
    expect(context.userId).toBe('42');
    expect(res).toMatchObject({ success: true, wishId: '9', status: 'draft' });
    expect(res.url).toMatch(/\/concierge\/9$/);
  });

  it('draftWish reports a failed action without leaking its internals', async () => {
    const { draftWishTool } = await import('./conciergeTools');
    executeAction.mockResolvedValue({ success: false, error: { message: 'GraphQL: forbidden field' } });
    const res: any = await (draftWishTool as any).execute({ name: 'Shelf', text: 'something long enough' }, {});
    expect(res.success).toBe(false);
    expect(res.message).not.toMatch(/GraphQL/);
  });
});
