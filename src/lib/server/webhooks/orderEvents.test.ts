/**
 * Order webhooks (§5.6): which events a run produces, and who hears them.
 *
 * The rule worth a red test: an existing task integration subscribed to
 * "every event" (empty `webhook_events`) must not start receiving sales.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.API_KEY_NONCE ||= 'test-nonce-that-is-definitely-long-enough-1234567890';

const { orderEventsFor, onOrderChanged } = await import('./orderEvents.js');
const { clearWebhookTargetCache } = await import('./targets.js');

describe('orderEventsFor', () => {
  it('a new paid order is order.paid, plus oversold and the stock it moved', () => {
    expect(
      orderEventsFor('createPaidOrder', {
        orderRef: '57:pi_1',
        oversold: true,
        stockChanges: [
          { productId: '1842', variantId: '77', quant: -2 },
          { productId: '1901', variantId: null, quant: 3 }
        ]
      })
    ).toEqual({
      order: ['order.paid', 'order.oversold'],
      stock: [{ productId: '1842', variantId: '77', quant: -2 }]
    });
  });

  it('a retry says nothing — the storefront already heard', () => {
    expect(orderEventsFor('createPaidOrder', { duplicated: true })).toEqual({ order: [], stock: [] });
    expect(orderEventsFor('cancelOrder', { alreadyCancelled: true })).toEqual({ order: [], stock: [] });
    expect(orderEventsFor('markOrderShipped', { changed: false })).toEqual({ order: [], stock: [] });
  });

  it('a status move is order.statusChanged', () => {
    expect(orderEventsFor('markOrderFulfilled', { changed: true }).order).toEqual(['order.statusChanged']);
    expect(orderEventsFor('cancelOrder', { alreadyCancelled: false }).order).toEqual(['order.statusChanged']);
  });
});

const ORDER = {
  id: '100',
  attributes: {
    ref: '57:pi_1',
    externalId: 'pi_1',
    status: 'paid',
    total: 620,
    currencyCode: 'ILS',
    buyerPhone: '050-0000000',
    lines: { data: [] },
    sales: { data: [] }
  }
};

function strapiWith(keys: Array<{ id: string; scopes: string[]; events?: string[] }>) {
  return {
    execute: vi.fn(async (qid: string) => {
      if (qid === 'tasksApiWebhookTargets') {
        return {
          data: {
            apiKeys: {
              data: keys.map((k) => ({
                id: k.id,
                attributes: {
                  name: `key ${k.id}`,
                  callback_url: `https://hooks.example/${k.id}`,
                  webhook_events: k.events ?? [],
                  scopes: k.scopes
                }
              }))
            }
          }
        };
      }
      if (qid === 'rikmaApiOrderByRef') return { data: { orders: { data: [ORDER] } } };
      throw new Error(`unexpected qid ${qid}`);
    })
  };
}

const posted = (fetchFn: any) =>
  fetchFn.mock.calls.map(([url, init]: any[]) => ({
    url,
    event: init.headers['X-1lev1-Event'],
    body: JSON.parse(init.body)
  }));

beforeEach(() => clearWebhookTargetCache());

describe('onOrderChanged', () => {
  const run = async (strapi: any, result: any, actionKey = 'createPaidOrder') => {
    const fetchFn = vi.fn(async () => ({ status: 200 }));
    await onOrderChanged({
      actionKey,
      params: { projectId: '57' },
      result,
      context: { userId: '9', jwt: 'x', lang: 'he', fetch: fetchFn } as any,
      strapi
    });
    return posted(fetchFn);
  };

  it('a task desk subscribed to "every event" hears nothing about sales', async () => {
    const sent = await run(strapiWith([{ id: '1', scopes: ['tasks:create', 'tasks:read'] }]), {
      orderRef: '57:pi_1',
      stockChanges: [{ productId: '1842', variantId: '77', quant: 1 }]
    });
    expect(sent).toEqual([]);
  });

  it('the storefront server hears order.paid — without the buyer', async () => {
    const sent = await run(strapiWith([{ id: '2', scopes: ['orders:create'] }]), { orderRef: '57:pi_1' });
    expect(sent.map((s: any) => [s.url, s.event])).toEqual([['https://hooks.example/2', 'order.paid']]);
    expect(sent[0].body.data.orderRef).toBe('57:pi_1');
    expect(JSON.stringify(sent[0].body)).not.toContain('050-0000000');
  });

  it('a catalog key hears stock, not orders', async () => {
    const sent = await run(strapiWith([{ id: '3', scopes: ['products:read'] }]), {
      orderRef: '57:pi_1',
      stockChanges: [{ productId: '1842', variantId: '77', quant: 1 }]
    });
    expect(sent.map((s: any) => s.event)).toEqual(['variant.stockChanged']);
    expect(sent[0].body.data).toMatchObject({ variantId: '77', quant: 1 });
  });

  it('respects an explicit subscription list', async () => {
    const sent = await run(
      strapiWith([{ id: '4', scopes: ['orders:read'], events: ['order.statusChanged'] }]),
      { orderRef: '57:pi_1' }
    );
    expect(sent).toEqual([]);
  });

  it('nobody interested ⇒ the order is not even read', async () => {
    const strapi = strapiWith([]);
    await run(strapi, { orderRef: '57:pi_1' });
    expect(strapi.execute.mock.calls.map(([qid]: any[]) => qid)).toEqual(['tasksApiWebhookTargets']);
  });
});
