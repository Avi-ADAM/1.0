import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import {
  orderNoteOf,
  orderNumberOf,
  orderSalesOf,
  refundDecisionOf,
  refundNoteOf,
  toOrderView,
  transitionOf,
  type OrderStatus,
  type RefundDecision,
  type StockChange
} from '$lib/server/ordersApi.js';
import { moveStock, type StockFields } from '$lib/shop/stock.js';
import { readStockFlags, writeStock } from '$lib/server/shop/stockFlags.js';
import type { ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';

/**
 * What happens to a paid order after it arrived (PLAN_SHOP_CUSTOMER_EXPERIENCE
 * §3.4, §5.4 — S3): shipped, fulfilled, or cancelled with a refund.
 *
 * - `markOrderShipped` / `markOrderFulfilled` — any member of the rikma: getting
 *   the parcel out is the rikma's work, not one person's. Asking twice is
 *   harmless (`same`); going backwards is refused, the timestamps would lie.
 * - `cancelOrder` — the order's **holder** only (the member whose till took the
 *   money; through the API, the key's owner). The refund corrects their own
 *   self-reported sales, and nobody else may make a claim about their money.
 *   Each sale gets the treatment `refundDecisionOf` gives it: a sale not yet in
 *   any split is reset to 0 by its holder; one already in a split is left as it
 *   is and the rikma is told. Nothing is deleted.
 *
 * An order still waiting for an arranged payment (`pendingPayment`,
 * PLAN_SHOP_OPERATIONS §5) is cancelled by any member: nothing was sold yet.
 *
 * Cancel is written so that a retry is safe: the sale resets are idempotent
 * (a 0/0 sale is `already`), the status is written after them, and the stock
 * comes back last — a cancel that died half way and is sent again finishes the
 * resets and never restocks twice.
 */

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };

async function loadOrder(strapi: Strapi, context: ActionContext, projectId: string, orderRef: string) {
  const res = await strapi.execute(
    'rikmaApiOrderByRef',
    { pid: projectId, ref: orderRef },
    context.jwt,
    context.fetch
  );
  const node = res?.data?.orders?.data?.[0];
  if (!node?.id) throw new ActionError('NOT_FOUND', `No order ${orderRef} in this rikma`);
  return node;
}

/** shipped / fulfilled — one handler, the target is the only difference. */
function markHandler(target: Extract<OrderStatus, 'shipped' | 'fulfilled'>): ActionExecutionHandler {
  return async (params, context, { strapi }) => {
    const projectId = String(params.projectId);
    const orderRef = String(params.orderRef);
    const node = await loadOrder(strapi, context, projectId, orderRef);
    const t = transitionOf(node.attributes?.status, target);
    if (t.kind === 'refused') throw new ActionError(t.code, t.message);
    if (t.kind === 'same') {
      return { orderRef, orderId: String(node.id), status: t.status, changed: false };
    }
    const now = new Date().toISOString();
    const data: Record<string, unknown> = { status: target };
    if (target === 'shipped') data.shippedAt = now;
    if (target === 'fulfilled') data.fulfilledAt = now;
    await strapi.execute('rikmaApiOrderUpdate', { id: node.id, data }, context.jwt, context.fetch);
    return { orderRef, orderId: String(node.id), status: target, changed: true, from: t.from };
  };
}

const cancelHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const orderRef = String(params.orderRef);
  const reason = typeof params.reason === 'string' && params.reason.trim() ? params.reason.trim().slice(0, 500) : null;
  const actorId = String(context.userId);

  const node = await loadOrder(strapi, context, projectId, orderRef);
  const a = node.attributes ?? {};
  // What people call this order — never the ref (UX_COPY_SHOP_SALES §10).
  const number = orderNumberOf(a.displayNumber, node.id);
  const holderId = a.holder?.data?.id != null ? String(a.holder.data.id) : null;

  // An arranged order whose money never arrived (PLAN_SHOP_OPERATIONS §5): no
  // sale, no stock, nobody's till — calling it off is any member's to do, and
  // there is nothing to refund. Once someone started recording the payment
  // (the holder is stamped first) it is theirs, like any paid order.
  const noRefund = { reset: [], afterSplit: [], notMine: [], already: [] };
  if (a.status === 'cancelled' && !holderId) {
    // Called off (or lapsed) before anyone was paid — a retry changes nothing.
    return { orderRef, orderId: String(node.id), status: 'cancelled', alreadyCancelled: true, refunds: noRefund, stockChanges: [] };
  }
  if (a.status === 'pendingPayment' && (!holderId || holderId === actorId)) {
    await strapi.execute(
      'rikmaApiOrderUpdate',
      { id: node.id, data: { status: 'cancelled', note: orderNoteOf(a.note ?? null, [`בוטל לפני תשלום${reason ? `: ${reason}` : ''}`]) } },
      context.jwt,
      context.fetch
    );
    return {
      orderRef,
      orderId: String(node.id),
      status: 'cancelled',
      alreadyCancelled: false,
      beforePayment: true,
      refunds: noRefund,
      restocked: false,
      stockChanges: []
    };
  }

  if (!holderId || holderId !== actorId) {
    throw new ActionError(
      'NOT_HOLDER',
      "Only the order's holder — the member whose till took the money — can refund it; ask them in the rikma"
    );
  }

  const t = transitionOf(a.status, 'cancelled');
  if (t.kind === 'refused') throw new ActionError(t.code, t.message);

  // 1. The sales, each as `refundDecisionOf` says. Idempotent by construction.
  const decisions: Record<RefundDecision, string[]> = { reset: [], afterSplit: [], notMine: [], already: [] };
  for (const sale of orderSalesOf(node)) {
    const decision = refundDecisionOf(sale, actorId);
    decisions[decision].push(sale.id);
    if (decision !== 'reset') continue;
    await strapi.execute(
      'saleRefundReset',
      { id: sale.id, in: 0, unit: 0, note: refundNoteOf(sale, number, reason) },
      context.jwt,
      context.fetch
    );
  }

  // A retried cancel: the status is already there — the resets above were the
  // part that might have been missing. The stock is never touched twice.
  if (t.kind === 'same') {
    return {
      orderRef,
      orderId: String(node.id),
      status: 'cancelled',
      alreadyCancelled: true,
      refunds: decisions,
      stockChanges: []
    };
  }

  // 2. The status, with the reason and what became of the sales in the note.
  const facts: string[] = [`בוטל${reason ? `: ${reason}` : ''}`];
  if (decisions.afterSplit.length)
    facts.push(`מכירות שכבר בחלוקה ולא שונו: ${decisions.afterSplit.join(', ')}`);
  if (decisions.notMine.length)
    facts.push(`מכירות של מחזיק אחר ולא שונו: ${decisions.notMine.join(', ')}`);
  await strapi.execute(
    'rikmaApiOrderUpdate',
    { id: node.id, data: { status: 'cancelled', note: orderNoteOf(a.note ?? null, facts) } },
    context.jwt,
    context.fetch
  );

  // 3. The stock — by default only for an order that never left the shelf: a
  //    parcel that was shipped is not back in stock because money went back.
  const restock = typeof params.restock === 'boolean' ? params.restock : t.from === 'paid';
  const stockChanges: StockChange[] = [];
  if (restock) {
    const view = toOrderView(node)!;
    // "Unlimited" is the flag once it is deployed: a variant oversold to -1
    // that is cancelled goes back to 0, it is not skipped (§2.5).
    const stockRun: ProbeRun = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);
    const variantStock = new Map<string, StockFields>();
    const productStock = new Map<string, StockFields>();
    const productIds = [
      ...new Set(view.lines.filter((l) => !l.variantId && l.productId).map((l) => l.productId!))
    ];
    const variantIds = [...new Set(view.lines.map((l) => l.variantId).filter((v): v is string => !!v))];
    const flags = await readStockFlags(stockRun, { productIds, variantIds });
    if (productIds.length) {
      const res = await strapi.execute('ordersApiProducts', { pid: projectId, ids: productIds }, context.jwt, context.fetch);
      for (const p of res?.data?.matanots?.data ?? []) {
        const q = p?.attributes?.quant;
        const unlimited = flags.products.get(String(p.id))?.unlimited ?? null;
        // A legacy product with no number reads as unlimited, as it always did.
        productStock.set(String(p.id), { quant: q == null ? (unlimited === false ? 0 : -1) : Number(q), unlimited });
      }
    }
    for (const line of view.lines) {
      const qty = Number(line.quantity ?? 0);
      if (!line.productId || !(qty > 0)) continue;
      try {
        if (line.variantId) {
          if (!variantStock.has(line.variantId)) {
            const res = await strapi.execute('saleVariantInfo', { id: line.variantId }, context.jwt, context.fetch);
            const q = res?.data?.productVariant?.data?.attributes?.quant;
            variantStock.set(line.variantId, {
              quant: q == null ? 0 : Number(q),
              unlimited: flags.variants.get(line.variantId)?.unlimited ?? null
            });
          }
          const next = moveStock(variantStock.get(line.variantId)!, qty);
          if (!next) continue;
          const stored = await writeStock(stockRun, { variantId: line.variantId }, next);
          variantStock.set(line.variantId, stored);
          stockChanges.push({ productId: line.productId, variantId: line.variantId, quant: stored.quant, unlimited: false });
        } else {
          const before = productStock.get(line.productId);
          const next = before && moveStock(before, qty);
          if (!next) continue;
          const stored = await writeStock(stockRun, { productId: line.productId }, next);
          productStock.set(line.productId, stored);
        }
      } catch (err) {
        console.warn('[cancelOrder] restock failed for line', line, err);
      }
    }
  }

  // 4. Tell the rikma — loudly when part of the refund is theirs to settle.
  const unsettled = decisions.afterSplit.length + decisions.notMine.length;
  if (notifier) {
    try {
      await notifier.notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
          templates: {
            title: unsettled
              ? { he: '↩️ הזמנה בוטלה — חלק מההחזר דורש החלטה', en: '↩️ Order cancelled — part of the refund needs a decision' }
              : { he: '↩️ הזמנה בוטלה והכסף הוחזר', en: '↩️ Order cancelled and refunded' },
            body: unsettled
              ? {
                  he: `הזמנה ${number} בוטלה. ${decisions.reset.length} מכירות אופסו; ${unsettled} מכירות כבר נכנסו לחלוקה או מוחזקות אצל חבר אחר, ולכן לא שונו — כדאי לסכם ביחד איך מיישבים את ההחזר.`,
                  en: `Order ${number} was cancelled. ${decisions.reset.length} sales were reset; ${unsettled} were already in a split or held by another member, so they were left as they are — agree together how to settle the refund.`
                }
              : {
                  he: `הזמנה ${number} בוטלה, והמכירות שלה אופסו (${decisions.reset.length}).${restock ? ' המלאי הוחזר.' : ''}`,
                  en: `Order ${number} was cancelled and its sales were reset (${decisions.reset.length}).${restock ? ' Stock was restored.' : ''}`
                }
          },
          intent: unsettled ? 'review' : 'outcome',
          metadata: { type: 'orderCancelled', url: `moach/${projectId}/sales`, priority: unsettled ? 'high' : 'normal' }
        },
        { projectId },
        null,
        context
      );
    } catch (err) {
      console.warn('[cancelOrder] notification failed:', err);
    }
  }

  return {
    orderRef,
    orderId: String(node.id),
    status: 'cancelled',
    alreadyCancelled: false,
    refunds: decisions,
    restocked: restock,
    stockChanges
  };
};

const memberRules = (what: string) => [
  { type: 'jwt' as const, errorMessage: `Must be authenticated to ${what}` },
  {
    type: 'projectMember' as const,
    config: { projectIdParam: 'projectId' },
    errorMessage: `Only rikma members can ${what}`
  }
];

const ORDER_PARAMS = {
  projectId: { type: 'string' as const, required: true },
  orderRef: { type: 'string' as const, required: true, description: '`<rikma>:<externalId>`, as POST /orders answered' }
};

/** The sales a run touched, and the products whose stock moved. */
const orderScopes = (p: Record<string, any>, r: any) => {
  const d = r?.data ?? r ?? {};
  const saleIds: string[] = d.refunds ? [...(d.refunds.reset ?? [])] : [];
  return scopeList([
    scope('project', p.projectId),
    ...saleIds.map((id) => scope('sale', id)),
    ...((d.stockChanges ?? []) as StockChange[]).map((c) => scope('product', c.productId))
  ]);
};

export const markOrderShippedConfig: ActionConfig = {
  key: 'markOrderShipped',
  description: 'Mark a paid order as shipped (any rikma member). Idempotent; never backwards.',
  graphqlOperation: markHandler('shipped'),
  paramSchema: ORDER_PARAMS,
  authRules: memberRules('update an order'),
  realtime: { scopes: orderScopes }
};

export const markOrderFulfilledConfig: ActionConfig = {
  key: 'markOrderFulfilled',
  description: 'Mark an order as delivered / picked up (any rikma member). Idempotent; never backwards.',
  graphqlOperation: markHandler('fulfilled'),
  paramSchema: ORDER_PARAMS,
  authRules: memberRules('update an order'),
  realtime: { scopes: orderScopes }
};

export const cancelOrderConfig: ActionConfig = {
  key: 'cancelOrder',
  description:
    "Cancel and refund a paid order (the order's holder only): self-reported sales not yet in a split are reset to 0 by their holder, sales already in a split are left and the rikma is told, stock comes back for an unshipped order. Retry-safe.",
  graphqlOperation: cancelHandler,
  paramSchema: {
    ...ORDER_PARAMS,
    reason: { type: 'string', required: false, description: 'Shown on the order and in the sales notes' },
    restock: {
      type: 'boolean',
      required: false,
      description: 'Return the items to stock. Default: only when the order was not shipped yet.'
    }
  },
  authRules: memberRules('cancel an order'),
  realtime: { scopes: orderScopes }
};
