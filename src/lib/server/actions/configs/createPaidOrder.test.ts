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
import { confirmOrderPaymentConfig } from './confirmOrderPayment.js';
import {
  cancelOrderConfig,
  markOrderFulfilledConfig,
  markOrderShippedConfig
} from './orderLifecycle.js';
import { validateOrderPayload, type OrderPayload } from '$lib/server/ordersApi.js';
import { resetStockFlagsVerdict } from '$lib/server/shop/stockFlags.js';

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
    failOnce: new Set<string>(),
    /** Is the `unlimited` column deployed in this Strapi? (§2.5) */
    flagsLive: false
  };
}
let db: ReturnType<typeof makeDb>;

const idsOf = (rows: Row[]) => ({ data: rows });

function orderNode(o: Row) {
  return {
    id: o.id,
    attributes: {
      ...o.data,
      holder: { data: o.data.holder ? { id: o.data.holder } : null },
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
          .map((s) => ({
            id: s.id,
            attributes: {
              externalId: s.externalId,
              in: s.in,
              unit: s.unit,
              note: s.note ?? null,
              holderStatus: s.holderStatus,
              splited: s.splited === true,
              users_permissions_user: { data: { id: s.holder } },
              tosplits: idsOf((s.tosplits ?? []).map((id: string) => ({ id })))
            }
          }))
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
        db.sales.push({ id, externalId: vars.externalId, matanot: vars.matanot, in: vars.in, unit: vars.unit, holderStatus: vars.holderStatus, source: vars.source, holder: String(vars.users_permissions_user), note: vars.note });
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
      case 'rikmaApiOrderUpdate': {
        const o = db.orders.find((x) => x.id === String(vars.id))!;
        Object.assign(o.data, vars.data);
        return { data: { updateOrder: { data: { id: o.id, attributes: { status: o.data.status } } } } };
      }
      case 'saleRefundReset': {
        const s = db.sales.find((x) => x.id === String(vars.id))!;
        Object.assign(s, { in: vars.in, unit: vars.unit, note: vars.note });
        return { data: { updateSale: { data: { id: s.id } } } };
      }
      // The `unlimited` flag — a schema without it fails validation, as Strapi does.
      case 'stockFlagsSchema':
        if (!db.flagsLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "unlimited"');
        return { data: { productVariants: idsOf([]), matanots: idsOf([]) } };
      case 'stockFlagsVariants':
        return {
          data: {
            productVariants: idsOf(
              vars.ids.filter((id: string) => db.variants.has(id)).map((id: string) => {
                const v = db.variants.get(id)!;
                return { id, attributes: { quant: v.quant, unlimited: v.unlimited ?? null } };
              })
            )
          }
        };
      case 'stockFlagsMatanots':
        return {
          data: {
            matanots: idsOf(
              vars.ids.filter((id: string) => db.products.has(id)).map((id: string) => {
                const p = db.products.get(id)!;
                return { id, attributes: { quant: p.quant, unlimited: p.unlimited ?? null, stockUnlimited: null } };
              })
            )
          }
        };
      case 'stockWriteVariant': {
        const v = db.variants.get(vars.id)!;
        Object.assign(v, { quant: vars.quant, unlimited: vars.unlimited });
        return { data: { updateProductVariant: { data: { id: vars.id, attributes: { quant: v.quant, unlimited: v.unlimited } } } } };
      }
      case 'stockWriteMatanot': {
        const p = db.products.get(vars.id)!;
        Object.assign(p, { quant: vars.quant, unlimited: vars.unlimited });
        return { data: { updateMatanot: { data: { id: vars.id, attributes: { quant: p.quant, unlimited: p.unlimited } } } } };
      }
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
  resetStockFlagsVerdict();
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
    expect(notices[0].templates.title.he).toBe('🛒 הזמנה מהאתר — חסר במלאי');
    expect(notices[0].templates.body.he).toContain('חסרות 2 יחידות');
  });

  it("names the order by the storefront's number, never by its ref", async () => {
    const r = await run(order({ displayNumber: '1042' }));
    expect(db.orders[0].data.displayNumber).toBe('1042');
    expect(r.displayNumber).toBe('1042');
    expect(db.sales[0].note).toBe('הזמנה 1042');
    const body = notices[0].templates.body.he;
    expect(body).toContain('הזמנה 1042');
    expect(body).toContain('5 פריטים'); // 2 + 2 + 1 units, not 3 lines
    expect(body).not.toContain('57:pi_1');
    expect(notices[0].templates.title.he).toBe('🛒 הזמנה חדשה מהאתר');
  });

  it('falls back to our row id when the storefront sent no number', async () => {
    const r = await run(order());
    expect(r.displayNumber).toBeNull();
    expect(notices[0].templates.body.he).toContain(`הזמנה ${r.orderId}`);
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

// ─── after the order (orderLifecycle.ts) ────────────────────────────────────

const act = (config: any, params: Record<string, any>, userId = '9') =>
  config.graphqlOperation({ projectId: '57', orderRef: '57:pi_1', ...params }, { ...context, userId }, { strapi, notifier });

describe('markOrderShipped / markOrderFulfilled', () => {
  it('moves the order forward and stamps the time', async () => {
    await run(order());
    const shipped = await act(markOrderShippedConfig, {}, '12');
    expect(shipped).toMatchObject({ status: 'shipped', changed: true });
    expect(db.orders[0].data.shippedAt).toBeTruthy();
    const done = await act(markOrderFulfilledConfig, {});
    expect(done).toMatchObject({ status: 'fulfilled', changed: true, from: 'shipped' });
  });

  it('twice is once, and backwards is refused', async () => {
    await run(order());
    await act(markOrderShippedConfig, {});
    expect(await act(markOrderShippedConfig, {})).toMatchObject({ changed: false });
    await act(markOrderFulfilledConfig, {});
    await expect(act(markOrderShippedConfig, {})).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('an unknown order is NOT_FOUND', async () => {
    await expect(act(markOrderShippedConfig, { orderRef: '57:nope' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('cancelOrder', () => {
  it('the holder resets their own sales, keeps them, and gets the stock back', async () => {
    await run(order());
    notices.length = 0;
    const r = await act(cancelOrderConfig, { reason: 'הקונה ביטל' });
    expect(r).toMatchObject({ status: 'cancelled', alreadyCancelled: false, restocked: true });
    expect(r.refunds.reset).toHaveLength(3);
    expect(db.sales).toHaveLength(3); // nothing deleted
    expect(db.sales.every((s) => s.in === 0 && s.unit === 0)).toBe(true);
    expect(db.sales[0].note).toContain('היה 620 עבור 2');
    expect(db.orders[0].data.status).toBe('cancelled');
    expect(db.variants.get('77')!.quant).toBe(3); // 1 + 2 back
    expect(db.products.get('1901')!.quant).toBe(5); // 2 + 2 + 1 back
    expect(r.stockChanges).toEqual([{ productId: '1842', variantId: '77', quant: 3, unlimited: false }]);
    expect(notices[0].intent).toBe('outcome');
  });

  it('only the holder may refund — it is their money', async () => {
    await run(order());
    await expect(act(cancelOrderConfig, {}, '12')).rejects.toMatchObject({ code: 'NOT_HOLDER' });
    expect(db.sales.every((s) => s.in > 0)).toBe(true);
  });

  it('a sale already in a split is left as it is, and the rikma is asked to settle it', async () => {
    await run(order());
    db.sales[0].tosplits = ['31'];
    notices.length = 0;
    const r = await act(cancelOrderConfig, {});
    expect(r.refunds.afterSplit).toEqual([db.sales[0].id]);
    expect(db.sales[0].in).toBe(620);
    expect(db.sales[1].in).toBe(0);
    expect(db.orders[0].data.note).toContain(db.sales[0].id);
    expect(notices[0].intent).toBe('review');
  });

  it('a shipped order is not back on the shelf unless asked', async () => {
    await run(order());
    await act(markOrderShippedConfig, {});
    const r = await act(cancelOrderConfig, {});
    expect(r.restocked).toBe(false);
    expect(db.variants.get('77')!.quant).toBe(1);
    const again = await act(cancelOrderConfig, { restock: true });
    expect(again.alreadyCancelled).toBe(true);
    expect(db.variants.get('77')!.quant).toBe(1); // a retry never restocks
  });

  it('a retried cancel finishes the resets and restocks nothing twice', async () => {
    await run(order());
    let resets = 0;
    const original = strapi.execute.bind(strapi);
    strapi.execute = async (qid: string, vars: any) => {
      if (qid === 'saleRefundReset' && ++resets === 2) throw new Error('network');
      return original(qid, vars);
    };
    await expect(act(cancelOrderConfig, {})).rejects.toThrow('network');
    strapi.execute = original;
    expect(db.orders[0].data.status).toBe('paid'); // status is written after the resets

    const r = await act(cancelOrderConfig, {});
    expect(r.refunds.already).toHaveLength(1);
    expect(r.refunds.reset).toHaveLength(2);
    expect(db.variants.get('77')!.quant).toBe(3); // restocked exactly once
  });
});

// ─── the unlimited flag (§2.5) ──────────────────────────────────────────────
//
// `-1` used to be both a count and "unlimited": a variant at 0 that sold one
// unit landed on -1 and was unlimited from then on. With the column deployed,
// the flag says unlimited and `-1` is a queue of one.

const one = (quantity: number, externalId = 'pi_1') =>
  order({ externalId, lines: [{ productId: '1842', variantId: '77', quantity, unitPrice: 310 }] });

describe('the unlimited flag', () => {
  beforeEach(() => {
    db.flagsLive = true;
  });

  it('0 − 1 is one unit waiting, written as a count — and the next sale keeps counting', async () => {
    db.variants.get('77')!.quant = 0;
    const r = await run(one(1));
    expect(r.oversold).toBe(true);
    expect(db.variants.get('77')).toMatchObject({ quant: -1, unlimited: false });
    expect(db.calls).toContain('stockWriteVariant');
    expect(db.calls).not.toContain('rikmaApiVariantQuant');

    const next = await run(one(1, 'pi_2'));
    expect(next.oversold).toBe(true); // -1 is not "unlimited"
    expect(db.variants.get('77')).toMatchObject({ quant: -2, unlimited: false });
  });

  it('a row from before the flag stops being legacy the first time it moves', async () => {
    db.variants.get('77')!.quant = 0; // unlimited: undefined — never written
    await run(one(1));
    expect(db.variants.get('77')!.unlimited).toBe(false);
  });

  it('a product without variants counts past zero the same way', async () => {
    db.products.get('1901')!.quant = 1;
    await run(order({ lines: [{ productId: '1901', quantity: 2, unitPrice: 40 }] }));
    expect(db.products.get('1901')).toMatchObject({ quant: -1, unlimited: false });
  });

  it('an unlimited variant is never moved, whatever number sits beside the flag', async () => {
    Object.assign(db.variants.get('77')!, { quant: 4, unlimited: true });
    const r = await run(one(9));
    expect(r.oversold).toBe(false);
    expect(db.variants.get('77')).toMatchObject({ quant: 4, unlimited: true });
  });

  it('cancelling an order oversold to -1 restocks it to 0, it is not skipped as unlimited', async () => {
    db.variants.get('77')!.quant = 0;
    await run(one(1));
    const r = await act(cancelOrderConfig, {});
    expect(db.variants.get('77')).toMatchObject({ quant: 0, unlimited: false });
    expect(r.stockChanges).toEqual([{ productId: '1842', variantId: '77', quant: 0, unlimited: false }]);
  });

  it('before the column is deployed, -1 is still read as unlimited (the old behaviour)', async () => {
    db.flagsLive = false;
    db.variants.get('77')!.quant = -1;
    await run(one(1));
    expect(db.variants.get('77')!.quant).toBe(-1);
    expect(db.calls).not.toContain('stockWriteVariant');
  });
});

// ─── payment by arrangement (PLAN_SHOP_OPERATIONS §5) ───────────────────────

describe('arranged orders', () => {
  const arranged = (over: Record<string, any> = {}) =>
    order({
      externalId: 'arr_1',
      payment: 'arranged',
      buyer: { name: 'דנה', phone: '050-1234567' },
      delivery: { preference: 'delivery', fee: 20 },
      ...over
    });
  const confirm = (params: Record<string, any>, userId = '9') =>
    act(confirmOrderPaymentConfig, { orderRef: '57:arr_1', method: 'bit', ...params }, userId);

  it('writes the order and its lines — no holder, no sale, no stock', async () => {
    const r = await run(arranged());
    expect(r).toMatchObject({ status: 'pendingPayment', total: 760, oversold: false });
    expect(r.expiresAt).toBeTruthy();
    expect(db.orders[0].data).toMatchObject({ status: 'pendingPayment', holder: null, paidAt: null });
    expect(db.lines).toHaveLength(3);
    expect(db.sales).toHaveLength(0);
    expect(db.variants.get('77')!.quant).toBe(3);
    expect(notices[0].metadata.type).toBe('arrangedOrder');
  });

  it('a retry is the same order, and tells nobody again', async () => {
    await run(arranged());
    const again = await run(arranged());
    expect(again).toMatchObject({ duplicated: true, status: 'pendingPayment' });
    expect(db.orders).toHaveLength(1);
    expect(notices).toHaveLength(1);
  });

  it('a charge reported under its id is refused', async () => {
    await run(arranged());
    await expect(run(order({ externalId: 'arr_1' }))).rejects.toMatchObject({ code: 'EXTERNAL_ID_CONFLICT' });
  });

  it('cannot be shipped before the money', async () => {
    await run(arranged());
    await expect(act(markOrderShippedConfig, { orderRef: '57:arr_1' })).rejects.toMatchObject({ code: 'PAYMENT_PENDING' });
  });

  it('the member who got the money confirms it: holder, a sale per line, stock, paid', async () => {
    await run(arranged());
    notices.length = 0;
    const r = await confirm({}, '12');
    expect(r).toMatchObject({ status: 'paid', changed: true, total: 760, underCatalog: false });
    expect(db.orders[0].data).toMatchObject({ status: 'paid', holder: '12', paymentMethod: 'bit', total: 760 });
    expect(db.sales.map((s) => [s.externalId, s.in, s.holder, s.holderStatus])).toEqual([
      ['arr_1:1', 620, '12', 'self'],
      ['arr_1:2', 80, '12', 'self'],
      ['arr_1:3', 40, '12', 'self']
    ]);
    expect(db.variants.get('77')!.quant).toBe(1);
    expect(r.stockChanges).toEqual([{ productId: '1842', variantId: '77', quant: 1, unlimited: false }]);
    expect(notices[0].metadata.type).toBe('paidOrder');
  });

  it('what arrived is what is recorded — a discount is spread and noted', async () => {
    await run(arranged());
    const r = await confirm({ amount: 380, method: 'cash', note: 'הנחת חבר' });
    expect(r.underCatalog).toBe(true);
    expect(db.sales.map((s) => s.in)).toEqual([310, 40, 20]);
    expect(db.orders[0].data.note).toContain('מתחת למחיר הקטלוג (760)');
    expect(db.orders[0].data.note).toContain('הנחת חבר');
  });

  it('twice is once; a second member is refused — it is not their money', async () => {
    await run(arranged());
    await confirm({}, '12');
    expect(await confirm({}, '12')).toMatchObject({ changed: false });
    await expect(confirm({}, '9')).rejects.toMatchObject({ code: 'NOT_HOLDER' });
    expect(db.sales).toHaveLength(3);
  });

  it('a confirm that died half way is finished by its member, without selling a line twice', async () => {
    await run(arranged());
    // die after the first sale: the second createSaleRecord throws once
    let n = 0;
    const orig = strapi.execute;
    (strapi as any).execute = async (qid: string, vars: any) => {
      if (qid === 'createSaleRecord' && ++n === 2) throw new Error('boom');
      return orig(qid, vars);
    };
    await expect(confirm({}, '12')).rejects.toThrow();
    (strapi as any).execute = orig;
    expect(db.orders[0].data).toMatchObject({ status: 'pendingPayment', holder: '12' });
    await expect(confirm({}, '9')).rejects.toMatchObject({ code: 'NOT_HOLDER' });
    await confirm({}, '12');
    expect(db.sales.map((s) => s.externalId)).toEqual(['arr_1:1', 'arr_1:2', 'arr_1:3']);
    expect(db.orders[0].data.status).toBe('paid');
  });

  it('any member calls off a waiting order — nothing to refund', async () => {
    await run(arranged());
    const r = await act(cancelOrderConfig, { orderRef: '57:arr_1', reason: 'לא ענה' }, '12');
    expect(r).toMatchObject({ status: 'cancelled', beforePayment: true, restocked: false });
    expect(db.orders[0].data.note).toContain('בוטל לפני תשלום: לא ענה');
    expect(await act(cancelOrderConfig, { orderRef: '57:arr_1' }, '12')).toMatchObject({ alreadyCancelled: true });
    await expect(confirm({}, '12')).rejects.toMatchObject({ code: 'ORDER_CANCELLED' });
  });
});
