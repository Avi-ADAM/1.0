/**
 * "Every code that prices a BOM skips `none` — checked by one test that walks
 * every reader" (PLAN_SHOP_OPERATIONS §2.4). A new reader of
 * `matanot_recipe_resources` that turns rows into money belongs in this list.
 */
import { describe, expect, it } from 'vitest';
import { isEssenceOnly, pricedResourceRows, resourceRowPrice } from './bomPrice';
import { costAt, hasGroupCurve, priceAt, resourceLineCost, toBomLines } from './priceCurve';
import { linesFromMatanot } from './departure';
import { linePrice } from '$lib/server/deal/offerDeal';
import { buildDealLines } from '$lib/sheirut/dealDue';
import { offerView } from '$lib/offer/directOffer';

/** 2 m of fabric at 30 — but as an essence-only row it is a stock link, not a price. */
const essence = { quantityPerUnit: 2, pricePerUnit: 30, priceMode: 'none', costShape: 'shared', mode: 'consumeExisting' };
const priced = { quantityPerUnit: 1, pricePerUnit: 10, priceMode: 'fixed' };
const node = (id: number, attributes: Record<string, unknown>) => ({ id, attributes });

describe('every BOM price reader skips essence-only rows', () => {
  it('the helper', () => {
    expect(isEssenceOnly(essence)).toBe(true);
    expect(isEssenceOnly(priced)).toBe(false);
    expect(resourceRowPrice(essence)).toBe(0);
    expect(resourceRowPrice(priced)).toBe(10);
    expect(pricedResourceRows([node(1, essence), node(2, priced)]).map((n) => n.id)).toEqual([2]);
  });

  it('the price curve (product page, pool offers, MatanotPublicView)', () => {
    expect(resourceLineCost(essence)).toBe(0);
    const bom = toBomLines([], [essence, priced]);
    expect(costAt(bom, 1)).toBe(10);
    expect(costAt(bom, 5)).toBe(50);
    expect(priceAt(bom, 1)).toBe(10);
    // A `shared` essence row must not invent a group curve either.
    expect(hasGroupCurve(toBomLines([], [essence]))).toBe(false);
  });

  it('pool departures', () => {
    const lines = linesFromMatanot({ matanot_recipe_resources: { data: [node(1, essence), node(2, priced)] } });
    expect(lines).toHaveLength(1);
    expect(lines[0].cost).toBe(10);
  });

  it('an open offer filling a deal line', () => {
    expect(linePrice('resource', essence)).toBe(0);
    expect(linePrice('resource', priced)).toBe(10);
  });

  it('a deal’s lines (what the customer owes)', () => {
    const lines = buildDealLines({
      productName: 'שולחן',
      recipeMissions: [],
      recipeResources: [node(1, { ...essence, mode: 'createNew' }), node(2, priced)] as any,
      missions: []
    });
    expect(lines.map((l) => l.key)).toEqual(['2']);
  });

  it('a direct offer’s view', () => {
    const view = offerView({
      ratson: {
        data: node(9, {
          name: 'הצעה',
          offered_by: { data: node(3, { username: 'דנה' }) },
          derivedComplexMatanot: {
            data: node(4, { matanot_recipe_missions: { data: [] }, matanot_recipe_resources: { data: [node(1, essence), node(2, priced)] } })
          }
        })
      }
    });
    expect(view?.lines.map((l) => l.lineId)).toEqual(['2']);
  });
});
