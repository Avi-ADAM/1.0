/**
 * `setShopStock` against an in-memory Strapi (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * S5): fenced to the rikma, `set` and `add` read on the server, a variant
 * product stocked only per variant, and no write when nothing changes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setShopStockConfig } from './shopStock.js';
import { resetStockFlagsVerdict } from '$lib/server/shop/stockFlags.js';

type Row = Record<string, any>;
let products: Map<string, Row>;
let variants: Map<string, Row>;
let writes: string[];
/** Is the `unlimited` column deployed (§2.5)? */
let flagsLive: boolean;

const strapi = {
  async execute(qid: string, vars: any) {
    switch (qid) {
      case 'ordersApiProducts': {
        // Fenced by `projectcreates` in the real query: another rikma's id is absent.
        const data = (vars.ids as string[])
          .filter((id) => products.get(id)?.project === vars.pid)
          .map((id) => ({ id, attributes: products.get(id) }));
        return { data: { matanots: { data } } };
      }
      case 'saleVariantInfo': {
        const v = variants.get(vars.id);
        return {
          data: {
            productVariant: {
              data: v
                ? { id: vars.id, attributes: { quant: v.quant, active: true, matanot: { data: { id: v.product } }, project: { data: { id: v.project } } } }
                : null
            }
          }
        };
      }
      case 'rikmaApiVariantQuant':
        variants.get(vars.id)!.quant = vars.quant;
        writes.push(`v:${vars.id}=${vars.quant}`);
        return {};
      case 'updateMatanotQuant':
        products.get(vars.id)!.quant = vars.quant;
        writes.push(`p:${vars.id}=${vars.quant}`);
        return {};
      case 'stockFlagsSchema':
        if (!flagsLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "unlimited"');
        return { data: { productVariants: { data: [] }, matanots: { data: [] } } };
      case 'stockFlagsVariants':
        return { data: { productVariants: { data: (vars.ids as string[]).filter((id) => variants.has(id)).map((id) => ({ id, attributes: { quant: variants.get(id)!.quant, unlimited: variants.get(id)!.unlimited ?? null } })) } } };
      case 'stockFlagsMatanots':
        return { data: { matanots: { data: (vars.ids as string[]).filter((id) => products.has(id)).map((id) => ({ id, attributes: { quant: products.get(id)!.quant, unlimited: products.get(id)!.unlimited ?? null } })) } } };
      case 'stockWriteVariant':
        Object.assign(variants.get(vars.id)!, { quant: vars.quant, unlimited: vars.unlimited });
        writes.push(`v:${vars.id}=${vars.quant}${vars.unlimited ? '∞' : ''}`);
        return { data: { updateProductVariant: { data: { id: vars.id, attributes: { quant: vars.quant, unlimited: vars.unlimited } } } } };
      case 'stockWriteMatanot':
        Object.assign(products.get(vars.id)!, { quant: vars.quant, unlimited: vars.unlimited });
        writes.push(`p:${vars.id}=${vars.quant}${vars.unlimited ? '∞' : ''}`);
        return { data: { updateMatanot: { data: { id: vars.id, attributes: { quant: vars.quant, unlimited: vars.unlimited } } } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  }
};

const run = (params: Record<string, unknown>) =>
  (setShopStockConfig.graphqlOperation as any)({ projectId: '57', ...params }, { userId: '7' }, { strapi });

beforeEach(() => {
  products = new Map([
    ['10', { project: '57', quant: 4, hasVariants: false }],
    ['11', { project: '57', quant: 0, hasVariants: true }],
    ['99', { project: '58', quant: 4, hasVariants: false }]
  ]);
  variants = new Map([
    ['77', { product: '11', project: '57', quant: -2 }],
    ['88', { product: '99', project: '58', quant: 5 }]
  ]);
  writes = [];
  flagsLive = false;
  resetStockFlagsVerdict();
});

describe('setShopStock', () => {
  it('sets a product without variants', async () => {
    const r = await run({ productId: '10', mode: 'set', value: 9 });
    expect(r).toMatchObject({ quant: 9, changed: true, stockChanges: [{ productId: '10', variantId: null, quant: 9 }] });
    expect(writes).toEqual(['p:10=9']);
  });

  it('adds a delivery against the stock read on the server', async () => {
    const r = await run({ productId: '11', variantId: '77', mode: 'add', value: 5 });
    expect(r.quant).toBe(3); // -2 + 5: the queue is filled first
    expect(writes).toEqual(['v:77=3']);
  });

  it('before the unlimited column is deployed, unlimited is written as -1', async () => {
    const r = await run({ productId: '10', unlimited: true });
    expect(r.quant).toBe(-1);
    expect(writes).toEqual(['p:10=-1']);
  });

  describe('with the unlimited flag (§2.5)', () => {
    beforeEach(() => {
      flagsLive = true;
    });

    it('unlimited is the flag, with -1 beside it for older readers', async () => {
      const r = await run({ productId: '10', unlimited: true });
      expect(r).toMatchObject({ quant: -1, unlimited: true, stockChanges: [{ productId: '10', quant: -1, unlimited: true }] });
      expect(writes).toEqual(['p:10=-1∞']);
    });

    it('a variant at -1 is a queue of one: a delivery of one fills it to 0', async () => {
      Object.assign(variants.get('77')!, { quant: -1, unlimited: false });
      const r = await run({ productId: '11', variantId: '77', mode: 'add', value: 1 });
      expect(r).toMatchObject({ quant: 0, unlimited: false, changed: true });
      expect(writes).toEqual(['v:77=0']);
    });

    it('counting a shelf writes the count as one', async () => {
      await run({ productId: '10', mode: 'set', value: 6 });
      expect(products.get('10')).toMatchObject({ quant: 6, unlimited: false });
    });

    it('nothing is added to an unlimited stock', async () => {
      Object.assign(products.get('10')!, { quant: 4, unlimited: true });
      await expect(run({ productId: '10', mode: 'add', value: 3 })).rejects.toMatchObject({ code: 'INVALID_STOCK' });
    });
  });

  it('a product sold by variant is never stocked on the product', async () => {
    await expect(run({ productId: '11', mode: 'set', value: 3 })).rejects.toMatchObject({ code: 'VARIANT_REQUIRED' });
    expect(writes).toEqual([]);
  });

  it("another rikma's product or variant is not found, never written", async () => {
    await expect(run({ productId: '99', value: 1 })).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    await expect(run({ productId: '11', variantId: '88', value: 1 })).rejects.toMatchObject({ code: 'VARIANT_NOT_FOUND' });
    expect(writes).toEqual([]);
  });

  it('refuses a negative count and an add of nothing', async () => {
    await expect(run({ productId: '10', mode: 'set', value: -1 })).rejects.toMatchObject({ code: 'INVALID_STOCK' });
    await expect(run({ productId: '10', mode: 'add', value: 0 })).rejects.toMatchObject({ code: 'INVALID_STOCK' });
  });

  it('the same number again writes nothing and tells no webhook', async () => {
    const r = await run({ productId: '10', mode: 'set', value: 4 });
    expect(r).toMatchObject({ changed: false, stockChanges: [] });
    expect(writes).toEqual([]);
  });

  it('is for rikma members only', () => {
    expect(setShopStockConfig.authRules?.map((r) => r.type)).toEqual(['jwt', 'projectMember']);
  });
});
