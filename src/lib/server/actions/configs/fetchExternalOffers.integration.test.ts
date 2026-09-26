/**
 * fetchExternalOffers against a mocked Strapi and a mocked provider
 * (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §11): owner-only, the flag, the
 * cache and its debounce, the daily quota, and only gaps are searched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ActionExecutionHandler } from '../types';

const env: Record<string, string> = {};
vi.mock('$env/dynamic/private', () => ({ env }));

const search = vi.fn();
vi.mock('../../concierge/searchProviders/gemini.js', () => ({
  geminiGroundingProvider: () => ({ id: 'gemini', available: () => true, search })
}));

const { fetchExternalOffersConfig, dismissExternalOfferConfig, __resetExternalLimiters } = await import(
  './fetchExternalOffers'
);

const OWNER = '7';

function wishRow(over: Record<string, any> = {}) {
  return {
    users_permissions_users: { data: [{ id: OWNER }] },
    extracted_missions: [
      { id: 1, name: 'צלם אירועים', importance: 'must' },
      { id: 2, name: 'קייטרינג', importance: 'nice' }
    ],
    extracted_resources: [],
    location_hint: 'הרצל 12, חיפה',
    isOnline: false,
    language: 'he',
    lat: null,
    lng: null,
    radius: null,
    // A member who is a caterer covers row m:1.
    ai_meta: {
      enrichment: {
        people: [{ id: '1', username: 'דנה', skills: ['קייטרינג'], matchedSkills: [], projects: [] }]
      }
    },
    ...over
  };
}

function mockStrapi(attrs: any) {
  const writes: any[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      if (qid === '105queryRatsonWithProposals') {
        return { data: { ratson: { data: { id: '55', attributes: attrs } }, ratsonProposals: { data: [] } } };
      }
      if (qid === '100updateRatson') {
        writes.push(vars);
        attrs.ai_meta = vars.ai_meta;
        return { data: {} };
      }
      throw new Error(`unexpected ${qid}`);
    })
  };
  return { strapi, writes };
}

const ctx = (userId = OWNER) => ({ userId, jwt: 'j', lang: 'he', fetch: vi.fn() as any });
const run = (config: any, params: any, strapi: any, userId = OWNER) =>
  (config.graphqlOperation as ActionExecutionHandler)(params, ctx(userId), { strapi } as any) as Promise<any>;

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
  env.CONCIERGE_EXTERNAL = 'on';
  env.GEMINI_API_KEY = 'k';
  search.mockReset();
  search.mockImplementation(async (q: any) => [
    { url: `https://studio-${q.key.replace(':', '')}.co.il/`, title: `${q.need} בחיפה`, snippet: 'צילום' }
  ]);
  __resetExternalLimiters();
});

describe('fetchExternalOffers', () => {
  it('is inert while the flag is off', async () => {
    env.CONCIERGE_EXTERNAL = '';
    const { strapi } = mockStrapi(wishRow());
    const out = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(out.status).toBe('disabled');
    expect(strapi.execute).not.toHaveBeenCalled();
  });

  it('refuses anyone but the owner', async () => {
    const { strapi } = mockStrapi(wishRow());
    await expect(run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi, '99')).rejects.toThrow(/owner/);
    expect(search).not.toHaveBeenCalled();
  });

  it('searches only the uncovered row and saves the run on the wish', async () => {
    const { strapi, writes } = mockStrapi(wishRow());
    const out = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(out.status).toBe('ok');
    expect(search).toHaveBeenCalledTimes(1);
    const q = search.mock.calls[0][0];
    expect(q).toEqual({ key: 'm:0', need: 'צלם אירועים', locationLabel: 'חיפה', language: 'he', kind: 'mission' });
    expect(out.offers.map((o: any) => o.domain)).toEqual(['studio-m0.co.il']);
    expect(writes).toHaveLength(1);
    expect(writes[0].ai_meta.external.version).toBe(1);
    // The rest of ai_meta survives the write.
    expect(writes[0].ai_meta.enrichment.people).toHaveLength(1);
  });

  it('answers from the cache, and debounces a forced re-run', async () => {
    const { strapi } = mockStrapi(wishRow());
    await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    const cached = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(cached.status).toBe('cached');
    expect(cached.offers).toHaveLength(1);
    const forced = await run(fetchExternalOffersConfig, { ratsonId: '55', force: true }, strapi);
    expect(forced.status).toBe('too_soon');
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('re-runs when forced after the cooldown', async () => {
    const old = new Date(Date.now() - 2 * 3_600_000).toISOString();
    const { strapi } = mockStrapi(
      wishRow({
        ai_meta: {
          external: { version: 1, fetchedAt: old, provider: 'gemini', queries: [], gaps: [], offers: [], dismissed: [] }
        }
      })
    );
    const out = await run(fetchExternalOffersConfig, { ratsonId: '55', force: true }, strapi);
    expect(out.status).toBe('ok');
  });

  it('says no_gaps when every row is answered inside', async () => {
    const { strapi } = mockStrapi(
      wishRow({ extracted_missions: [{ id: 2, name: 'קייטרינג', importance: 'nice' }] })
    );
    const out = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(out.status).toBe('no_gaps');
    expect(search).not.toHaveBeenCalled();
  });

  it('stops at the daily quota per wisher', async () => {
    env.CONCIERGE_EXTERNAL_DAILY_USER = '1';
    const a = mockStrapi(wishRow());
    expect((await run(fetchExternalOffersConfig, { ratsonId: '55' }, a.strapi)).status).toBe('ok');
    const b = mockStrapi(wishRow());
    expect((await run(fetchExternalOffersConfig, { ratsonId: '56' }, b.strapi)).status).toBe('quota');
  });

  it('keeps the saved run when every search fails', async () => {
    search.mockRejectedValue(new Error('429'));
    const { strapi, writes } = mockStrapi(wishRow());
    const out = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(out.status).toBe('error');
    expect(writes).toHaveLength(0);
  });

  it('dismisses a card for good', async () => {
    const attrs = wishRow();
    const { strapi } = mockStrapi(attrs);
    const first = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    const id = first.offers[0].id;
    const d = await run(dismissExternalOfferConfig, { ratsonId: '55', offerId: id }, strapi);
    expect(d.dismissed).toBe(true);
    const again = await run(fetchExternalOffersConfig, { ratsonId: '55' }, strapi);
    expect(again.offers).toEqual([]);
    // Still gone after a forced re-run that finds the same page again.
    (attrs.ai_meta as any).external.fetchedAt = new Date(Date.now() - 2 * 3_600_000).toISOString();
    const rerun = await run(fetchExternalOffersConfig, { ratsonId: '55', force: true }, strapi);
    expect(rerun.status).toBe('ok');
    expect(search).toHaveBeenCalledTimes(2);
    expect(rerun.offers).toEqual([]);
  });
});
