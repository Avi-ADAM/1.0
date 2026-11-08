import { describe, expect, it } from 'vitest';
import { missionsFromBom, offsiteCostOf, offsiteDealTerms, offsiteSideOf } from './offsiteDeal';

const line = (id: number | null, a: Record<string, unknown> = {}, hoursPerUnit = 0) => ({
  attributes: { hoursPerUnit, mesimabetahalich: { data: id == null ? null : { id, attributes: a } } }
});

describe('offsiteDealTerms', () => {
  it('defaults to the product price and one unit', () => {
    expect(offsiteDealTerms({ productPrice: 300 })).toEqual({ ok: true, price: 300, quantity: 1, total: 300 });
  });
  it('takes the agreed price and quantity', () => {
    expect(offsiteDealTerms({ productPrice: 300, price: 250, quantity: 3 })).toEqual({ ok: true, price: 250, quantity: 3, total: 750 });
  });
  it('a product with no price is a deal at 0, not a failure', () => {
    expect(offsiteDealTerms({ productPrice: null })).toMatchObject({ ok: true, price: 0, total: 0 });
  });
  it('refuses zero quantity and a negative price', () => {
    expect(offsiteDealTerms({ productPrice: 1, quantity: 0 }).ok).toBe(false);
    expect(offsiteDealTerms({ productPrice: 1, price: -5 }).ok).toBe(false);
  });
});

describe('missionsFromBom', () => {
  it('reads each line that has its mission in progress, once', () => {
    const out = missionsFromBom([
      line(7, { name: 'עיצוב', hoursassinged: 10, howmanyhoursalready: 4, users_permissions_user: { data: { id: 1, attributes: { username: 'dana' } } } }),
      line(7, { name: 'עיצוב' }),
      line(null),
      line(8, { name: 'הדפסה', finnished: true, hoursassinged: 2, howmanyhoursalready: 2 }),
      line(9, { name: 'משלוח' }, 1.5)
    ]);
    expect(out).toEqual([
      { id: '7', name: 'עיצוב', status: 'in-progress', hours: 10, hoursDone: 4, paid: false, sub: 'dana' },
      { id: '8', name: 'הדפסה', status: 'done', hours: 2, hoursDone: 2, paid: false, sub: undefined },
      { id: '9', name: 'משלוח', status: 'waiting', hours: 1.5, hoursDone: 0, paid: false, sub: undefined }
    ]);
  });
});

describe('offsiteCostOf', () => {
  const m = (h: number, rate: number, units = 1) => ({ attributes: { hoursPerUnit: h, ratePerHour: rate, unitsPerProduct: units } });
  const r = (q: number, p: number) => ({ attributes: { quantityPerUnit: q, pricePerUnit: p } });
  it('a BOM of missions only puts the whole price on missions (deal 10: 20h × 100)', () => {
    expect(offsiteCostOf(2000, [m(20, 100)], [])).toEqual({ missions: 2000, resources: 0 });
  });
  it('splits in the BOM proportion and always adds up to the agreed price', () => {
    expect(offsiteCostOf(3000, [m(10, 100)], [r(2, 500)])).toEqual({ missions: 1500, resources: 1500 });
    const c = offsiteCostOf(1000, [m(1, 100)], [r(1, 200)])!;
    expect(c.missions + c.resources).toBe(1000);
  });
  it('a BOM with no prices, or a deal at 0, says nothing', () => {
    expect(offsiteCostOf(2000, [m(20, 0)], [])).toBeNull();
    expect(offsiteCostOf(0, [m(20, 100)], [])).toBeNull();
  });
});

describe('offsiteSideOf', () => {
  const res = (customers: number[], lead: any = { id: 5, attributes: { name: 'רוני', organization: null } }) => ({
    data: {
      sheirut: { data: { id: 1, attributes: {
        users_permissions_users: { data: customers.map((id) => ({ id })) },
        matanot: { data: { attributes: { matanot_recipe_missions: { data: [line(3, { name: 'x' })] } } } }
      } } },
      leads: { data: lead ? [lead] : [] }
    }
  });

  it('a deal with no customer account reads its lead and its BOM work', () => {
    const side = offsiteSideOf(res([]));
    expect(side?.lead).toEqual({ id: '5', name: 'רוני', organization: null });
    expect(side?.missions.map((m) => m.id)).toEqual(['3']);
  });
  it("reads the deal's own missions (fulfillments) before the product's BOM lines, once each", () => {
    const own = {
      data: {
        sheirutFulfillments: {
          data: [
            { attributes: { createdMissions: { data: { id: 11, attributes: { name: 'שלי' } } } } },
            { attributes: { createdMissions: { data: { id: 3, attributes: { name: 'x' } } } } },
            { attributes: { createdMissions: { data: null } } }
          ]
        }
      }
    };
    expect(offsiteSideOf(res([]), own)?.missions.map((m) => m.id)).toEqual(['11', '3']);
    // Refused or absent: the BOM lines alone.
    expect(offsiteSideOf(res([]), undefined)?.missions.map((m) => m.id)).toEqual(['3']);
  });
  it('a deal with a customer on the site is not off-site — its product work may be shared', () => {
    expect(offsiteSideOf(res([42]))).toBeNull();
  });
  it('no lead still shows the work', () => {
    expect(offsiteSideOf(res([], null))).toMatchObject({ lead: null });
  });
  it('a missing deal reads as nothing', () => {
    expect(offsiteSideOf({ data: { sheirut: { data: null } } })).toBeNull();
  });
});
