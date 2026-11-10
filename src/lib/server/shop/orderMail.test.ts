import { describe, expect, it, vi } from 'vitest';
import {
  MailThrottle,
  looksLikeMailbox,
  mailOrderFromNode,
  orderMailKindFor,
  runOrderMail,
  type MailDeps
} from './orderMail';
import { trackingLine } from '$lib/shop/tracking';

describe('orderMailKindFor', () => {
  it('paid orders and arranged ones, once', () => {
    expect(orderMailKindFor('createPaidOrder', { status: 'paid' })).toBe('paid');
    expect(orderMailKindFor('createPaidOrder', { data: { status: 'pendingPayment' } })).toBe('received');
    expect(orderMailKindFor('createPaidOrder', { status: 'paid', duplicated: true })).toBeNull();
  });

  it('a confirmed payment', () => {
    expect(orderMailKindFor('confirmOrderPayment', { changed: true, status: 'paid' })).toBe('paid');
    expect(orderMailKindFor('confirmOrderPayment', { changed: false, status: 'paid' })).toBeNull();
  });

  it('a shipment — only when the status really moved', () => {
    expect(orderMailKindFor('markOrderShipped', { changed: true, status: 'shipped' })).toBe('shipped');
    expect(orderMailKindFor('markOrderShipped', { changed: false, status: 'shipped' })).toBeNull();
    // Handed over / picked up is not a "shipped" mail.
    expect(orderMailKindFor('markOrderFulfilled', { changed: true, status: 'fulfilled' })).toBeNull();
  });

  it('a tracking number — only for a parcel that already left', () => {
    const t = { carrier: null, number: '1', url: null };
    expect(orderMailKindFor('setOrderTracking', { changed: true, status: 'shipped', tracking: t })).toBe('tracking');
    expect(orderMailKindFor('setOrderTracking', { changed: true, status: 'paid', tracking: t })).toBeNull();
    expect(orderMailKindFor('setOrderTracking', { changed: true, status: 'shipped', tracking: null })).toBeNull();
    expect(orderMailKindFor('setOrderTracking', { changed: false, status: 'shipped', tracking: t })).toBeNull();
  });

  it('a cancel — never-paid and paid orders read differently, a retry says nothing', () => {
    expect(orderMailKindFor('cancelOrder', { status: 'cancelled', beforePayment: true })).toBe('cancelledUnpaid');
    expect(orderMailKindFor('cancelOrder', { status: 'cancelled', alreadyCancelled: false })).toBe('cancelled');
    expect(orderMailKindFor('cancelOrder', { status: 'cancelled', alreadyCancelled: true })).toBeNull();
  });

  it('a lapsed order', () => {
    expect(orderMailKindFor('expireOrder', { changed: true, orderRef: 'ABC' })).toBe('expired');
    expect(orderMailKindFor('expireOrder', { changed: false })).toBeNull();
  });

  it('nothing for other actions', () => {
    expect(orderMailKindFor('createSale', {})).toBeNull();
  });
});

describe('looksLikeMailbox', () => {
  it('rejects what could break a header or no mailbox could be', () => {
    expect(looksLikeMailbox('dana@example.com')).toBe(true);
    expect(looksLikeMailbox('a@b')).toBe(false);
    expect(looksLikeMailbox('a b@example.com')).toBe(false);
    expect(looksLikeMailbox('a@example.com, b@example.com')).toBe(false);
    expect(looksLikeMailbox('"x" <a@example.com>')).toBe(false);
    expect(looksLikeMailbox(null)).toBe(false);
  });
});

describe('MailThrottle', () => {
  const limits = {
    perAddress: { max: 3, windowMs: 1000 },
    receivedPerRikma: { max: 2, windowMs: 1000 }
  };

  it('caps one address across kinds, and lets the window pass', () => {
    const t = new MailThrottle(limits);
    expect(t.take('a@x.com', '1', 'paid', 0)).toBe(true);
    expect(t.take('A@x.com', '1', 'shipped', 10)).toBe(true);
    expect(t.take('a@x.com', '1', 'tracking', 20)).toBe(true);
    expect(t.take('a@x.com', '1', 'paid', 30)).toBe(false);
    expect(t.take('b@x.com', '1', 'paid', 30)).toBe(true);
    expect(t.take('a@x.com', '1', 'paid', 1500)).toBe(true);
  });

  it('caps the arranged "received" mail per rikma, not the paid ones', () => {
    const t = new MailThrottle(limits);
    expect(t.take('a@x.com', '1', 'received', 0)).toBe(true);
    expect(t.take('b@x.com', '1', 'received', 0)).toBe(true);
    expect(t.take('c@x.com', '1', 'received', 0)).toBe(false);
    expect(t.take('c@x.com', '2', 'received', 0)).toBe(true);
    expect(t.take('d@x.com', '1', 'paid', 0)).toBe(true);
  });

  it('a refused mail takes no slot', () => {
    const t = new MailThrottle(limits);
    for (let i = 0; i < 3; i++) t.take('a@x.com', '1', 'paid', 0);
    expect(t.take('a@x.com', '1', 'received', 0)).toBe(false);
    // …so the rikma's own count did not move.
    expect(t.take('z@x.com', '1', 'received', 0)).toBe(true);
    expect(t.take('y@x.com', '1', 'received', 0)).toBe(true);
    expect(t.take('x@x.com', '1', 'received', 0)).toBe(false);
  });
});

const node = (over: Record<string, any> = {}) => ({
  id: '57',
  attributes: {
    displayNumber: '1042',
    status: 'paid',
    total: 190,
    currencyCode: 'ILS',
    locale: 'en',
    oversold: false,
    note: null,
    buyerName: 'Dana',
    buyerEmail: 'dana@example.com',
    deliveryPreference: 'delivery',
    deliveryAddress: { city: 'Netanya', street: 'Herzl', house: '1' },
    holder: { data: { id: '9', attributes: { email: 'owner@shop.example', blocked: false } } },
    project: { data: { id: '3', attributes: { projectName: 'Book shop', linkToWebsite: 'shop.example', watsapplink: null } } },
    lines: {
      data: [
        { id: '2', attributes: { position: 2, quantity: 1, unitPrice: 10, lineTotal: 10, nameSnapshot: 'Bookmark', optionLabelSnapshot: null } },
        { id: '1', attributes: { position: 1, quantity: 2, unitPrice: 90, lineTotal: 180, nameSnapshot: 'Cookbook', optionLabelSnapshot: 'Hardcover' } }
      ]
    },
    ...over
  }
});

describe('mailOrderFromNode', () => {
  it('reads the buyer, the shop, the lines in order, and the holder as Reply-To', () => {
    const m = mailOrderFromNode(node(), null)!;
    expect(m.to).toBe('dana@example.com');
    expect(m.shopName).toBe('Book shop');
    expect(m.replyTo).toBe('owner@shop.example');
    expect(m.input.number).toBe('1042');
    expect(m.input.locale).toBe('en');
    expect(m.input.lines.map((l) => l.name)).toEqual(['Cookbook', 'Bookmark']);
    expect(m.input.delivery.addressLine).toBe('Herzl 1, Netanya');
    expect(m.input.canReply).toBe(true);
    expect(m.input.website).toBe('shop.example');
  });

  it('has no Reply-To for an arranged order nobody holds, or a blocked holder', () => {
    expect(mailOrderFromNode(node({ holder: { data: null } }), null)!.replyTo).toBeNull();
    const blocked = node({ holder: { data: { id: '9', attributes: { email: 'o@shop.example', blocked: true } } } });
    const m = mailOrderFromNode(blocked, null)!;
    expect(m.replyTo).toBeNull();
    expect(m.input.canReply).toBe(false);
  });

  it('is null without a usable address', () => {
    expect(mailOrderFromNode(node({ buyerEmail: null }), null)).toBeNull();
    expect(mailOrderFromNode(node({ buyerEmail: 'not an address' }), null)).toBeNull();
    expect(mailOrderFromNode(null, null)).toBeNull();
  });

  it('reads the shipping record and the tracking in the note', () => {
    const shipping = { optionId: 'm:z1:courier', kind: 'delivery', name: 'Courier', fee: 20, etaMinDays: 2, etaMaxDays: 4 };
    const m = mailOrderFromNode(node({ note: `הערה\n${trackingLine({ carrier: 'DHL', number: 'AB1', url: null })}` }), shipping)!;
    expect(m.input.delivery.method).toBe('Courier');
    expect(m.input.delivery.fee).toBe(20);
    expect(m.input.delivery.etaMaxDays).toBe(4);
    expect(m.input.tracking).toEqual({ carrier: 'DHL', number: 'AB1', url: null });
  });
});

function harness(over: Partial<MailDeps> = {}, nodeOver: Record<string, any> = {}) {
  const sent: any[] = [];
  const deps: MailDeps = {
    enabled: () => true,
    send: vi.fn(async (m) => {
      sent.push(m);
      return { ok: true };
    }),
    throttle: new MailThrottle(),
    ...over
  };
  const execute = vi.fn(async (qid: string) => {
    if (qid === 'orderMailByRef') return { data: { orders: { data: [node(nodeOver)] } } };
    // The shipping column is "not deployed": the probe sees a validation error.
    throw new Error(`unexpected ${qid}`);
  });
  const call = (actionKey: string, result: any, params: Record<string, any> = { projectId: '3' }) =>
    runOrderMail({ actionKey, params, result, fetchFn: globalThis.fetch, strapi: { execute } }, deps);
  return { sent, deps, execute, call };
}

describe('runOrderMail', () => {
  it('sends the paid mail in the buyer\'s language, from the shop, replying to the holder', async () => {
    const h = harness();
    const out = await h.call('createPaidOrder', { orderRef: '3:pi_1', status: 'paid' });
    expect(out).toEqual({ sent: true, kind: 'paid', to: 'dana@example.com' });
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toMatchObject({ fromName: 'Book shop', replyTo: 'owner@shop.example', to: 'dana@example.com' });
    expect(h.sent[0].subject).toBe('Book shop — payment received for order 1042');
    // Served by the service token, not a member's JWT.
    expect(h.execute.mock.calls[0]).toEqual(['orderMailByRef', { pid: '3', ref: '3:pi_1' }, undefined, globalThis.fetch]);
  });

  it('does nothing for a retry, a repeated cancel, or when switched off', async () => {
    const h = harness();
    expect(await h.call('createPaidOrder', { orderRef: 'r', status: 'paid', duplicated: true })).toMatchObject({ sent: false, reason: 'not-an-order-mail' });
    expect(await h.call('cancelOrder', { orderRef: 'r', status: 'cancelled', alreadyCancelled: true })).toMatchObject({ sent: false });
    const off = harness({ enabled: () => false });
    expect(await off.call('createPaidOrder', { orderRef: 'r', status: 'paid' })).toEqual({ sent: false, reason: 'disabled' });
    expect(h.sent).toHaveLength(0);
    expect(off.sent).toHaveLength(0);
    expect(off.execute).not.toHaveBeenCalled();
  });

  it('skips an order whose buyer left no address', async () => {
    const h = harness({}, { buyerEmail: null });
    expect(await h.call('markOrderShipped', { orderRef: 'r', status: 'shipped', changed: true })).toEqual({ sent: false, reason: 'no-address' });
    expect(h.sent).toHaveLength(0);
  });

  it('is throttled after the cap and says so without sending', async () => {
    const deps = { throttle: new MailThrottle({ perAddress: { max: 1, windowMs: 60_000 }, receivedPerRikma: { max: 5, windowMs: 60_000 } }) };
    const h = harness(deps);
    expect((await h.call('confirmOrderPayment', { orderRef: 'r', status: 'paid', changed: true })).sent).toBe(true);
    expect(await h.call('markOrderShipped', { orderRef: 'r', status: 'shipped', changed: true })).toEqual({ sent: false, reason: 'throttled' });
    expect(h.sent).toHaveLength(1);
  });

  it('never throws: a failed send or a failed read is an outcome', async () => {
    const failing = harness({ send: async () => ({ ok: false, error: 'boom' }) });
    expect(await failing.call('createPaidOrder', { orderRef: 'r', status: 'paid' })).toEqual({ sent: false, reason: 'send-failed' });

    const broken = harness();
    broken.execute.mockRejectedValueOnce(new Error('strapi down'));
    expect(await broken.call('createPaidOrder', { orderRef: 'r', status: 'paid' })).toEqual({ sent: false, reason: 'error' });
  });

  it('needs a project and an order reference', async () => {
    const h = harness();
    expect(await h.call('createPaidOrder', { status: 'paid' }, { projectId: '3' })).toEqual({ sent: false, reason: 'no-order' });
    expect(await h.call('createPaidOrder', { orderRef: 'r', status: 'paid' }, {})).toEqual({ sent: false, reason: 'no-order' });
  });
});
