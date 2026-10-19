// src/lib/server/webhooks/orderEvents.ts
//
// What a storefront hears about its orders (PLAN_SHOP_CUSTOMER_EXPERIENCE §5.6):
//
//   order.pendingPayment  — createPaidOrder wrote an arranged order, nothing charged yet
//   order.paid            — createPaidOrder wrote a new order (not a retry), or
//                           confirmOrderPayment recorded an arranged order's money
//   order.oversold        — …and stock did not cover it
//   order.statusChanged   — shipped / fulfilled / cancelled / lapsed (data.status)
//   variant.stockChanged  — a variant's stock moved (a sale, a restock)
//
// Same delivery as the task webhooks (dispatch.ts: signed, retried, bounded),
// same rule that nothing here may fail or slow the action that triggered it.
// Two differences, both on purpose:
//
//   • the body is the public order view (`toOrderView`) — never the buyer;
//   • a target gets an order event only if its key may read orders
//     (`mayReceive`): an empty `webhook_events` list means "every event", and
//     the task desks that subscribed that way never asked to hear about sales.

import type { ActionContext } from '$lib/server/actions/types.js';
import {
  mayReceive,
  orderWebhookBody,
  stockWebhookBody,
  toOrderView,
  type OrderWebhookEvent,
  type StockChange
} from '$lib/server/ordersApi.js';
import { deliver } from './dispatch.js';
import { getWebhookTargets, wants, type WebhookTarget } from './targets.js';

/** The actions that can produce an order event. */
export const ORDER_WEBHOOK_ACTIONS = new Set([
  'createPaidOrder',
  'confirmOrderPayment',
  'cancelOrder',
  // An arranged order that lapsed unpaid — the orders cron (arrangedExpiry.ts).
  'expireOrder',
  'markOrderShipped',
  'markOrderFulfilled',
  // A member's stock update in the moach (S5) — only variant.stockChanged.
  'setShopStock'
]);

type Strapi = { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };

/**
 * Which events did this run produce? Pure — the whole decision, before any
 * lookup, so a run that changed nothing (a retry, `same`) costs nothing.
 */
export function orderEventsFor(
  actionKey: string,
  result: any
): { order: OrderWebhookEvent[]; stock: StockChange[] } {
  const r = result?.data ?? result ?? {};
  const stock: StockChange[] = ((r.stockChanges ?? []) as StockChange[]).filter(
    (c) => !!c?.variantId
  );
  switch (actionKey) {
    case 'createPaidOrder':
      if (r.duplicated) return { order: [], stock: [] };
      if (r.status === 'pendingPayment') return { order: ['order.pendingPayment'], stock: [] };
      return { order: r.oversold ? ['order.paid', 'order.oversold'] : ['order.paid'], stock };
    case 'confirmOrderPayment':
      if (!r.changed) return { order: [], stock: [] };
      return { order: r.oversold ? ['order.paid', 'order.oversold'] : ['order.paid'], stock };
    case 'expireOrder':
      return { order: r.changed ? ['order.statusChanged'] : [], stock: [] };
    case 'markOrderShipped':
    case 'markOrderFulfilled':
      return { order: r.changed ? ['order.statusChanged'] : [], stock: [] };
    case 'cancelOrder':
      return { order: r.alreadyCancelled ? [] : ['order.statusChanged'], stock };
    case 'setShopStock':
      return { order: [], stock };
    default:
      return { order: [], stock: [] };
  }
}

/** Entry point called by ActionService after a successful order action. */
export async function onOrderChanged(opts: {
  actionKey: string;
  params: Record<string, any>;
  result: any;
  context: ActionContext;
  strapi: Strapi;
}): Promise<void> {
  const { actionKey, params, result, context, strapi } = opts;
  if (!ORDER_WEBHOOK_ACTIONS.has(actionKey)) return;

  const { order, stock } = orderEventsFor(actionKey, result);
  if (order.length === 0 && stock.length === 0) return;

  const projectId = params?.projectId != null ? String(params.projectId) : '';
  if (!projectId) return;
  const fetchFn = context.fetch ?? globalThis.fetch;

  const targets = await getWebhookTargets(projectId, strapi, fetchFn);
  const forEvent = (event: OrderWebhookEvent): WebhookTarget[] =>
    targets.filter((t) => wants(t, event) && mayReceive(t.scopes, event));
  if (![...order, 'variant.stockChanged' as const].some((e) => forEvent(e).length)) return;

  const sends: Promise<void>[] = [];

  if (order.some((e) => forEvent(e).length)) {
    const r = result?.data ?? result ?? {};
    const ref = r.orderRef ?? params.orderRef;
    let view = null;
    try {
      const res = await strapi.execute('rikmaApiOrderByRef', { pid: projectId, ref }, undefined, fetchFn);
      const node = res?.data?.orders?.data?.[0];
      view = node ? toOrderView(node) : null;
    } catch (e) {
      console.warn('[webhooks] could not read order', ref, e);
    }
    if (view) {
      for (const event of order) {
        const body = orderWebhookBody(event, projectId, view);
        const deliveryId = `${view.orderRef}-${event}-${Date.now()}`;
        for (const t of forEvent(event)) sends.push(deliver(t, body, event, deliveryId, fetchFn));
      }
    }
  }

  const stockTargets = forEvent('variant.stockChanged');
  for (const change of stockTargets.length ? stock : []) {
    const body = stockWebhookBody(projectId, change);
    const deliveryId = `variant-${change.variantId}-${Date.now()}`;
    for (const t of stockTargets) sends.push(deliver(t, body, 'variant.stockChanged', deliveryId, fetchFn));
  }

  await Promise.all(sends);
}
