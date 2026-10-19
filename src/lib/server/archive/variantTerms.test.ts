/**
 * A product's variant terms on an `editObject` round (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * S4): the field probe, the round literal, the words on the vote, and applying
 * the agreed terms against the product as it is *now*.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: { execute: async () => { throw new Error('no flags'); } } }));

import {
  applyVariantTerms,
  resetVariantTermsProbe,
  variantsField,
  variantTermsLive,
  variantTermsSummary
} from './variantTerms';
import { jsonLiteral } from './gql';
import type { VariantTerm } from '$lib/shop/variantEditor';

const price: VariantTerm = { kind: 'price', id: '77', name: 'M / אדום', from: 310, to: 340 };
const create: VariantTerm = {
  kind: 'create',
  axisKey: '|size:l|',
  optionValues: [{ key: 'size', value: 'l', label: 'L' }],
  name: 'L',
  sku: 'KER-L',
  price: 360,
  compareAtPrice: null,
  unlimited: false,
  quant: 2,
  position: 1
};

describe('the round literal', () => {
  it('serialises JSON as a GraphQL literal and drops keys that are not identifiers', () => {
    expect(jsonLiteral({ a: 1, 'b-c': 2, s: 'x"y', l: [true, null] })).toBe('{ a: 1, s: "x\\"y", l: [true, null] }');
    expect(variantsField([])).toBeNull();
    expect(variantsField([price])).toBe('variants: [{ kind: "price", id: "77", name: "M / אדום", from: 310, to: 340 }]');
  });
});

describe('variantTermsLive', () => {
  beforeEach(() => resetVariantTermsProbe());

  it('is "no" when the field does not exist, and caches it', async () => {
    const exec = vi.fn(async () => ({ errors: [{ message: 'Cannot query field "variants" on type "ComponentDesisionNegoarch"' }] }));
    expect(await variantTermsLive(exec)).toBe(false);
    expect(await variantTermsLive(exec)).toBe(false);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('is "yes" once it answers', async () => {
    expect(await variantTermsLive(async () => ({ data: { decisions: { data: [] } } }))).toBe(true);
  });

  it('never reads a transport failure as "no" — a counter would drop the terms', async () => {
    await expect(variantTermsLive(async () => ({ errors: [{ message: 'Forbidden' }] }))).rejects.toThrow();
  });
});

describe('the words on the vote', () => {
  it('one line per term', () => {
    expect(variantTermsSummary([price, create], 'he')).toBe('מחיר M / אדום: 310 ← 340\nוריאציה חדשה: L · 360');
    expect(variantTermsSummary([price], 'en')).toBe('M / אדום price: 310 → 340');
  });
});

describe('applyVariantTerms', () => {
  function fakeExec(existing: Array<{ id: string; axisKey: string }>, takenSkus: string[] = []) {
    const sent: string[] = [];
    const exec = async (q: string) => {
      sent.push(q);
      if (q.includes('productVariants(filters')) return { data: { productVariants: { data: takenSkus.map((sku) => ({ attributes: { sku } })) } } };
      if (q.startsWith('{ matanot(')) {
        return {
          data: {
            matanot: {
              data: {
                id: '10',
                attributes: {
                  price: 280,
                  quant: null,
                  options: { data: [] },
                  variants: { data: existing.map((v) => ({ id: v.id, attributes: { axisKey: v.axisKey, price: 310, quant: 1, active: true } })) }
                }
              }
            }
          }
        };
      }
      if (q.includes('createProductVariant')) return { data: { createProductVariant: { data: { id: '501' } } } };
      return { data: {} };
    };
    return { exec, sent };
  }

  it('re-prices a variant of this product and creates the new one', async () => {
    const { exec, sent } = fakeExec([{ id: '77', axisKey: '|size:m|' }]);
    const r = await applyVariantTerms(exec, { id: '10', projectId: '57' }, [price, create]);
    expect(r).toEqual({ created: ['501'], priced: ['77'], skipped: 0 });
    expect(sent.some((q) => q.includes('updateProductVariant(id: "77", data: { price: 340 })'))).toBe(true);
    expect(sent.some((q) => q.includes('createProductVariant') && q.includes('axisKey: "|size:l|"') && q.includes('optionValues: [{ key: "size"'))).toBe(true);
  });

  it('drops a price for a variant that is not this product’s', async () => {
    const { exec } = fakeExec([]);
    const r = await applyVariantTerms(exec, { id: '10', projectId: '57' }, [price]);
    expect(r).toEqual({ created: [], priced: [], skipped: 1 });
  });

  it('a combination that meanwhile exists gets the agreed price instead of a twin', async () => {
    const { exec, sent } = fakeExec([{ id: '80', axisKey: '|size:l|' }]);
    const r = await applyVariantTerms(exec, { id: '10', projectId: '57' }, [create]);
    expect(r.priced).toEqual(['80']);
    expect(sent.some((q) => q.includes('createProductVariant'))).toBe(false);
  });

  it('a SKU someone took meanwhile gets a suffix', async () => {
    const { exec, sent } = fakeExec([], ['ker-l']);
    await applyVariantTerms(exec, { id: '10', projectId: '57' }, [create]);
    expect(sent.find((q) => q.includes('createProductVariant'))).toContain('sku: "KER-L-2"');
  });
});
