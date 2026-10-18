/**
 * `createPaidOrder` against an in-memory Strapi (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * §3.3/§5.4).
 *
 * The pure decisions are covered in ordersApi.test.ts; this file is about the
 * writes: a sale per line through `createSale` (with the variant's own stock),
 * a retry that changes nothing, a retry that finishes a half-written order
 * without selling a line twice, and a reused id that is refused.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPaidOrderConfig } from './createPaidOrder.js';
import { createSaleConfig } from './createSale.js';
import { validateOrderPayload, type OrderPayload } from '$lib/server/ordersApi.js';

type Row = Record<string, any>;

function makeDb() {
  return {
    products: new Map<string, Row>([
      ['1842', { name: 'סדנת קרמיקה', price: 280, pricingMode: 'fixed', quant: 0, kindOf: 'total', status_of_voting: 'active', hasVariants: true }],
      ['1901', { name: 'ספל', price: 40, pricingMode: 'fixed', quant: 5, kindOf: 'total', status_of_voting: 'active', hasVariants: false }]
    ]),
    variants: new Map<string, Row>([
      ['77', { sku: 'KER-M-RED', name: 'M / אדום', optionValues: [], quant: 3, active: true, product: '1842', project: '57' }]
    ]),
    orders: [] as Row[],
    lines: [] as Row[],
    sales: [] as Row[],
    calls: [] as string[],
    failOnce: new Set<string>()
  };
}
let db: ReturnType<typeof makeDb>;

const idsOf = (rows: Row[]) => ({ data: rows });

function orderNode(o: Row) {
  return {
    id: o.id,
    attributes: {
      ...o.data,
      lines: idsOf(
        db.lines
          .filter((l) => l.order === o.id)
          .map((l) => ({
            id: l.id,
            attributes: {
              ...l,
              matanot: { data: { id: l.matanot } },
              variant: { data: l.variant ? { id: l.variant } : null }
            }
          }))
      ),
      sales: idsOf(
        db.sales
          .filter((s) => s.order === o.id)
          .map((s) => ({ id: s.id, attributes: { externalId: s.externalId } }))
      )
    }
  };
}

const strapi = {
  async execute(qid: string, vars: any) {
    db.calls.push(qid);
    if (db.failOnce.has(qid)) {
      db.failOnce.delete(qid);
      throw new Error(`boom: ${qid}`);
    }
    switch (qid) {
      case 'rikmaApiOrderByRef': {
        const o = db.orders.find((x) => x.data.ref === vars.ref);
        return { data: { orders: idsOf(o ? [orderNode(o)] : []) } };
      }
      case 'ordersApiProject':
        return { data: { project: { data: { id: '57', attributes: { projectName: 'האוהל', currencyCode: 'ILS' } } } } };
      case 'ordersApiProducts':
        return {
          data: {
            matanots: idsOf(
              vars.ids.filter((id: string) => db.products.has(id)).map((id: string) => ({ id, attributes: db.products.get(id) }))
            )
          }
        };
      case 'ordersApiVariants':
        return {
          data: {
            productVariants: idsOf(
              vars.ids
                .filter((id: string) => db.variants.has(id))
                .map((id: string) => {
                  const v = db.variants.get(id)!;
                  return { id, attributes: { ...v, matanot: { data: { id: v.product } } } };
                })
            )
          }
        };
      case 'rikmaApiOrderCreate': {
        const id = String(100 + db.orders.length);
        db.orders.push({ id, data: vars.data });
        return { data: { createOrder: { data: { id, attributes: { ref: vars.data.ref } } } } };
      }
      case 'rikmaApiOrderLineCreate': {
        const id = String(200 + db.lines.length);
        db.lines.push({ id, ...vars.data });
        return { data: { createOrderLine: { data: { id } } } };
      }
      case 'saleProductHasVariants':
        return { data: { matanot: { data: { id: vars.id, attributes: { hasVariants: db.products.get(vars.id)?.hasVariants } } } } };
      case 'saleVariantInfo': {
        const v = db.variants.get(vars.id);
        return {
          data: {
            productVariant: {
              data: v ? { id: vars.id, attributes: { quant: v.quant, active: v.active, matanot: { data: { id: v.product } }, project: { data: { id: v.project } } } } : null
            }
          }
        };
      }
      case 'createSaleRecord': {
        const id = String(5500 + db.sales.length);
        db.sales.push({ id, externalId: vars.externalId, matanot: vars.matanot, in: vars.in, unit: vars.unit, holderStatus: vars.holderStatus, source: vars.source });
        return { data: { createSale: { data: { id, attributes: { in: vars.in, matanot: { data: { attributes: { name: 'x' } } } } } } } };
      }
      case 'saleLinkShop': {
        const s = db.sales.find((x) => x.id === String(vars.id))!;
        s.order = vars.order;
        s.variant = vars.product_variant;
        return { data: { updateSale: { data: { id: s.id } } } };
      }
      case 'rikmaApiVariantQuant':
        db.variants.get(vars.id)!.quant = vars.quant;
        return { data: { updateProductVariant: { data: { id: vars.id, attributes: { quant: vars.quant } } } } };
      case 'updateMatanotQuant':
        db.products.get(vars.id)!.quant = vars.quant;
        return { data: { updateMatanot: { data: { id: vars.id, attributes: { quant: vars.quant } } } } };
      case 'saleByExternalId': {
        const s = db.sales.find((x) => x.externalId === vars.externalId);
        return { data: { sales: idsOf(s ? [{ id: s.id, attributes: { holderStatus: s.holderStatus } }] : []) } };
      }
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  }
};

const notices: any[] = [];
const notifier = { notify: async (config: any) => void notices.push(config) };
const context = { userId: '9', jwt: 'admin', lang: 'he' } as any;

function order(over: Record<string, any> = {}): OrderPayload {
  const v = validateOrderPayload({
    externalId: 'pi_1',
    delivery: { preference: 'pickup' },
    lines: [
      { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310 },
      { productId: '1901', quantity: 2, unitPrice: 40 },
      { productId: '1901', quantity: 1, unitPrice: 40 }
    ],
    ...over
  });
  if (v.ok === false) throw new Error(v.message);
  return v.value;
}

const run = (o: OrderPayload) =>
  (createPaidOrderConfig.graphqlOperation as any)({ projectId: '57', order: o }, context, { strapi, notifier });

beforeEach(() => {
  db = makeDb();
  notices.length = 0;
});

describe('createPaidOrder', () => {
  it('writes an order, its lines, and a self-held sale per line', async () => {
    const r = await run(order());
    expect(r).toMatchObject({ duplicated: false, orderRef: '57:pi_1', status: 'paid', oversold: false, total: 740, currency: 'ILS' });
    expect(db.orders[0].data).toMatchObject({ status: 'paid', source: 'api', holder: '9', currencyCode: 'ILS', total: 740 });
    expect(db.lines.map((l) => l.position)).toEqual([0, 1, 2]);
    expect(db.sales.map((s) => [s.externalId, s.in, s.holderStatus, s.source])).toEqual([
      ['pi_1:1', 620, 'self', 'api'],
      ['pi_1:2', 80, 'self', 'api'],
      ['pi_1:3', 40, 'self', 'api']
    ]);
    expect(db.sales.every((s) => s.order === r.orderId)).toBe(true);
    expect(db.sales[0].variant).toBe('77');
    expect(r.lines.map((l: any) => l.saleId)).toEqual(db.sales.map((s) => s.id));
    expect(notices).toHaveLength(1);
  });

  it("moves the variant's own stock, and carries the product's from line to line", async () => {
    await run(order());
    expect(db.variants.get('77')!.quant).toBe(1); // 3 − 2, read from the server
    expect(db.products.get('1842')!.quant).toBe(0); // a variant product's quant is not touched
    expect(db.products.get('1901')!.quant).toBe(2); // 5 − 2 − 1, not 5 − 1
  });

  it('records an oversold order instead of refusing it, and says so', async () => {
    const r = await run(order({ lines: [{ productId: '1842', variantId: '77', quantity: 5, unitPrice: 310 }] }));
    expect(r.oversold).toBe(true);
    expect(db.orders[0].data.oversold).toBe(true);
    expect(db.variants.get('77')!.quant).toBe(-2);
    expect(notices[0].intent).toBe('review');
  });

  it('a retry of a finished order changes nothing and tells nobody again', async () => {
    await run(order());
    const writes = db.calls.length;
    const r = await run(order({ buyer: { phone: '052-0000000' } }));
    expect(r.duplicated).toBe(true);
    expect(db.sales).toHaveLength(3);
    expect(db.calls.slice(writes)).toEqual(['rikmaApiOrderByRef']);
    expect(notices).toHaveLength(1);
  });

  it('a reused id with different lines is refused', async () => {
    await run(order());
    await expect(
      run(order({ lines: [{ productId: '1901', quantity: 9, unitPrice: 40 }] }))
    ).rejects.toMatchObject({ code: 'EXTERNAL_ID_CONFLICT' });
  });

  it('a retry finishes a half-written order without selling a line twice', async () => {
    // Die after the first sale: the second createSaleRecord throws.
    let sales = 0;
    const original = strapi.execute.bind(strapi);
    strapi.execute = async (qid: string, vars: any) => {
      if (qid === 'createSaleRecord' && ++sales === 2) throw new Error('network');
      return original(qid, vars);
    };
    await expect(run(order())).rejects.toThrow('network');
    strapi.execute = original;
    expect(db.sales).toHaveLength(1);

    const r = await run(order());
    expect(r.duplicated).toBe(false);
    expect(db.orders).toHaveLength(1);
    expect(db.lines).toHaveLength(3);
    expect(db.sales.map((s) => s.externalId)).toEqual(['pi_1:1', 'pi_1:2', 'pi_1:3']);
  });

  it('adopts a sale whose link to the order never landed', async () => {
    db.failOnce.add('saleLinkShop'); // the first sale is written but not linked
    await run(order());
    expect(db.sales[0].order).toBeUndefined();

    const r = await run(order());
    expect(db.sales).toHaveLength(3); // no fourth sale
    expect(db.sales[0].order).toBe(r.orderId); // the link was mended
  });

  it('refuses before writing anything', async () => {
    await expect(
      run(order({ lines: [{ productId: '1842', quantity: 1, unitPrice: 310 }] }))
    ).rejects.toMatchObject({ code: 'VARIANT_REQUIRED' });
    expect(db.orders).toHaveLength(0);
    expect(db.sales).toHaveLength(0);
  });
});

describe('createSale with a variant', () => {
  const sale = (params: Record<string, any>) =>
    (createSaleConfig.graphqlOperation as any)(
      { projectId: '57', userId: '9', total: 310, quantity: 1, saleDate: '2026-10-18T00:00:00Z', availableQuantity: 0, ...params },
      context,
      { strapi, notifier }
    );

  it('refuses a variant product sold without its variant', async () => {
    await expect(sale({ productId: '1842' })).rejects.toMatchObject({ code: 'VARIANT_REQUIRED' });
    expect(db.sales).toHaveLength(0);
  });

  it("refuses another product's variant", async () => {
    await expect(sale({ productId: '1901', variantId: '77' })).rejects.toMatchObject({ code: 'VARIANT_NOT_FOUND' });
  });

  it('keeps the plain path exactly as it was', async () => {
    const r = await sale({ productId: '1901', availableQuantity: 5 });
    expect(r.newQuantity).toBe(4);
    expect(db.calls).not.toContain('saleLinkShop');
  });
});
