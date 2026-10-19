/**
 * The paid-order contract — PLAN_SHOP_CUSTOMER_EXPERIENCE §3.3/§5.4.
 *
 * Four promises worth a red test each:
 *
 *   1. **A paid order is never refused for stock.** Short stock, an inactive
 *      variant and a quantity outside min/max are recorded, not refused.
 *   2. **What is refused is refused before anything is written**: a foreign or
 *      draft product, a non-fixed price, a variant product without its variant.
 *   3. **A retry is the same order, a reused id is not.** `sameOrder` and
 *      `canResume` are what keep a provider's retry from charging twice and a
 *      changed body from overwriting history.
 *   4. **The buyer never comes back out** of `GET /orders/{ref}`.
 */

import { describe, it, expect } from 'vitest';
import {
  canResume,
  lineSaleExternalId,
  mayReceive,
  orderIsComplete,
  orderNoteOf,
  orderNumberOf,
  orderRefOf,
  orderSalesOf,
  orderWebhookBody,
  planOrder,
  refundDecisionOf,
  refundNoteOf,
  sameOrder,
  stockWebhookBody,
  toOrderView,
  transitionOf,
  validateOrderPayload,
  type OrderPayload,
  type OrderSaleRow
} from './ordersApi.js';

const BODY = {
  externalId: 'pi_3Q8x',
  paymentRef: 'pi_3Q8x',
  paymentMethod: 'card',
  currency: 'ILS',
  buyer: { name: 'דנה', email: 'dana@example.com', phone: '050-0000000' },
  delivery: { preference: 'delivery', address: { city: 'נתניה', street: 'הרצל 1' }, fee: 40 },
  note: 'בלי פלסטיק',
  lines: [
    { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310 },
    { productId: '1901', quantity: 1, unitPrice: 40 }
  ]
};

function payload(over: Partial<typeof BODY> = {}): OrderPayload {
  const v = validateOrderPayload({ ...BODY, ...over });
  if (v.ok === false) throw new Error(v.message);
  return v.value;
}

describe('validateOrderPayload', () => {
  it('accepts the §3.3 example', () => {
    const v = validateOrderPayload(BODY);
    expect(v.ok).toBe(true);
    if (v.ok === false) return;
    expect(v.value.lines).toEqual([
      { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310, note: null },
      { productId: '1901', variantId: null, quantity: 1, unitPrice: 40, note: null }
    ]);
    expect(v.value.delivery.address).toEqual({ city: 'נתניה', street: 'הרצל 1' });
  });

  it('reports every problem at once, each pinned to its line', () => {
    const v = validateOrderPayload({
      lines: [
        { productId: '', quantity: 0, unitPrice: -1 },
        { productId: '5', quantity: 1 }
      ],
      currency: 'shekel'
    });
    expect(v.ok).toBe(false);
    if (v.ok !== false) return;
    const where = v.problems.map((p) => `${p.line ?? '-'}:${p.field}`);
    expect(where).toEqual(
      expect.arrayContaining([
        '-:externalId',
        '-:currency',
        '0:productId',
        '0:quantity',
        '0:unitPrice',
        '1:unitPrice'
      ])
    );
  });

  it('needs a way to reach the buyer when something is shipped', () => {
    const v = validateOrderPayload({ ...BODY, buyer: { name: 'דנה' } });
    expect(v.ok).toBe(false);
    const pickup = validateOrderPayload({
      ...BODY,
      buyer: {},
      delivery: { preference: 'pickup' }
    });
    expect(pickup.ok).toBe(true);
  });

  it('refuses a malformed email before Strapi does', () => {
    const v = validateOrderPayload({ ...BODY, buyer: { email: 'not-an-email' } });
    expect(v.ok).toBe(false);
  });

  it('keeps an address flat and free of markup', () => {
    const v = validateOrderPayload({
      ...BODY,
      delivery: {
        preference: 'pickup',
        address: { city: 'חיפה', evil: '<script>x</script>', nested: { a: 1 } }
      }
    });
    expect(v.ok).toBe(true);
    if (v.ok === false) return;
    expect(v.value.delivery.address).toEqual({ city: 'חיפה' });
  });

  it('caps the cart', () => {
    const lines = Array.from({ length: 51 }, () => ({
      productId: '1',
      quantity: 1,
      unitPrice: 1
    }));
    expect(validateOrderPayload({ externalId: 'x', lines }).ok).toBe(false);
  });
});

describe('displayNumber — the number people say on the phone', () => {
  it('is optional, trimmed, and kept as text', () => {
    expect(payload().displayNumber).toBeNull();
    const v = validateOrderPayload({ ...BODY, displayNumber: ' #1042 ' });
    expect(v.ok && v.value.displayNumber).toBe('#1042');
    const n = validateOrderPayload({ ...BODY, displayNumber: 1042 });
    expect(n.ok && n.value.displayNumber).toBe('1042');
  });

  it('refuses an object, a long one, and markup or line breaks', () => {
    for (const bad of [{ n: 1 }, 'x'.repeat(41), '<b>1</b>', '10\n42']) {
      const v = validateOrderPayload({ ...BODY, displayNumber: bad });
      expect(v.ok).toBe(false);
      if (v.ok === false) expect(v.problems.map((p) => p.field)).toEqual(['displayNumber']);
    }
  });

  it("is the storefront's number, else our row id — never the ref", () => {
    expect(orderNumberOf('1042', 312)).toBe('1042');
    expect(orderNumberOf('  ', 312)).toBe('312');
    expect(orderNumberOf(null, '312')).toBe('312');
    expect(orderNumberOf(undefined, null)).toBe('');
  });
});

describe('addresses', () => {
  it('scopes the ref to the rikma and numbers the sales from 1', () => {
    expect(orderRefOf('57', 'pi_3Q8x')).toBe('57:pi_3Q8x');
    expect(lineSaleExternalId('pi_3Q8x', 0)).toBe('pi_3Q8x:1');
  });
});

// ─── the plan ───────────────────────────────────────────────────────────────

const product = (id: string, attrs: Record<string, any> = {}) => ({
  id,
  attributes: {
    name: `מוצר ${id}`,
    price: 100,
    pricingMode: 'fixed',
    quant: 10,
    kindOf: 'total',
    status_of_voting: 'active',
    ...attrs
  }
});
const variant = (id: string, productId: string, attrs: Record<string, any> = {}) => ({
  id,
  attributes: {
    sku: `SKU-${id}`,
    optionValues: [{ key: 'size', value: 'm', label: 'M' }],
    quant: 3,
    active: true,
    matanot: { data: { id: productId } },
    ...attrs
  }
});
const maps = (products: any[], variants: any[] = []) => ({
  products: new Map(products.map((p) => [String(p.id), p])),
  variants: new Map(variants.map((v) => [String(v.id), v]))
});

describe('planOrder — what is refused', () => {
  it('a product of another rikma (absent from the fenced query) is 404', () => {
    const plan = planOrder({ payload: payload(), ...maps([]) });
    expect(plan).toMatchObject({ ok: false, status: 404, code: 'PRODUCT_NOT_FOUND', line: 0 });
  });

  it('a draft or archived product is 404 — not sold, not revealed', () => {
    for (const attrs of [{ status_of_voting: 'voting' }, { archived: true }]) {
      const plan = planOrder({
        payload: payload({ lines: [{ productId: '1901', quantity: 1, unitPrice: 40 }] as any }),
        ...maps([product('1901', attrs)])
      });
      expect(plan).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
    }
  });

  it('a quote or estimated product cannot be sold in a till', () => {
    for (const pricingMode of ['quote', 'estimated']) {
      const plan = planOrder({
        payload: payload({ lines: [{ productId: '1901', quantity: 1, unitPrice: 40 }] as any }),
        ...maps([product('1901', { pricingMode })])
      });
      expect(plan).toMatchObject({ ok: false, status: 409, code: 'NOT_CHECKOUTABLE' });
    }
  });

  it('a product sold by variant needs the variant', () => {
    const plan = planOrder({
      payload: payload({ lines: [{ productId: '1842', quantity: 1, unitPrice: 310 }] as any }),
      ...maps([product('1842', { hasVariants: true })])
    });
    expect(plan).toMatchObject({ ok: false, status: 409, code: 'VARIANT_REQUIRED' });
  });

  it("another product's variant is 404, even when the id exists", () => {
    const plan = planOrder({
      payload: payload(),
      ...maps([product('1842'), product('1901')], [variant('77', '1901')])
    });
    expect(plan).toMatchObject({ ok: false, status: 404, code: 'VARIANT_NOT_FOUND', line: 0 });
  });
});

describe('planOrder — what is recorded, never refused', () => {
  const both = () =>
    maps(
      [product('1842', { hasVariants: true, quant: 0 }), product('1901', { quant: 5 })],
      [variant('77', '1842', { quant: 3 })]
    );

  it('plans the §3.3 order: snapshots, totals, stock untouched by the plan', () => {
    const plan = planOrder({ payload: payload(), ...both() });
    expect(plan.ok).toBe(true);
    if (plan.ok === false) return;
    expect(plan.lines[0]).toMatchObject({
      productId: '1842',
      variantId: '77',
      lineTotal: 620,
      nameSnapshot: 'מוצר 1842',
      optionLabelSnapshot: 'M',
      skuSnapshot: 'SKU-77',
      oversold: false
    });
    expect(plan.subtotal).toBe(660);
    expect(plan.computedTotal).toBe(700); // + delivery fee 40
    expect(plan.total).toBe(700);
    expect(plan.oversold).toBe(false);
  });

  it('short stock is oversold — the order still goes through', () => {
    const plan = planOrder({
      payload: payload({
        lines: [{ productId: '1842', variantId: '77', quantity: 5, unitPrice: 310 }] as any
      }),
      ...both()
    });
    expect(plan.ok).toBe(true);
    if (plan.ok === false) return;
    expect(plan.oversold).toBe(true);
    expect(plan.notes.join()).toContain('מכירת-יתר');
    expect(plan.lines[0].shortBy).toBe(2); // 5 ordered, 3 left
  });

  it('two lines on one variant share its stock', () => {
    const plan = planOrder({
      payload: payload({
        lines: [
          { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310 },
          { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310 }
        ] as any
      }),
      ...both()
    });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.lines.map((l) => l.oversold)).toEqual([false, true]);
    // The second line found 1 left, not −1: it is short by what it lacked.
    expect(plan.lines.map((l) => l.shortBy)).toEqual([0, 1]);
  });

  it('unlimited stock (-1) is never oversold', () => {
    const plan = planOrder({
      payload: payload({ lines: [{ productId: '1901', quantity: 999, unitPrice: 40 }] as any }),
      ...maps([product('1901', { quant: -1 })])
    });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.oversold).toBe(false);
  });

  it('a pre-order product (leadTimeHours) is a backlog, not an oversale', () => {
    const plan = planOrder({
      payload: payload({ lines: [{ productId: '1901', quantity: 3, unitPrice: 40 }] as any }),
      ...maps([product('1901', { quant: 0, leadTimeHours: 168 })])
    });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.oversold).toBe(false);
  });

  it('an inactive variant and an out-of-range quantity are notes, not refusals', () => {
    const plan = planOrder({
      payload: payload({
        lines: [{ productId: '1842', variantId: '77', quantity: 9, unitPrice: 310 }] as any
      }),
      ...maps(
        [product('1842', { hasVariants: true, maxOrder: 8 })],
        [variant('77', '1842', { active: false, quant: -1 })]
      )
    });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.notes.join('\n')).toMatch(/כבוי/);
    expect(plan.notes.join('\n')).toMatch(/מעל המקסימום 8/);
  });

  it('records what was charged, and notes a gap instead of refusing it', () => {
    const plan = planOrder({ payload: payload({ amount: 650 } as any), ...both() });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.total).toBe(650);
    expect(plan.notes.join()).toContain('650');
  });

  it('a coupon is the storefront\'s business — the paid unit price stands', () => {
    const plan = planOrder({
      payload: payload({ lines: [{ productId: '1901', quantity: 1, unitPrice: 1 }] as any }),
      ...maps([product('1901', { price: 100 })])
    });
    if (plan.ok === false) throw new Error(plan.message);
    expect(plan.lines[0].lineTotal).toBe(1);
  });
});

describe('orderNoteOf', () => {
  it('joins the caller note and the plan notes, skipping blanks', () => {
    expect(orderNoteOf('בלי בצל', ['שורה 1: x'])).toBe('בלי בצל\nשורה 1: x');
    expect(orderNoteOf(null, [])).toBeNull();
  });
});

// ─── retries ────────────────────────────────────────────────────────────────

const stored = (lines: any[], extra: Record<string, any> = {}) => ({
  currency: 'ILS',
  total: 700,
  lines,
  ...extra
});
const STORED_LINES = [
  { productId: '1842', variantId: '77', quantity: 2, unitPrice: 310, position: 0 },
  { productId: '1901', variantId: null, quantity: 1, unitPrice: 40, position: 1 }
];

describe('sameOrder / canResume', () => {
  it('the same charge is the same order — even with a corrected phone', () => {
    const p = payload({ buyer: { phone: '052-1111111' } } as any);
    expect(sameOrder(p, stored(STORED_LINES))).toBe(true);
  });

  it('a changed quantity under a reused id is not', () => {
    const p = payload({
      lines: [
        { productId: '1842', variantId: '77', quantity: 3, unitPrice: 310 },
        { productId: '1901', quantity: 1, unitPrice: 40 }
      ] as any
    });
    expect(sameOrder(p, stored(STORED_LINES))).toBe(false);
  });

  it('a different currency is not', () => {
    expect(sameOrder(payload({ currency: 'USD' }), stored(STORED_LINES))).toBe(false);
  });

  it('a half-written order resumes when what is there matches', () => {
    expect(canResume(payload(), stored([STORED_LINES[0]]), 700)).toBe(true);
    expect(canResume(payload(), stored([]), 700)).toBe(true);
  });

  it('but not when a line was added — the first total gives it away', () => {
    expect(canResume(payload(), stored([STORED_LINES[0]], { total: 660 }), 700)).toBe(false);
  });

  it('nor when a stored line differs at its position', () => {
    const swapped = [{ ...STORED_LINES[1], position: 0 }];
    expect(canResume(payload(), stored(swapped), 700)).toBe(false);
  });
});

// ─── reading it back ────────────────────────────────────────────────────────

const ORDER_NODE = {
  id: '9',
  attributes: {
    ref: '57:pi_3Q8x',
    externalId: 'pi_3Q8x',
    status: 'paid',
    oversold: false,
    total: 700,
    currencyCode: 'ILS',
    paidAt: '2026-10-18T09:00:00.000Z',
    buyerName: 'רותם-קונה',
    buyerPhone: '050-0000000',
    buyerEmail: 'dana@example.com',
    deliveryAddress: { city: 'נתניה' },
    lines: {
      data: [
        {
          id: '2',
          attributes: {
            position: 1,
            quantity: 1,
            unitPrice: 40,
            nameSnapshot: 'ספל',
            matanot: { data: { id: '1901' } },
            variant: { data: null }
          }
        },
        {
          id: '1',
          attributes: {
            position: 0,
            quantity: 2,
            unitPrice: 310,
            nameSnapshot: 'סדנה',
            optionLabelSnapshot: 'M',
            matanot: { data: { id: '1842' } },
            variant: { data: { id: '77' } }
          }
        }
      ]
    },
    sales: {
      data: [
        { id: '5521', attributes: { externalId: 'pi_3Q8x:1' } },
        { id: '5522', attributes: { externalId: 'pi_3Q8x:2' } }
      ]
    }
  }
};

describe('toOrderView', () => {
  it('returns lines in order, each with its sale', () => {
    const view = toOrderView(ORDER_NODE)!;
    expect(view.lines.map((l) => [l.productId, l.variantId, l.saleId])).toEqual([
      ['1842', '77', '5521'],
      ['1901', null, '5522']
    ]);
    expect(view.status).toBe('paid');
  });

  it("carries both numbers: our id, and the storefront's own when it sent one", () => {
    const plain = toOrderView({ id: 312, attributes: ORDER_NODE.attributes })!;
    expect([plain.orderId, plain.displayNumber]).toEqual(['312', null]);
    const named = toOrderView({ id: 312, attributes: { ...ORDER_NODE.attributes, displayNumber: '1042' } })!;
    expect([named.orderId, named.displayNumber]).toEqual(['312', '1042']);
  });

  it('never carries the buyer back out', () => {
    const text = JSON.stringify(toOrderView(ORDER_NODE));
    for (const secret of ['רותם-קונה', '050-0000000', 'dana@example.com', 'נתניה']) {
      expect(text).not.toContain(secret);
    }
  });

  it('knows when every line has its sale', () => {
    expect(orderIsComplete(ORDER_NODE, 2)).toBe(true);
    const missing = {
      attributes: { ...ORDER_NODE.attributes, sales: { data: [ORDER_NODE.attributes.sales.data[0]] } }
    };
    expect(orderIsComplete(missing, 2)).toBe(false);
    expect(orderIsComplete(ORDER_NODE, 3)).toBe(false);
  });
});

// ─── after the order ────────────────────────────────────────────────────────

describe('transitionOf', () => {
  it('moves forward: paid → shipped → fulfilled, and paid → fulfilled for a pickup', () => {
    expect(transitionOf('paid', 'shipped')).toEqual({ kind: 'move', from: 'paid', to: 'shipped' });
    expect(transitionOf('shipped', 'fulfilled')).toMatchObject({ kind: 'move' });
    expect(transitionOf('paid', 'fulfilled')).toMatchObject({ kind: 'move' });
  });

  it('asking for the status it has is not an error', () => {
    expect(transitionOf('shipped', 'shipped')).toEqual({ kind: 'same', status: 'shipped' });
    expect(transitionOf('cancelled', 'cancelled')).toEqual({ kind: 'same', status: 'cancelled' });
  });

  it('never goes backwards, and a cancelled order stays cancelled', () => {
    expect(transitionOf('fulfilled', 'shipped')).toMatchObject({ kind: 'refused', code: 'INVALID_TRANSITION' });
    expect(transitionOf('cancelled', 'shipped')).toMatchObject({ kind: 'refused', code: 'ORDER_CANCELLED' });
  });

  it('a refund is possible at every live stage', () => {
    for (const from of ['paid', 'shipped', 'fulfilled']) {
      expect(transitionOf(from, 'cancelled').kind).toBe('move');
    }
  });

  it('a purchase request (S3b status) is not moved by the paid-order flow', () => {
    expect(transitionOf('sent', 'shipped')).toMatchObject({ kind: 'refused' });
  });
});

const sale = (over: Partial<OrderSaleRow> = {}): OrderSaleRow => ({
  id: '5521',
  externalId: 'pi_3Q8x:1',
  in: 620,
  unit: 2,
  note: 'הזמנה 57:pi_3Q8x',
  holderStatus: 'self',
  holderId: '9',
  splited: false,
  inSplit: false,
  ...over
});

describe('refundDecisionOf', () => {
  it('the holder resets their own self-report while nothing was split', () => {
    expect(refundDecisionOf(sale(), '9')).toBe('reset');
  });

  it('a sale already in a split — proposed or approved — is left for the rikma', () => {
    expect(refundDecisionOf(sale({ inSplit: true }), '9')).toBe('afterSplit');
    expect(refundDecisionOf(sale({ splited: true }), '9')).toBe('afterSplit');
  });

  it("someone else's money is not the canceller's to correct", () => {
    expect(refundDecisionOf(sale({ holderId: '12' }), '9')).toBe('notMine');
    expect(refundDecisionOf(sale({ holderStatus: 'open' }), '9')).toBe('notMine');
    expect(refundDecisionOf(sale({ holderStatus: 'confirmed' }), '9')).toBe('notMine');
  });

  it('a reset sale is already done — a retried cancel changes nothing', () => {
    expect(refundDecisionOf(sale({ in: 0, unit: 0 }), '9')).toBe('already');
  });

  it('keeps what the sale was in its note — never a delete', () => {
    const note = refundNoteOf(sale(), '57:pi_3Q8x', 'הקונה ביטל');
    expect(note).toContain('הזמנה 57:pi_3Q8x');
    expect(note).toContain('היה 620 עבור 2');
    expect(note).toContain('הקונה ביטל');
  });
});

describe('orderSalesOf', () => {
  it('reads holder, split state and amounts from the order row', () => {
    const rows = orderSalesOf({
      attributes: {
        sales: {
          data: [
            {
              id: 7,
              attributes: {
                externalId: 'x:1',
                in: 10,
                unit: 1,
                holderStatus: 'self',
                splited: false,
                users_permissions_user: { data: { id: 9 } },
                tosplits: { data: [{ id: 3 }] }
              }
            }
          ]
        }
      }
    });
    expect(rows[0]).toMatchObject({ id: '7', holderId: '9', inSplit: true, splited: false, in: 10 });
  });
});

describe('order webhooks', () => {
  it('order events reach only keys that may read orders', () => {
    expect(mayReceive(['tasks:create', 'tasks:read'], 'order.paid')).toBe(false);
    expect(mayReceive([], 'order.paid')).toBe(false);
    expect(mayReceive(['orders:read'], 'order.statusChanged')).toBe(true);
    expect(mayReceive(['orders:create'], 'order.oversold')).toBe(true);
  });

  it('stock reaches a catalog key too — it is public on the product', () => {
    expect(mayReceive(['products:read'], 'variant.stockChanged')).toBe(true);
    expect(mayReceive(['products:read'], 'order.paid')).toBe(false);
    expect(mayReceive(['tasks:create'], 'variant.stockChanged')).toBe(false);
  });

  it('the order body is the public view — the buyer never travels', () => {
    const body = orderWebhookBody('order.paid', '57', toOrderView(ORDER_NODE)!, '2026-10-18T00:00:00Z');
    expect(JSON.parse(body)).toMatchObject({ event: 'order.paid', projectId: '57', data: { orderRef: '57:pi_3Q8x' } });
    for (const secret of ['רותם-קונה', '050-0000000', 'dana@example.com', 'נתניה']) {
      expect(body).not.toContain(secret);
    }
  });

  it('a stock event says what changed — and whether it is counted at all (§2.5)', () => {
    const body = JSON.parse(stockWebhookBody('57', { productId: '1842', variantId: '77', quant: -1, unlimited: false }));
    expect(body).toMatchObject({
      event: 'variant.stockChanged',
      data: { variantId: '77', quant: -1, unlimited: false, changed: ['quant'] }
    });
  });
});
