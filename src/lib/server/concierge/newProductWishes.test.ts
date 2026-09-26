import { describe, expect, it } from 'vitest';
import { pickWishOffers, type OpenWish } from './newProductWishes.js';
import { productPlace } from './localMatch.js';
import type { CandidateMatanot } from '../actions/configs/matchRatson.js';

const TIBERIAS = { lat: 32.7922, lng: 35.5312 };

const product = (id: string, name: string, keywords: string | null = null): CandidateMatanot => ({
  id,
  name,
  keywords,
  price: 90,
  estimatedPrice: null,
  pricingMode: 'fixed',
  place: productPlace({ location: { ...TIBERIAS, radius: 20 } }),
  categoryIds: [],
  categoryNames: [],
  projectId: '12',
  projectVallues: []
});

const wish = (id: string, needs: string[], ownerIds = ['50']): OpenWish => ({
  id,
  ownerIds,
  facts: {
    needs: needs.map((name, idx) => ({ name, isResource: false, idx })),
    place: { ...TIBERIAS, radius: 10 },
    categoryIds: [],
    categoryLabels: [],
    vallues: []
  }
});

const opts = { supplierId: '5', threshold: 0.25 };

describe('pickWishOffers', () => {
  it('offers a new product to the wish whose need it answers, by name or by keywords', () => {
    const offers = pickWishOffers(
      [product('1', 'מגש ארוחת בוקר', 'בראנץ׳, אירוח אורחים, הפתעה ליום הולדת'), product('2', 'שיעור גיטרה')],
      [wish('r1', ['אירוח אורחים בשבת']), wish('r2', ['תיקון מזגן'])],
      opts
    );
    expect(offers.map((o) => [o.ratsonId, o.cand.id, o.cand.need.name])).toEqual([['r1', '1', 'אירוח אורחים בשבת']]);
    expect(offers[0].ownerIds).toEqual(['50']);
  });

  it("never offers to the supplier's own wish", () => {
    expect(pickWishOffers([product('1', 'אירוח אורחים')], [wish('r1', ['אירוח אורחים'], ['5'])], opts)).toEqual([]);
  });

  it('caps per wish and in total, strongest first', () => {
    const products = ['אירוח אורחים', 'אירוח אורחים בבית', 'אירוח'].map((n, i) => product(String(i + 1), n));
    const wishes = Array.from({ length: 5 }, (_, i) => wish(`r${i}`, ['אירוח אורחים']));
    const offers = pickWishOffers(products, wishes, { ...opts, perWish: 2, total: 7 });
    expect(offers).toHaveLength(7);
    for (const w of wishes) expect(offers.filter((o) => o.ratsonId === w.id).length).toBeLessThanOrEqual(2);
    const scores = offers.map((o) => o.cand.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});
