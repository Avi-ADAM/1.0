/**
 * A lead follows its money (docs/inprogress/PLAN_LEADS.md §4.0, §5.5 — L3a).
 *
 * `offered` and `won` are never chosen from a form; this module is the only
 * writer of them:
 *  - an order linked to a lead, still before payment ⇒ `offered`;
 *  - a paid order, or a sale reported with `leadId` ⇒ `won`;
 *  - the order cancelled, nothing else linked ⇒ back to `talking`.
 *
 * A paid order with no lead is matched to an open lead by the buyer's phone
 * or email and linked (`linkOrder` in the log). A paid order with no match
 * creates nothing: a direct buyer is a customer, not a lead.
 *
 * Runs after the order/sale actions, fire-and-forget like the webhooks: a
 * lead that failed to follow never fails a paid order.
 */

import type { ActionContext } from '$lib/server/actions/types.js';
import { syncedStatus, stageOfOrder } from '$lib/leads/stage';
import { findSameContact, leadStore, recordActivity, updateLead, type LeadStore } from './store';

type Strapi = { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };

/** The actions after which a lead may have moved. */
export const LEAD_MONEY_ACTIONS = new Set([
  'createPaidOrder',
  'confirmOrderPayment',
  'cancelOrder',
  'expireOrder',
  'createSale'
]);

interface LeadMoney {
  id: string;
  projectId: string | null;
  status: string;
  orderIds: string[];
  orderStatuses: string[];
  saleIds: string[];
}

async function loadLeadMoney(store: LeadStore, leadId: string): Promise<LeadMoney | null> {
  const res = await store.run('leadMoneyOrders', { id: leadId });
  const node = res?.data?.lead?.data;
  if (!node?.id) return null;
  const a = node.attributes ?? {};
  const orders = (a.orders?.data ?? []) as any[];
  let saleIds: string[] = [];
  try {
    const s = await store.run('leadMoneySales', { id: leadId });
    saleIds = ((s?.data?.lead?.data?.attributes?.sales?.data ?? []) as any[]).map((r) => String(r.id));
  } catch {
    // `lead.sales` not deployed yet — a lead is then won through orders only.
  }
  return {
    id: String(node.id),
    projectId: a.project?.data?.id != null ? String(a.project.data.id) : null,
    status: a.status ?? 'new',
    orderIds: orders.map((o) => String(o.id)),
    orderStatuses: orders.map((o) => o.attributes?.status ?? null),
    saleIds
  };
}

/** Recompute one lead's stage and write it if the money moved it. Returns the new status, if any. */
async function settle(
  store: LeadStore,
  lead: LeadMoney,
  extra: { orderId?: string; saleId?: string; why: string }
): Promise<string | null> {
  const orderIds = extra.orderId && !lead.orderIds.includes(extra.orderId) ? [...lead.orderIds, extra.orderId] : null;
  const saleIds = extra.saleId && !lead.saleIds.includes(extra.saleId) ? [...lead.saleIds, extra.saleId] : null;
  const next = syncedStatus(
    { status: lead.status },
    { orderStatuses: lead.orderStatuses, saleCount: (saleIds ?? lead.saleIds).length }
  );
  if (!next && !orderIds && !saleIds) return null;

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { lastActivityAt: now };
  if (orderIds) patch.orders = orderIds;
  if (saleIds) patch.sales = saleIds;
  if (next) patch.status = next;
  await updateLead(store, lead.id, patch);

  if (orderIds || saleIds) {
    await recordActivity(store, { leadId: lead.id, kind: 'linkOrder', body: extra.why, at: now });
  }
  if (next) {
    await recordActivity(store, { leadId: lead.id, kind: 'statusChange', fromStatus: lead.status, toStatus: next, at: now });
  }
  return next;
}

export interface LeadMoved {
  leadId: string;
  from: string;
  to: string;
}

/** After an order action: the order's leads (or the open lead its buyer matches) follow it. */
export async function syncLeadsFromOrder(
  store: LeadStore,
  projectId: string,
  orderRef: string
): Promise<LeadMoved[]> {
  const res = await store.run('leadOrderLinks', { pid: projectId, ref: orderRef });
  const order = res?.data?.orders?.data?.[0];
  if (!order?.id) return [];
  const a = order.attributes ?? {};
  const orderId = String(order.id);
  let leadIds: string[] = ((a.leads?.data ?? []) as any[]).map((l) => String(l.id));

  let matched: string | null = null;
  if (!leadIds.length) {
    // Only money links a stranger's order to a lead (§5.5); an offer without a
    // lead is its own row in "in progress" and stays that way.
    if (stageOfOrder(a.status) !== 'won') return [];
    const same = await findSameContact(store, projectId, a.buyerEmail ?? null, a.buyerPhone ?? null);
    if (!same.open) return [];
    matched = same.open.id;
    leadIds = [matched];
  }

  const moved: LeadMoved[] = [];
  for (const id of leadIds) {
    const lead = await loadLeadMoney(store, id);
    if (!lead || lead.projectId !== projectId) continue;
    // The order just matched is not in the lead's list yet; count it as linked.
    const view = id === matched ? { ...lead, orderStatuses: [...lead.orderStatuses, a.status] } : lead;
    const to = await settle(store, view, { orderId: id === matched ? orderId : undefined, why: `order ${orderRef}` });
    if (to) moved.push({ leadId: id, from: lead.status, to });
  }
  return moved;
}

/** After `createSale` with a `leadId`: link the sale and let the lead become a customer. */
export async function syncLeadFromSale(
  store: LeadStore,
  projectId: string,
  leadId: string,
  saleId: string
): Promise<LeadMoved[]> {
  const lead = await loadLeadMoney(store, leadId);
  if (!lead || lead.projectId !== projectId) return [];
  const to = await settle(store, lead, { saleId, why: `sale ${saleId}` });
  return to ? [{ leadId, from: lead.status, to }] : [];
}

/** The order ref an order action worked on. */
function orderRefOf(actionKey: string, params: Record<string, any>, result: any): string | null {
  const r = result?.data ?? result ?? {};
  const ref = r.orderRef ?? params.orderRef;
  return typeof ref === 'string' && ref ? ref : null;
}

/** Entry point called by ActionService after a successful order or sale action. */
export async function syncLeadsAfterMoney(opts: {
  actionKey: string;
  params: Record<string, any>;
  result: any;
  context: ActionContext;
  strapi: Strapi;
}): Promise<LeadMoved[]> {
  const { actionKey, params, result, context, strapi } = opts;
  if (!LEAD_MONEY_ACTIONS.has(actionKey)) return [];
  const projectId = params?.projectId != null ? String(params.projectId) : '';
  if (!projectId) return [];
  const store = leadStore(strapi, context.fetch);

  let moved: LeadMoved[] = [];
  if (actionKey === 'createSale') {
    const r = result?.data ?? result ?? {};
    const saleId = r.saleId ?? r.id;
    if (!params.leadId || saleId == null) return [];
    moved = await syncLeadFromSale(store, projectId, String(params.leadId), String(saleId));
  } else {
    const r = result?.data ?? result ?? {};
    if (r.duplicated === true || r.changed === false || r.alreadyCancelled === true) return [];
    const ref = orderRefOf(actionKey, params, result);
    if (!ref) return [];
    moved = await syncLeadsFromOrder(store, projectId, ref);
  }

  if (moved.length) {
    const { announceLeadMoves } = await import('$lib/server/webhooks/leadEvents.js');
    await announceLeadMoves({ projectId, moved, strapi, fetchFn: context.fetch ?? globalThis.fetch });
  }
  return moved;
}
