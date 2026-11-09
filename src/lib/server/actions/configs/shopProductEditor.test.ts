/**
 * `saveProductVariants` against an in-memory Strapi (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * S4): stock and pictures at once, a price or a new variant through the
 * rikma's `editObject`, a personal product sovereign, SKUs unique per rikma,
 * fenced to the rikma, and what blocks a proposal never blocks the rest.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const proposals: any[] = [];
let termsLive = true;
let bomLive = true;
let linksBelong = true;
const bomApplied: any[] = [];

vi.mock('$lib/server/archive/variantTerms.js', () => ({
  variantTermsLive: async () => termsLive,
  refreshDerived: async () => undefined
}));
vi.mock('$lib/server/actions/index.js', () => ({
  actionService: {
    executeAction: async (key: string, params: any) => {
      proposals.push({ key, params });
      return { success: true, data: { decisionId: '900', deadline: '2026-10-20T10:00:00.000Z', immediate: false } };
    }
  }
}));

vi.mock('$lib/server/archive/bomTerms.js', () => ({
  bomTermsLive: async () => bomLive,
  bomLinksBelong: async () => linksBelong,
  withAssignees: async (_e: unknown, _p: unknown, terms: unknown) => terms,
  withResourcePicks: async (_e: unknown, terms: unknown) => terms,
  applyBomTerms: async (_exec: unknown, target: unknown, terms: unknown) => {
    bomApplied.push({ target, terms });
    return { added: [], changed: [], removed: [], skipped: 0 };
  }
}));

import { saveProductVariantsConfig } from './shopProductEditor.js';
import { resetStockFlagsVerdict } from '$lib/server/shop/stockFlags.js';

type Row = Record<string, any>;
let products: Map<string, Row>;
let variants: Map<string, Row>;
let options: Map<string, Row>;
let writes: string[];
let flagsLive: boolean;
let nextId: number;

function productNode(id: string) {
  const p = products.get(id)!;
  return {
    id,
    attributes: {
      name: p.name,
      price: p.price,
      pricingMode: p.pricingMode ?? 'fixed',
      quant: null,
      origin: p.origin ?? 'project',
      hasVariants: true,
      archived: false,
      lifecycle: null,
      pic: { data: null },
      pics: { data: [] },
      options: { data: (p.options ?? []).map((oid: string) => ({ id: oid, attributes: options.get(oid) })) },
      variants: {
        data: [...variants.entries()]
          .filter(([, v]) => v.product === id)
          .map(([vid, v]) => ({ id: vid, attributes: { ...v, pics: { data: [] } } }))
      },
      archive_decisions: { data: (p.openDecisions ?? []).map((d: string) => ({ id: d })) },
      projectcreates: { data: [{ id: p.project, attributes: { user_1s: { data: (p.members ?? ['7', '8']).map((m: string) => ({ id: m })) } } }] }
    }
  };
}

const strapi = {
  async execute(qid: string, vars: any) {
    switch (qid) {
      case 'shopEditorProduct': {
        const p = products.get(vars.id);
        return { data: { matanots: { data: p && p.project === vars.pid ? [productNode(vars.id)] : [] } } };
      }
      case 'shopEditorProductExtras': {
        const p = products.get(vars.id);
        return {
          data: {
            matanots: {
              data: p?.recipe
                ? [{ id: vars.id, attributes: { ratson: { data: p.ratson ? { id: p.ratson } : null }, matanot_recipe_missions: { data: p.recipe }, matanot_recipe_resources: { data: [] } } }]
                : []
            }
          }
        };
      }
      case 'shopEditorRikmaSkus':
        return {
          data: {
            productVariants: {
              data: [...variants.entries()]
                .filter(([, v]) => v.project === vars.pid)
                .map(([, v]) => ({ attributes: { sku: v.sku, matanot: { data: { id: v.product } } } }))
            }
          }
        };
      case 'shopEditorRikmaOptions':
        return {
          data: {
            productOptions: {
              data: [...options.entries()].filter(([, o]) => o.project === vars.pid).map(([id, o]) => ({ id, attributes: o }))
            }
          }
        };
      case 'shopOptionCreate': {
        const id = String(nextId++);
        options.set(id, { ...vars.data });
        writes.push(`option+${vars.data.key}`);
        return { data: { createProductOption: { data: { id } } } };
      }
      case 'shopOptionUpdate':
        Object.assign(options.get(vars.id)!, vars.data);
        writes.push(`option~${vars.id}`);
        return {};
      case 'shopProductUpdate':
        writes.push(`product:${Object.keys(vars.data).sort().join(',')}`);
        Object.assign(products.get(vars.id)!, vars.data.price !== undefined ? { price: vars.data.price } : {});
        return {};
      case 'shopVariantCreate': {
        const id = String(nextId++);
        variants.set(id, { ...vars.data, product: vars.data.matanot });
        writes.push(`variant+${vars.data.sku}`);
        return { data: { createProductVariant: { data: { id } } } };
      }
      case 'shopVariantUpdate':
        Object.assign(variants.get(vars.id)!, vars.data);
        writes.push(`variant~${vars.id}:${Object.keys(vars.data).sort().join(',')}`);
        return {};
      case 'shopRikmaCategories':
        return { data: { categories: { data: [{ id: '3', attributes: { active: true } }, { id: '4', attributes: { active: false } }] } } };
      case 'shopProductLowStock':
        writes.push(`low=${vars.lowStockAt}`);
        return {};
      case 'stockFlagsSchema':
        if (!flagsLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "unlimited"');
        return { data: { productVariants: { data: [] }, matanots: { data: [] } } };
      case 'stockFlagsVariants':
        return {
          data: {
            productVariants: {
              data: (vars.ids as string[]).filter((id) => variants.has(id)).map((id) => ({ id, attributes: { quant: variants.get(id)!.quant, unlimited: variants.get(id)!.unlimited ?? null } }))
            }
          }
        };
      case 'stockWriteMatanot':
      case 'updateMatanotQuant':
        writes.push(`product-stock ${vars.id}=${vars.quant}`);
        return { data: { updateMatanot: { data: { id: vars.id, attributes: { quant: vars.quant, unlimited: vars.unlimited } } } } };
      case 'stockWriteVariant':
      case 'rikmaApiVariantQuant':
        Object.assign(variants.get(vars.id)!, { quant: vars.quant, unlimited: vars.unlimited });
        writes.push(`stock ${vars.id}=${vars.quant}${vars.unlimited ? '∞' : ''}`);
        return { data: { updateProductVariant: { data: { id: vars.id, attributes: { quant: vars.quant, unlimited: vars.unlimited } } } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  }
};

const run = (params: Record<string, unknown>) =>
  (saveProductVariantsConfig.graphqlOperation as any)({ projectId: '57', productId: '10', ...params }, { userId: '7' }, { strapi });

const sizeAxis = [{ key: 'size', name: 'מידה', values: [{ value: 'm', label: 'M' }, { value: 'l', label: 'L' }] }];
const rowM = (over: Record<string, unknown> = {}) => ({
  id: '77',
  optionValues: [{ key: 'size', value: 'm' }],
  sku: 'KER-M',
  price: 310,
  quant: 3,
  active: true,
  position: 0,
  picIds: [],
  ...over
});

beforeEach(() => {
  proposals.length = 0;
  termsLive = true;
  bomLive = true;
  linksBelong = true;
  bomApplied.length = 0;
  flagsLive = false;
  nextId = 1000;
  writes = [];
  resetStockFlagsVerdict();
  options = new Map([['5', { project: '57', key: 'size', name: 'מידה', values: [{ value: 'm', label: 'M' }, { value: 's', label: 'S' }] }]]);
  products = new Map([
    ['10', { project: '57', name: 'סדנה', price: 280, options: ['5'] }],
    ['20', { project: '57', name: 'אחר', price: 50 }],
    ['30', { project: '58', name: 'של רקמה אחרת', price: 9 }]
  ]);
  variants = new Map([
    ['77', { product: '10', project: '57', sku: 'KER-M', name: 'M', axisKey: '|size:m|', optionValues: [{ key: 'size', value: 'm', label: 'M' }], price: 310, quant: 3, active: true, position: 0 }],
    ['88', { product: '20', project: '57', sku: 'OTHER-1', name: 'x', axisKey: '|size:l|', optionValues: [{ key: 'size', value: 'l', label: 'L' }], price: 50, quant: 1, active: true, position: 0 }]
  ]);
});

describe('saveProductVariants', () => {
  it('saves stock and visibility at once, and proposes a moved price to the rikma', async () => {
    const r = await run({ axes: sizeAxis, variants: [rowM({ quant: 9, price: 340 })] });
    expect(writes).toContain('stock 77=9');
    expect(writes.some((w) => w.startsWith('variant~77') && w.includes('price'))).toBe(false);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].params).toMatchObject({
      targetKind: 'matanot',
      targetId: '10',
      newValues: { variants: [{ kind: 'price', id: '77', from: 310, to: 340 }] }
    });
    expect(r).toMatchObject({ proposed: 1, blocked: null, proposal: { decisionId: '900' } });
  });

  it('a new variant on a rikma product waits for the partners — nothing is created', async () => {
    await run({ axes: sizeAxis, variants: [rowM(), { optionValues: [{ key: 'size', value: 'l' }], sku: 'KER-L', price: null, quant: 2 }] });
    expect(writes.some((w) => w.startsWith('variant+'))).toBe(false);
    expect(proposals[0].params.newValues.variants).toEqual([
      expect.objectContaining({ kind: 'create', sku: 'KER-L', axisKey: '|size:l|', quant: 2 })
    ]);
  });

  it('keeps every value the rikma axis had and adds the new one', async () => {
    await run({ axes: sizeAxis, variants: [rowM()] });
    expect(options.get('5')!.values.map((v: any) => v.value)).toEqual(['m', 's', 'l']);
  });

  it('a personal product is sovereign: the variant is created and the price written now', async () => {
    products.get('10')!.origin = 'personal';
    const r = await run({
      axes: sizeAxis,
      variants: [rowM({ price: 340 }), { optionValues: [{ key: 'size', value: 'l' }], sku: 'KER-L', quant: 2 }],
      basePrice: 300
    });
    expect(proposals).toHaveLength(0);
    expect(writes).toContain('variant+KER-L');
    expect(writes.some((w) => w.startsWith('variant~77') && w.includes('price'))).toBe(true);
    expect(products.get('10')!.price).toBe(300);
    expect(r.proposed).toBe(0);
  });

  it('a rikma of one is sovereign too', async () => {
    products.get('10')!.members = ['7'];
    await run({ axes: sizeAxis, variants: [rowM({ price: 400 })] });
    expect(proposals).toHaveLength(0);
  });

  it('refuses a SKU another product of the rikma uses, before writing anything', async () => {
    await expect(run({ axes: sizeAxis, variants: [rowM({ sku: 'other-1' })] })).rejects.toMatchObject({ code: 'DUPLICATE_SKU' });
    expect(writes).toEqual([]);
  });

  it('refuses an option value the product does not have', async () => {
    await expect(run({ axes: sizeAxis, variants: [rowM({ optionValues: [{ key: 'size', value: 'xl' }] })] })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  });

  it("a product of another rikma is not found, never written", async () => {
    await expect(run({ productId: '30', axes: sizeAxis, variants: [] })).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    expect(writes).toEqual([]);
  });

  it('a variant of another product is not found', async () => {
    await expect(run({ axes: sizeAxis, variants: [rowM({ id: '88', sku: 'Z' })] })).rejects.toMatchObject({ code: 'VARIANT_NOT_FOUND' });
  });

  it('an open proposal blocks the price, never the stock', async () => {
    products.get('10')!.openDecisions = ['600'];
    const r = await run({ axes: sizeAxis, variants: [rowM({ quant: 1, price: 999 })] });
    expect(writes).toContain('stock 77=1');
    expect(proposals).toHaveLength(0);
    expect(r).toMatchObject({ blocked: 'OPEN_PROPOSAL', openDecisionId: '600', proposed: 0 });
  });

  it('variant terms wait for the schema — the rest is saved', async () => {
    termsLive = false;
    const r = await run({ axes: sizeAxis, variants: [rowM({ quant: 4, price: 999 })] });
    expect(writes).toContain('stock 77=4');
    expect(r.blocked).toBe('VARIANT_TERMS_NOT_READY');
  });

  it('with the flag deployed, a stock write says it is a count', async () => {
    flagsLive = true;
    await run({ axes: sizeAxis, variants: [rowM({ unlimited: true })] });
    expect(writes).toContain('stock 77=-1∞');
    await run({ axes: sizeAxis, variants: [rowM({ unlimited: false, quant: 6 })] });
    expect(variants.get('77')).toMatchObject({ quant: 6, unlimited: false });
  });

  it('a stock below zero that sales left behind is kept, not refused', async () => {
    variants.get('77')!.quant = -2;
    await expect(run({ axes: sizeAxis, variants: [rowM({ quant: -2 })] })).resolves.toMatchObject({ blocked: null });
    await expect(run({ axes: sizeAxis, variants: [rowM({ quant: -5 })] })).rejects.toMatchObject({ code: 'INVALID_VARIANTS' });
  });

  it('the gallery: first is the cover, twelve at most', async () => {
    await run({ axes: sizeAxis, variants: [rowM()], gallery: ['1', '2', '2', '3'] });
    expect(writes).toContain('product:options,pic,pics');
  });

  it('categories are operational: written at once on a rikma product, no proposal', async () => {
    await run({ categories: ['3'] });
    expect(writes).toContain('product:categories,options');
    expect(proposals).toHaveLength(0);
  });

  it('a category outside the rikma (or switched off) is refused before anything is written', async () => {
    await expect(run({ categories: ['3', '4', '99'] })).rejects.toMatchObject({ code: 'INVALID_CATEGORIES' });
    expect(writes).toEqual([]);
  });

  it('pricingMode: refused on a rikma product, applied on a personal one', async () => {
    await expect(run({ pricingMode: 'quote' })).rejects.toMatchObject({ code: 'PRICING_MODE_IS_TERM' });
    expect(writes).toEqual([]);
    products.get('10')!.origin = 'personal';
    await run({ pricingMode: 'quote' });
    expect(writes).toContain('product:options,pricingMode');
  });

  it('a count on the product is written at once, only while it has no variants', async () => {
    variants.clear();
    await run({ variants: [], stock: { quant: 7, unlimited: false } });
    expect(writes.some((w) => w === 'product-stock 10=7')).toBe(true);
    expect(proposals).toEqual([]);
  });

  it('a product with variants ignores a count on the product', async () => {
    await run({ variants: [rowM()], stock: { quant: 7, unlimited: false } });
    expect(writes.some((w) => w.startsWith('product-stock'))).toBe(false);
  });

  it('refuses a negative count before writing anything', async () => {
    variants.clear();
    await expect(run({ variants: [], stock: { quant: -2, unlimited: false } })).rejects.toMatchObject({ code: 'INVALID_STOCK' });
    expect(writes).toEqual([]);
  });

  it('the location is operational: saved at once, nothing proposed', async () => {
    await run({ variants: [rowM()], location: { location_mode: 'onsite', lat: 32, lng: 34, radius: 12.4, location_hint: 'חיפה' } });
    expect(writes.some((w) => w.startsWith('product:') && w.includes('location'))).toBe(true);
    expect(proposals).toEqual([]);
  });
});

describe('saveProductVariants — the recipe (PLAN_PRODUCT_FORM_UNIFIED phase 3)', () => {
  const line = { id: 1, attributes: { hoursPerUnit: 2, unitsPerProduct: 1, ratePerHour: 100, pendm: { data: { attributes: { name: 'עיצוב' } } } } };
  const moved = { lines: [{ id: 'm1', amount: 2, unit: 150, removed: false }], add: [] };

  beforeEach(() => {
    Object.assign(products.get('10')!, { pricingMode: 'estimated', recipe: [line] });
  });

  it('goes to the rikma on the same round as the price, and writes no line', async () => {
    const r = await run({ axes: sizeAxis, variants: [rowM()], basePrice: 300, bom: moved });
    expect(bomApplied).toHaveLength(0);
    expect(proposals[0].params.newValues).toMatchObject({
      price: 300,
      bom: [{ kind: 'change', line: 'mission', id: '1', fromUnit: 100, toUnit: 150 }]
    });
    expect(r).toMatchObject({ proposed: 2, blocked: null });
  });

  it('a product nobody else has a say in applies it at once', async () => {
    products.get('10')!.members = ['7'];
    const r = await run({ axes: sizeAxis, variants: [rowM()], bom: moved });
    expect(proposals).toHaveLength(0);
    expect(bomApplied[0]).toMatchObject({ target: { id: '10', projectId: '57' }, terms: [{ kind: 'change', toUnit: 150 }] });
    expect(r.proposed).toBe(0);
  });

  it('waits for the schema without losing the rest of the save', async () => {
    bomLive = false;
    const r = await run({ axes: sizeAxis, variants: [rowM({ quant: 9 })], bom: moved });
    expect(r.blocked).toBe('BOM_TERMS_NOT_READY');
    expect(proposals).toHaveLength(0);
    expect(writes).toContain('stock 77=9');
  });

  it('a wish product goes through a proposal even in a rikma of one, and its price waits too', async () => {
    Object.assign(products.get('10')!, { ratson: '4', members: ['7'] });
    await run({ axes: sizeAxis, variants: [rowM()], basePrice: 400, bom: moved });
    expect(bomApplied).toHaveLength(0);
    expect(proposals[0].params.newValues).toMatchObject({ price: 400 });
    expect(products.get('10')!.price).toBe(280);
  });

  it('a fixed-price product has no recipe to change', async () => {
    products.get('10')!.pricingMode = 'fixed';
    await expect(run({ axes: sizeAxis, variants: [rowM()], bom: moved })).rejects.toMatchObject({ code: 'BOM_NEEDS_COST_PRICING' });
  });

  it('refuses an invalid recipe, and a link outside the rikma, before anything is written', async () => {
    await expect(run({ axes: sizeAxis, variants: [rowM()], bom: { lines: [{ id: 'm1', removed: true }], add: [] } })).rejects.toMatchObject({ code: 'INVALID_BOM' });
    linksBelong = false;
    await expect(run({ axes: sizeAxis, variants: [rowM()], bom: moved })).rejects.toMatchObject({ code: 'INVALID_BOM' });
    expect(writes).toEqual([]);
  });
});
