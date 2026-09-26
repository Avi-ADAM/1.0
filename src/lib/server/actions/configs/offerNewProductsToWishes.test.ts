import { describe, expect, it } from 'vitest';
import { offerNewProductsToWishesConfig } from './offerNewProductsToWishes.js';
import type { ActionExecutionHandler } from '../types.js';

const TIBERIAS = { lat: 32.7922, lng: 35.5312 };

function fakeStrapi(products: any[]) {
  const calls: { qid: string; vars: any; jwt: unknown }[] = [];
  return {
    calls,
    async execute(qid: string, vars: any, jwt?: unknown) {
      calls.push({ qid, vars, jwt });
      switch (qid) {
        case '377matanotsForWishOffer':
          return { data: { matanots: { data: products } } };
        case '376listOpenWishesForMatching':
          return {
            data: {
              ratsons: {
                data: [
                  {
                    id: '70',
                    attributes: {
                      ...TIBERIAS,
                      radius: 10,
                      ai_meta: { categories: ['אוכל'] },
                      extracted_missions: [{ name: 'אירוח אורחים בשבת' }],
                      extracted_resources: [],
                      categories: { data: [] },
                      vallues: { data: [] },
                      users_permissions_users: { data: [{ id: '50' }] }
                    }
                  }
                ]
              }
            }
          };
        case '101createRatsonProposal':
          return { data: { createRatsonProposal: { data: { id: '900' } } } };
        case '100updateRatson':
          return { data: {} };
        default:
          throw new Error('unexpected ' + qid);
      }
    }
  };
}

const tray = {
  id: '11',
  attributes: {
    name: 'מגש ארוחת בוקר',
    discoveryKeywords: 'אירוח אורחים, בראנץ׳',
    price: 90,
    pricingMode: 'fixed',
    location: { ...TIBERIAS, radius: 20 },
    categories: { data: [{ id: '3', attributes: { name: 'אוכל' } }] },
    projectcreates: { data: [{ id: '12', attributes: { vallues: { data: [] } } }] }
  }
};

const run = (params: any, strapi: any) =>
  (offerNewProductsToWishesConfig.graphqlOperation as ActionExecutionHandler)(
    params,
    { userId: '5', jwt: 'user-jwt', lang: 'he', fetch: (async () => new Response()) as any },
    { strapi } as any
  ) as Promise<any>;

describe('offerNewProductsToWishes', () => {
  it('proposes the new product on the matching wish and notifies only its owner', async () => {
    const strapi = fakeStrapi([tray]);
    const r = await run({ projectId: '12', matanotIds: ['11'] }, strapi);
    expect(r.data).toEqual({ proposalsCreated: 1, wishes: 1 });
    expect(r.recipientIds).toEqual(['50']);

    const read = strapi.calls.find((c) => c.qid === '377matanotsForWishOffer')!;
    expect(read.vars).toEqual({ ids: ['11'], pid: '12' });
    const proposal = strapi.calls.find((c) => c.qid === '101createRatsonProposal')!;
    expect(proposal.vars).toMatchObject({
      ratson: '70',
      matanot: '11',
      project: '12',
      kind: 'existing_matanot',
      status_proposal: 'suggested',
      auto_generated: true,
      covered_missions: [{ extracted_mission_idx: '0', hours: null, price: 90 }]
    });
    // Service token, never the member's own jwt, for the wish side.
    expect(strapi.calls.every((c) => c.jwt === undefined)).toBe(true);
    expect(strapi.calls.find((c) => c.qid === '100updateRatson')!.vars).toMatchObject({ id: '70', status_ratson: 'matching' });
  });

  it('does nothing for products the project query does not return (not mine, or still in a vote)', async () => {
    const strapi = fakeStrapi([]);
    const r = await run({ projectId: '12', matanotIds: ['999'] }, strapi);
    expect(r.data.proposalsCreated).toBe(0);
    expect(strapi.calls.map((c) => c.qid)).toEqual(['377matanotsForWishOffer']);
  });

  it('is reachable only by a member of the rikma, and never by an api key', () => {
    expect(offerNewProductsToWishesConfig.access).toEqual(['user']);
    expect(offerNewProductsToWishesConfig.authRules?.some((r) => r.type === 'projectMember')).toBe(true);
  });
});
